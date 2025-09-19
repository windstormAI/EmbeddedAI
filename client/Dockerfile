# Multi-stage build for React application
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Dependencies stage
FROM base AS dependencies

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM base AS dev-dependencies

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force

# Build stage
FROM dev-dependencies AS build

# Copy source code
COPY . .

# Set environment variables for build
ARG REACT_APP_API_URL
ARG REACT_APP_GITHUB_CLIENT_ID
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ARG REACT_APP_ENVIRONMENT

ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_GITHUB_CLIENT_ID=${REACT_APP_GITHUB_CLIENT_ID}
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=${REACT_APP_STRIPE_PUBLISHABLE_KEY}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]