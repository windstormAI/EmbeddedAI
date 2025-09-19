# Embedded Systems Design Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the Embedded Systems Design Platform in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **MongoDB**: Version 5.0 or higher
- **Redis**: Version 6.0 or higher (optional, for caching)
- **Docker**: Version 20.0 or higher (for containerized deployment)
- **Nginx**: Version 1.20 or higher (for production reverse proxy)

### Hardware Requirements

#### Development
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 10GB free space

#### Production (Small Scale)
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended
- **Storage**: 50GB SSD minimum

#### Production (Large Scale)
- **RAM**: 32GB minimum
- **CPU**: 8 cores minimum
- **Storage**: 200GB SSD minimum

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/embedded-platform.git
cd embedded-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create environment files:

```bash
# Copy environment templates
cp .env.example .env
cp client/.env.example client/.env
```

Configure the following variables in `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/embedded_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORGANIZATION=your-org-id

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

### 4. Database Setup

#### Using Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install via package manager
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB service
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

#### Using MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI`

### 5. Start Development Server

```bash
# Start both client and server concurrently
npm run dev

# Or start individually
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Production Deployment

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-org/embedded-platform.git
cd embedded-platform

# Install dependencies
npm ci --production=false

# Build client
cd client
npm ci
npm run build
cd ..

# Create production environment file
cp .env.example .env.production
# Edit .env.production with production values
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'embedded-platform',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/embedded-platform`:

```nginx
# Upstream backend
upstream embedded_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /static/ {
        alias /path/to/embedded-platform/client/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://embedded_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # React app
    location / {
        try_files $uri $uri/ /index.html;
        root /path/to/embedded-platform/client/build;
        index index.html index.htm;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/embedded-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate Setup

Using Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/embedded
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongodb/init.js:/docker-entrypoint-initdb.d/init.js:ro
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=securepassword
      - MONGO_INITDB_DATABASE=embedded
    restart: unless-stopped

  redis:
    image: redis:7.0-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./client/build:/var/www/html:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
  uploads:
  logs:
```

### 2. Application Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app ./

# Create necessary directories
RUN mkdir -p uploads logs && chown -R nextjs:nodejs uploads logs

USER nextjs

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 3. Build and Deploy

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Scale application
docker-compose up -d --scale app=3
```

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Setup

```bash
# Launch EC2 instance (t3.medium or larger)
# Ubuntu 20.04 LTS, security group with ports 22, 80, 443

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### 2. MongoDB Atlas Setup

1. Create MongoDB Atlas cluster
2. Configure VPC peering or whitelist IP
3. Get connection string for application

#### 3. S3 Setup for File Storage

```bash
# Install AWS CLI
pip3 install awscli --upgrade

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://your-embedded-platform-bucket

# Update environment variables
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-embedded-platform-bucket
```

### Vercel/Netlify Deployment (Frontend Only)

For frontend-only deployment with backend API:

```bash
# Build client
cd client
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod --dir=build
```

## Environment Configuration

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | Yes |
| `PORT` | Server port | 3001 | No |
| `CLIENT_URL` | Frontend URL | http://localhost:3000 | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE` | JWT expiration time | 7d | No |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | 30d | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 | No |
| `SMTP_HOST` | SMTP server host | - | No |
| `SMTP_PORT` | SMTP server port | 587 | No |
| `SMTP_USER` | SMTP username | - | No |
| `SMTP_PASS` | SMTP password | - | No |
| `UPLOAD_PATH` | File upload directory | ./uploads | No |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | 10485760 | No |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 | No |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:3000 | No |

## Database Setup

### MongoDB Configuration

```javascript
// Database connection with options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
});

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
```

### Database Indexes

```javascript
// Create indexes for better performance
const createIndexes = async () => {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });

    // Project indexes
    await Project.collection.createIndex({ user: 1, createdAt: -1 });
    await Project.collection.createIndex({ user: 1, status: 1 });
    await Project.collection.createIndex({ isPublic: 1, createdAt: -1 });
    await Project.collection.createIndex({ tags: 1 });
    await Project.collection.createIndex({ category: 1 });
    await Project.collection.createIndex({ difficulty: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run

# View certificate info
sudo certbot certificates
```

### Manual SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Other security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

## Monitoring and Logging

### Application Monitoring

```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'embedded-platform' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production then log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### Health Check Endpoint

```javascript
// Health check middleware
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    // Check Redis connection (if used)
    if (redisClient) {
      await redisClient.ping();
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

## Backup and Recovery

### Database Backup

```bash
# MongoDB backup script
#!/bin/bash

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="embedded_platform_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db embedded --out $BACKUP_DIR/$BACKUP_NAME

# Compress backup
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$BACKUP_NAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

### Automated Backup with Cron

```bash
# Add to crontab for daily backups at 2 AM
crontab -e
# 0 2 * * * /path/to/backup-script.sh
```

### File System Backup

```bash
# Backup uploads and logs
#!/bin/bash

BACKUP_DIR="/var/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/app/uploads

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /path/to/app/logs

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or use PM2
pm2 stop all
pm2 delete all
```

#### 2. MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection
mongosh --eval "db.adminCommand('ismaster')"
```

#### 3. Memory Issues

```bash
# Check memory usage
free -h

# Check Node.js memory usage
pm2 monit

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Renew certificate manually
sudo certbot renew --force-renewal

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Performance Issues

```bash
# Check system resources
top
htop
iostat -x 1

# Check application logs
pm2 logs

# Profile Node.js application
npm install -g clinic
clinic doctor -- node server/index.js
```

### Log Analysis

```bash
# Search for errors in logs
grep "ERROR" logs/combined.log | tail -20

# Count HTTP status codes
grep "HTTP/" logs/access.log | awk '{print $9}' | sort | uniq -c | sort -nr

# Monitor real-time logs
pm2 logs --lines 100
```

### Performance Optimization

```javascript
// Enable gzip compression
const compression = require('compression');
app.use(compression());

// Enable caching
const cache = require('memory-cache');
app.use((req, res, next) => {
  // Cache static assets for 1 hour
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Database query optimization
const optimizedQuery = Project.find({ user: userId })
  .select('name description createdAt updatedAt')
  .sort({ updatedAt: -1 })
  .limit(20)
  .lean(); // Use lean() for read-only queries
```

## Support

For additional support:
- Check the [API Documentation](./api-documentation.yml)
- Review application logs
- Monitor system resources
- Contact the development team

---

**Last Updated**: December 2023
**Version**: 1.0.0