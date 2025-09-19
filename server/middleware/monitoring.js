/**
 * Monitoring Middleware
 * Request monitoring, performance tracking, and metrics collection
 */

const monitoringService = require('../services/monitoringService');

/**
 * Request monitoring middleware
 * Tracks request/response metrics
 */
const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to capture response
  res.end = function(...args) {
    const duration = Date.now() - startTime;

    // Record metrics
    monitoringService.recordRequest(
      req.method,
      req.originalUrl,
      duration,
      res.statusCode,
      res.locals.error
    );

    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Database operation monitoring middleware
 * Tracks database query performance
 */
const databaseMonitoring = (operation, collection) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Store original json method
    const originalJson = res.json;

    // Override json method to capture database operation completion
    res.json = function(data) {
      const duration = Date.now() - startTime;

      // Record database metrics
      monitoringService.recordDatabaseOperation(
        operation,
        collection,
        duration,
        res.locals.dbError
      );

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * AI service monitoring middleware
 * Tracks AI API calls and performance
 */
const aiMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // Store original json method
  const originalJson = res.json;

  // Override json method to capture AI operation completion
  res.json = function(data) {
    const duration = Date.now() - startTime;

    // Extract tokens used from response if available
    const tokensUsed = data.tokensUsed || data.usage?.total_tokens || 0;

    // Record AI metrics
    monitoringService.recordAIMetrics(
      tokensUsed,
      duration,
      res.locals.aiError
    );

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Simulation monitoring middleware
 * Tracks circuit simulation sessions
 */
const simulationMonitoring = (action) => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Store original json method
    const originalJson = res.json;

    // Override json method to capture simulation operation
    res.json = function(data) {
      if (action === 'start' && data.success) {
        monitoringService.recordSimulationMetrics('start');
      } else if (action === 'end') {
        const duration = Date.now() - startTime;
        monitoringService.recordSimulationMetrics('end', duration, res.locals.simulationError);
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Error monitoring middleware
 * Captures and tracks application errors
 */
const errorMonitoring = (error, req, res, next) => {
  // Mark error in response locals for other middleware
  res.locals.error = error;

  // Determine error type and record appropriately
  if (req.originalUrl.includes('/ai/')) {
    res.locals.aiError = error;
  } else if (req.originalUrl.includes('/simulation/')) {
    res.locals.simulationError = error;
  } else if (error.name === 'MongoError' || error.name === 'ValidationError') {
    res.locals.dbError = error;
  }

  next(error);
};

/**
 * Health check endpoint handler
 */
const healthCheck = async (req, res) => {
  try {
    const healthStatus = await monitoringService.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Metrics endpoint handler
 */
const metricsEndpoint = async (req, res) => {
  try {
    const detailed = req.query.detailed === 'true';
    const metrics = detailed
      ? monitoringService.getDetailedMetrics()
      : monitoringService.getMetricsSummary();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      details: error.message
    });
  }
};

/**
 * Performance monitoring middleware
 * Adds performance headers to responses
 */
const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Add performance headers
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    res.setHeader('X-Server-Timing', `total;dur=${duration.toFixed(2)}`);
  });

  next();
};

module.exports = {
  requestMonitoring,
  databaseMonitoring,
  aiMonitoring,
  simulationMonitoring,
  errorMonitoring,
  healthCheck,
  metricsEndpoint,
  performanceMonitoring
};