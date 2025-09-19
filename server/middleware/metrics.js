/**
 * Prometheus Metrics Middleware
 * Application performance and business metrics
 */

const promClient = require('prom-client');
const expressPrometheus = require('express-prometheus-middleware');
const logger = require('../utils/logger');

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'embedded-platform',
  environment: process.env.NODE_ENV || 'development'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'embedded_platform_'
});

// HTTP Request Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'embedded_platform_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'user_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'embedded_platform_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// User Metrics
const activeUsers = new promClient.Gauge({
  name: 'embedded_platform_active_users',
  help: 'Number of currently active users'
});

const registeredUsers = new promClient.Counter({
  name: 'embedded_platform_registered_users_total',
  help: 'Total number of registered users'
});

const userSessions = new promClient.Counter({
  name: 'embedded_platform_user_sessions_total',
  help: 'Total number of user sessions'
});

// Project Metrics
const totalProjects = new promClient.Gauge({
  name: 'embedded_platform_projects_total',
  help: 'Total number of projects'
});

const activeProjects = new promClient.Gauge({
  name: 'embedded_platform_active_projects',
  help: 'Number of currently active projects'
});

const projectCreations = new promClient.Counter({
  name: 'embedded_platform_project_creations_total',
  help: 'Total number of projects created'
});

// AI Service Metrics
const aiRequestsTotal = new promClient.Counter({
  name: 'embedded_platform_ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'operation', 'status']
});

const aiTokensUsed = new promClient.Counter({
  name: 'embedded_platform_ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['model']
});

const aiRequestDuration = new promClient.Histogram({
  name: 'embedded_platform_ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// Circuit Simulation Metrics
const circuitSimulationsTotal = new promClient.Counter({
  name: 'embedded_platform_circuit_simulations_total',
  help: 'Total number of circuit simulations',
  labelNames: ['status']
});

const simulationDuration = new promClient.Histogram({
  name: 'embedded_platform_simulation_duration_seconds',
  help: 'Duration of circuit simulations in seconds',
  labelNames: ['complexity'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

const activeSimulations = new promClient.Gauge({
  name: 'embedded_platform_active_simulations',
  help: 'Number of currently running simulations'
});

// Hardware Integration Metrics
const connectedDevices = new promClient.Gauge({
  name: 'embedded_platform_connected_devices',
  help: 'Number of currently connected hardware devices'
});

const deviceOperations = new promClient.Counter({
  name: 'embedded_platform_device_operations_total',
  help: 'Total number of hardware device operations',
  labelNames: ['operation', 'device_type', 'status']
});

// Business Metrics
const revenueTotal = new promClient.Counter({
  name: 'embedded_platform_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['currency', 'source']
});

const subscriptionsActive = new promClient.Gauge({
  name: 'embedded_platform_subscriptions_active',
  help: 'Number of active subscriptions',
  labelNames: ['plan']
});

const conversionRate = new promClient.Gauge({
  name: 'embedded_platform_conversion_rate',
  help: 'User conversion rate (percentage)',
  labelNames: ['from', 'to']
});

// Error Metrics
const applicationErrors = new promClient.Counter({
  name: 'embedded_platform_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity']
});

// Performance Metrics
const databaseQueryDuration = new promClient.Histogram({
  name: 'embedded_platform_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

const cacheHitRatio = new promClient.Gauge({
  name: 'embedded_platform_cache_hit_ratio',
  help: 'Cache hit ratio (0-1)'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(registeredUsers);
register.registerMetric(userSessions);
register.registerMetric(totalProjects);
register.registerMetric(activeProjects);
register.registerMetric(projectCreations);
register.registerMetric(aiRequestsTotal);
register.registerMetric(aiTokensUsed);
register.registerMetric(aiRequestDuration);
register.registerMetric(circuitSimulationsTotal);
register.registerMetric(simulationDuration);
register.registerMetric(activeSimulations);
register.registerMetric(connectedDevices);
register.registerMetric(deviceOperations);
register.registerMetric(revenueTotal);
register.registerMetric(subscriptionsActive);
register.registerMetric(conversionRate);
register.registerMetric(applicationErrors);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHitRatio);

// Express Prometheus middleware
const expressPrometheusMiddleware = expressPrometheus({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  prefix: 'embedded_platform_',
  customLabels: ['user_type'],
  transformLabels: (labels, req) => {
    labels.user_type = req.user ? (req.user.role || 'user') : 'anonymous';
  }
});

// Metrics collection functions
const metrics = {
  // HTTP metrics
  recordHttpRequest: (method, route, statusCode, duration, userType = 'anonymous') => {
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode, user_type: userType }, duration / 1000);
  },

  // User metrics
  incrementActiveUsers: () => activeUsers.inc(),
  decrementActiveUsers: () => activeUsers.dec(),
  recordUserRegistration: () => registeredUsers.inc(),
  recordUserSession: () => userSessions.inc(),

  // Project metrics
  setTotalProjects: (count) => totalProjects.set(count),
  setActiveProjects: (count) => activeProjects.set(count),
  recordProjectCreation: () => projectCreations.inc(),

  // AI metrics
  recordAIRequest: (model, operation, status = 'success', tokens = 0) => {
    aiRequestsTotal.inc({ model, operation, status });
    if (tokens > 0) {
      aiTokensUsed.inc({ model }, tokens);
    }
  },

  recordAIDuration: (model, operation, duration) => {
    aiRequestDuration.observe({ model, operation }, duration / 1000);
  },

  // Simulation metrics
  recordCircuitSimulation: (status = 'success') => {
    circuitSimulationsTotal.inc({ status });
  },

  recordSimulationDuration: (complexity, duration) => {
    simulationDuration.observe({ complexity }, duration / 1000);
  },

  setActiveSimulations: (count) => activeSimulations.set(count),

  // Hardware metrics
  setConnectedDevices: (count) => connectedDevices.set(count),

  recordDeviceOperation: (operation, deviceType, status = 'success') => {
    deviceOperations.inc({ operation, device_type: deviceType, status });
  },

  // Business metrics
  recordRevenue: (amount, currency = 'usd', source = 'subscription') => {
    revenueTotal.inc({ currency, source }, amount);
  },

  setActiveSubscriptions: (count, plan = 'all') => {
    subscriptionsActive.set({ plan }, count);
  },

  setConversionRate: (rate, from = 'visitor', to = 'user') => {
    conversionRate.set({ from, to }, rate);
  },

  // Error metrics
  recordApplicationError: (type = 'unknown', severity = 'error') => {
    applicationErrors.inc({ type, severity });
  },

  // Database metrics
  recordDatabaseQuery: (operation, collection, duration) => {
    databaseQueryDuration.observe({ operation, collection }, duration / 1000);
  },

  // Cache metrics
  setCacheHitRatio: (ratio) => cacheHitRatio.set(ratio),

  // Get all metrics for monitoring
  getMetrics: () => register.metrics(),

  // Reset all metrics (for testing)
  reset: () => {
    register.resetMetrics();
    promClient.collectDefaultMetrics({ register });
  }
};

// Health check endpoint with metrics
const healthCheck = async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    metrics: {
      active_users: activeUsers.hashMap?.['']?.value || 0,
      total_projects: totalProjects.hashMap?.['']?.value || 0,
      ai_requests_today: aiRequestsTotal.hashMap?.['model:*operation:*status:*']?.value || 0
    }
  };

  try {
    // Add more health checks here
    healthcheck.services = {
      database: 'OK', // Add actual database check
      redis: 'OK',    // Add actual Redis check
      ai_service: 'OK' // Add actual AI service check
    };
  } catch (error) {
    healthcheck.services = {
      database: 'ERROR',
      redis: 'ERROR',
      ai_service: 'ERROR'
    };
    healthcheck.message = 'Service degradation detected';
  }

  const statusCode = healthcheck.message === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
};

// Metrics endpoint (protected)
const metricsEndpoint = async (req, res) => {
  try {
    const metricsData = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metricsData);
  } catch (error) {
    logger.logError(error, req, { endpoint: 'metrics' });
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
};

module.exports = {
  register,
  metrics,
  expressPrometheusMiddleware,
  healthCheck,
  metricsEndpoint,
  // Export individual metrics for direct use
  httpRequestDuration,
  activeUsers,
  aiRequestsTotal,
  circuitSimulationsTotal,
  applicationErrors
};