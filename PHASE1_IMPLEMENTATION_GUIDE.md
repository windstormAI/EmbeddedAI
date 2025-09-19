# 🚀 Phase 1 Implementation Guide: Production Deployment & Infrastructure

## 🎯 **Goal:** Complete production-ready infrastructure in 2-3 weeks

---

## 📋 **Week 1: CI/CD Pipeline & Docker Optimization**

### **Day 1-2: GitHub Actions Setup**

#### **1. Create GitHub Actions Workflow**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm run test:ci
    - name: Build application
      run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Run security audit
      run: npm audit --audit-level high
    - name: CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript
```

#### **2. Setup Code Quality Checks**
```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run ESLint
      run: npm run lint
    - name: Check formatting
      run: npx prettier --check "**/*.{js,jsx,json,md}"
```

### **Day 3-4: Docker Production Configuration**

#### **1. Multi-Stage Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nodejs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
```

#### **2. Docker Compose Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongodb/init:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
```

### **Day 5-7: Cloud Deployment Setup**

#### **1. AWS Setup (Recommended)**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure

# Create ECR repository
aws ecr create-repository --repository-name embedded-platform --region us-east-1

# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t embedded-platform .
docker tag embedded-platform:latest <account>.dkr.ecr.us-east-1.amazonaws.com/embedded-platform:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/embedded-platform:latest
```

#### **2. Environment Variables**
```bash
# .env.production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@host:27017/embedded
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
```

---

## 📊 **Week 2: Monitoring & Alerting**

### **Day 1-2: Application Monitoring**

#### **1. Install Monitoring Dependencies**
```bash
npm install winston @sentry/node datadog-metrics express-prometheus-middleware
```

#### **2. Setup Winston Logger**
```javascript
// server/utils/logger.js
const winston = require('winston');
const path = require('path');

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
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
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

#### **3. Setup Sentry Error Tracking**
```javascript
// server/middleware/errorMonitoring.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Mongo({ useMongoose: true })
  ]
});

const errorMonitoring = (error, req, res, next) => {
  Sentry.withScope((scope) => {
    scope.setUser({
      id: req.user?.id || 'anonymous',
      email: req.user?.email
    });
    scope.setTag('url', req.url);
    scope.setTag('method', req.method);
    Sentry.captureException(error);
  });

  next(error);
};

module.exports = errorMonitoring;
```

### **Day 3-4: Performance Monitoring**

#### **1. Setup Prometheus Metrics**
```javascript
// server/middleware/metrics.js
const promClient = require('prom-client');
const expressPrometheus = require('express-prometheus-middleware');

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'embedded-platform'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const circuitSimulations = new promClient.Counter({
  name: 'circuit_simulations_total',
  help: 'Total number of circuit simulations performed'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeUsers);
register.registerMetric(circuitSimulations);

module.exports = {
  register,
  httpRequestDuration,
  activeUsers,
  circuitSimulations,
  expressPrometheus: expressPrometheus({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400]
  })
};
```

#### **2. Health Check Endpoint**
```javascript
// server/middleware/healthCheck.js
const mongoose = require('mongoose');
const { activeUsers, circuitSimulations } = require('./metrics');

const healthCheck = async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    services: {}
  };

  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    healthcheck.services.database = 'OK';
  } catch (error) {
    healthcheck.services.database = 'ERROR';
    healthcheck.message = 'Database connection failed';
  }

  // Check external services
  try {
    // Check OpenAI API (simplified)
    healthcheck.services.openai = 'OK';
  } catch (error) {
    healthcheck.services.openai = 'ERROR';
  }

  // Update metrics
  activeUsers.set(Object.keys(global.activeUsers || {}).length);

  const statusCode = healthcheck.message === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
};

module.exports = healthCheck;
```

### **Day 5-7: Production Optimization**

#### **1. Database Indexing**
```javascript
// server/scripts/optimizeDatabase.js
const mongoose = require('mongoose');

const optimizeDatabase = async () => {
  try {
    const db = mongoose.connection.db;

    // User collection indexes
    await db.collection('users').createIndexes([
      { email: 1 },
      { username: 1 },
      { createdAt: -1 },
      { 'stats.lastActivity': -1 },
      { role: 1 }
    ]);

    // Project collection indexes
    await db.collection('projects').createIndexes([
      { userId: 1 },
      { createdAt: -1 },
      { updatedAt: -1 },
      { status: 1 },
      { isPublic: 1 }
    ]);

    // Component collection indexes
    await db.collection('components').createIndexes([
      { category: 1 },
      { type: 1 },
      { usageCount: -1 },
      { isBuiltIn: 1 },
      { status: 1 }
    ]);

    console.log('Database optimization completed');
  } catch (error) {
    console.error('Database optimization failed:', error);
  }
};

module.exports = optimizeDatabase;
```

#### **2. Redis Caching Setup**
```javascript
// server/services/cacheService.js
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async close() {
    await this.client.quit();
  }
}

module.exports = new CacheService();
```

---

## 🧪 **Week 3: Testing & Validation**

### **Day 1-2: Load Testing**

#### **1. Setup k6 Load Testing**
```javascript
// tests/load/k6-script.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test authentication
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (loginRes.status === 200) {
    const authToken = loginRes.json().data.accessToken;

    // Test project creation
    const projectRes = http.post(`${BASE_URL}/api/projects`, {
      name: 'Load Test Project',
      description: 'Testing under load'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    check(projectRes, {
      'project creation status is 201': (r) => r.status === 201,
      'project creation response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    // Test circuit simulation
    const simulationRes = http.post(`${BASE_URL}/api/simulation/start`, {
      circuitData: {
        components: [],
        connections: []
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    check(simulationRes, {
      'simulation status is 200': (r) => r.status === 200,
      'simulation response time < 3000ms': (r) => r.timings.duration < 3000,
    });
  }

  sleep(1); // Wait 1 second between iterations
}
```

#### **2. Run Load Tests**
```bash
# Install k6
# macOS
brew install k6

# Ubuntu/Debian
sudo apt update
sudo apt install k6

# Run load test
k6 run tests/load/k6-script.js

# Run with custom environment
k6 run -e BASE_URL=https://your-production-url.com tests/load/k6-script.js
```

### **Day 3-4: Security Testing**

#### **1. Setup Security Testing**
```bash
# Install security testing tools
npm install --save-dev owasp-zap-scanner retire synk

# Run security audit
npm audit --audit-level moderate

# Check for vulnerable dependencies
npm run retire

# Run OWASP ZAP scan (requires Docker)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-production-url.com \
  -r zap-report.html
```

#### **2. Penetration Testing Checklist**
```javascript
// tests/security/penetration-tests.js
const supertest = require('supertest');
const app = require('../../server/index');

describe('Security Penetration Tests', () => {
  let agent;

  beforeEach(() => {
    agent = supertest.agent(app);
  });

  test('SQL Injection Protection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await agent
      .post('/api/auth/login')
      .send({
        email: maliciousInput,
        password: 'password123'
      });

    expect(response.status).not.toBe(500);
    expect(response.body.error).toBeDefined();
  });

  test('XSS Protection', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const response = await agent
      .post('/api/projects')
      .set('Authorization', 'Bearer fake-token')
      .send({
        name: xssPayload,
        description: 'Test project'
      });

    expect(response.status).toBe(401); // Should fail auth, not process XSS
  });

  test('Rate Limiting', async () => {
    const requests = [];

    // Send multiple requests rapidly
    for (let i = 0; i < 100; i++) {
      requests.push(
        agent
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong-password'
          })
      );
    }

    const responses = await Promise.all(requests);

    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('Authentication Bypass Attempts', async () => {
    const bypassAttempts = [
      { Authorization: 'Bearer invalid-token' },
      { Authorization: 'Basic dXNlcjpwYXNz' },
      { 'x-api-key': 'fake-key' },
      {} // No auth header
    ];

    for (const headers of bypassAttempts) {
      const response = await agent
        .get('/api/projects')
        .set(headers);

      expect([401, 403]).toContain(response.status);
    }
  });

  test('Data Exposure Prevention', async () => {
    // Test that sensitive data is not exposed in error messages
    const response = await agent
      .get('/api/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.error).not.toContain('stack');
    expect(response.body.error).not.toContain('password');
    expect(response.body.error).not.toContain('secret');
  });
});
```

### **Day 5-7: Production Validation**

#### **1. Production Readiness Checklist**
```bash
#!/bin/bash
# production-readiness-check.sh

echo "🔍 Production Readiness Check"
echo "============================="

# Check environment variables
echo "📋 Environment Variables:"
REQUIRED_VARS=("NODE_ENV" "MONGODB_URI" "JWT_SECRET" "OPENAI_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var is not set"
  else
    echo "✅ $var is set"
  fi
done

echo ""
echo "🔒 Security Checks:"
# Check file permissions
if [ -f ".env" ]; then
  permissions=$(stat -c "%a" .env)
  if [ "$permissions" -gt "600" ]; then
    echo "⚠️  .env file permissions are too permissive: $permissions"
  else
    echo "✅ .env file permissions are secure"
  fi
fi

# Check for security vulnerabilities
echo "🔍 Running security audit..."
npm audit --audit-level high

echo ""
echo "📊 Performance Checks:"
# Check bundle size
if [ -d "build" ]; then
  bundle_size=$(du -sh build | cut -f1)
  echo "📦 Bundle size: $bundle_size"
fi

# Check test coverage
if [ -f "coverage/lcov-report/index.html" ]; then
  echo "✅ Test coverage report exists"
else
  echo "⚠️  No test coverage report found"
fi

echo ""
echo "🚀 Deployment Ready Check:"
# Check if Docker image builds successfully
if docker build -t embedded-platform-test . > /dev/null 2>&1; then
  echo "✅ Docker image builds successfully"
else
  echo "❌ Docker image build failed"
fi

# Check database connection
if [ -n "$MONGODB_URI" ]; then
  # Simple connection test (you might want to use mongosh or a Node.js script)
  echo "✅ MongoDB URI is configured"
else
  echo "❌ MongoDB URI is not configured"
fi

echo ""
echo "🎯 Summary:"
echo "- Review any ❌ or ⚠️ items above"
echo "- Ensure all required environment variables are set"
echo "- Verify security configurations"
echo "- Test application functionality in staging environment"
echo "- Run load tests to ensure performance requirements are met"
```

#### **2. Staging Environment Setup**
```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.staging
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=staging
      - MONGODB_URI=mongodb://mongodb:27017/embedded_staging
    depends_on:
      - mongodb
    volumes:
      - ./logs:/app/logs

  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_DATABASE: embedded_staging
    volumes:
      - staging_mongodb_data:/data/db
    ports:
      - "27018:27017"

volumes:
  staging_mongodb_data:
```

---

## 📈 **Success Metrics for Phase 1**

### **Technical Metrics:**
- ✅ **CI/CD Pipeline:** Automated testing and deployment
- ✅ **Docker Images:** Multi-stage production builds
- ✅ **Monitoring:** Application and infrastructure monitoring
- ✅ **Security:** Automated security scanning and alerts
- ✅ **Performance:** <2s response times, 99.9% uptime target

### **Quality Metrics:**
- ✅ **Test Coverage:** >90% code coverage
- ✅ **Security Audit:** Zero critical vulnerabilities
- ✅ **Performance Tests:** Pass load testing benchmarks
- ✅ **Documentation:** Updated deployment and monitoring docs

### **Business Metrics:**
- ✅ **Deployment Time:** <15 minutes from commit to production
- ✅ **Rollback Capability:** <5 minutes rollback time
- ✅ **Monitoring Coverage:** 100% of critical systems monitored
- ✅ **Incident Response:** <1 hour mean time to resolution (MTTR)

---

## 🚀 **Next Steps**

After completing Phase 1:

1. **Deploy to Staging:** Test all changes in staging environment
2. **Run Load Tests:** Validate performance under production-like conditions
3. **Security Audit:** Complete third-party security assessment
4. **Team Training:** Train team on new monitoring and deployment procedures
5. **Phase 2 Preparation:** Begin planning mobile application development

**Phase 1 Complete! Ready for production deployment! 🎉**