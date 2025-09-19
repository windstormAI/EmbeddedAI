#!/bin/bash

# AI-Embedded Systems Design Platform - Production Deployment Script
# This script handles the complete deployment process for production environments

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="embedded-platform"
DOCKER_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if required tools are installed
    command -v docker >/dev/null 2>&1 || { log_error "Docker is not installed. Aborting."; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { log_error "Node.js is not installed. Aborting."; exit 1; }

    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured. Aborting."; exit 1; }

    # Check environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        required_vars=("MONGODB_URI" "JWT_SECRET" "OPENAI_API_KEY" "STRIPE_SECRET_KEY")
        for var in "${required_vars[@]}"; do
            if [ -z "${!var}" ]; then
                log_error "Required environment variable $var is not set. Aborting."
                exit 1
            fi
        done
    fi

    log_success "Pre-deployment checks passed"
}

# Build application
build_application() {
    log_info "Building application..."

    # Install dependencies
    npm ci

    # Run linting
    npm run lint

    # Run tests
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run test:ci
    fi

    # Build application
    npm run build

    log_success "Application built successfully"
}

# Build Docker images
build_docker_images() {
    log_info "Building Docker images..."

    # Build main application image
    docker build -t ${PROJECT_NAME}:latest -f Dockerfile .

    # Build staging image if needed
    if [ "$ENVIRONMENT" = "staging" ]; then
        docker build -t ${PROJECT_NAME}:staging -f Dockerfile.staging .
    fi

    log_success "Docker images built successfully"
}

# Push to container registry
push_to_registry() {
    log_info "Pushing images to container registry..."

    # Login to ECR
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $DOCKER_REGISTRY

    # Tag and push images
    if [ "$ENVIRONMENT" = "production" ]; then
        docker tag ${PROJECT_NAME}:latest $DOCKER_REGISTRY/${PROJECT_NAME}:latest
        docker tag ${PROJECT_NAME}:latest $DOCKER_REGISTRY/${PROJECT_NAME}:production-$(date +%Y%m%d-%H%M%S)
        docker push $DOCKER_REGISTRY/${PROJECT_NAME}:latest
        docker push $DOCKER_REGISTRY/${PROJECT_NAME}:production-$(date +%Y%m%d-%H%M%S)
    else
        docker tag ${PROJECT_NAME}:staging $DOCKER_REGISTRY/${PROJECT_NAME}:staging
        docker push $DOCKER_REGISTRY/${PROJECT_NAME}:staging
    fi

    log_success "Images pushed to registry"
}

# Deploy to ECS
deploy_to_ecs() {
    log_info "Deploying to ECS..."

    # Update ECS service
    if [ "$ENVIRONMENT" = "production" ]; then
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-production \
            --service ${PROJECT_NAME}-service \
            --force-new-deployment \
            --region $REGION
    else
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-staging \
            --service ${PROJECT_NAME}-service \
            --force-new-deployment \
            --region $REGION
    fi

    # Wait for deployment to complete
    log_info "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --services ${PROJECT_NAME}-service \
        --region $REGION

    log_success "Deployment completed successfully"
}

# Run database migrations
run_database_migrations() {
    log_info "Running database migrations..."

    # Run MongoDB migrations
    if [ -f "server/scripts/migrate.js" ]; then
        node server/scripts/migrate.js
    fi

    # Seed database if needed
    if [ "$ENVIRONMENT" = "staging" ] && [ ! -f ".db-seeded" ]; then
        log_info "Seeding database..."
        node server/scripts/seed.js
        touch .db-seeded
    fi

    log_success "Database migrations completed"
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."

    # Wait for service to be healthy
    MAX_ATTEMPTS=30
    ATTEMPT=1

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi

        log_info "Health check attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying..."
        sleep 10
        ((ATTEMPT++))
    done

    log_error "Health check failed after $MAX_ATTEMPTS attempts"
    return 1
}

# Rollback function
rollback() {
    log_warning "Deployment failed, initiating rollback..."

    # Rollback ECS service
    aws ecs update-service \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --service ${PROJECT_NAME}-service \
        --task-definition ${PROJECT_NAME}-${ENVIRONMENT}:$(($(aws ecs describe-services --cluster ${PROJECT_NAME}-${ENVIRONMENT} --services ${PROJECT_NAME}-service --region $REGION --query 'services[0].taskDefinition' --output text | awk -F: '{print $NF}') - 1)) \
        --region $REGION

    log_info "Rollback completed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log_info "Running post-deployment tasks..."

    # Update CloudFront distribution if needed
    if [ "$ENVIRONMENT" = "production" ]; then
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
            --paths "/*" \
            --region $REGION
    fi

    # Send deployment notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 ${PROJECT_NAME} deployed to ${ENVIRONMENT} successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi

    log_success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    log_info "Starting deployment to $ENVIRONMENT environment..."

    # Trap errors for rollback
    trap rollback ERR

    pre_deployment_checks
    build_application
    build_docker_images
    push_to_registry
    deploy_to_ecs
    run_database_migrations
    run_health_checks
    post_deployment_tasks

    log_success "🎉 Deployment to $ENVIRONMENT completed successfully!"
    log_info "Application is now live at: https://your-domain.com"
}

# Show usage
usage() {
    echo "Usage: $0 [environment]"
    echo "  environment: production (default) or staging"
    echo ""
    echo "Required environment variables for production:"
    echo "  MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY"
    echo "  AWS_REGION, AWS_ACCOUNT_ID, CLOUDFRONT_DISTRIBUTION_ID (optional)"
    echo "  SLACK_WEBHOOK_URL (optional)"
}

# Parse arguments
case "$1" in
    -h|--help)
        usage
        exit 0
        ;;
    staging|production|"")
        ENVIRONMENT=${1:-production}
        ;;
    *)
        log_error "Invalid environment: $1"
        usage
        exit 1
        ;;
esac

# Run main deployment
main "$@"