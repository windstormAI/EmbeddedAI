/**
 * Sentry Error Monitoring Middleware
 * Production error tracking and reporting
 */

const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection()
  ],
  beforeSend: (event, hint) => {
    // Filter out sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers['x-api-key'];
        delete event.request.headers.cookie;
      }

      // Remove sensitive data from request body
      if (event.request.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[FILTERED]';
          }
        });
      }
    }

    // Add custom tags
    event.tags = {
      ...event.tags,
      service: 'embedded-platform-api',
      version: process.env.npm_package_version || '1.0.0'
    };

    return event;
  },
  beforeBreadcrumb: (breadcrumb, hint) => {
    // Filter sensitive data from breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      if (breadcrumb.data.url && breadcrumb.data.url.includes('auth')) {
        breadcrumb.data.url = '[FILTERED_AUTH_URL]';
      }
    }

    return breadcrumb;
  }
});

// Error monitoring middleware
const errorMonitoring = (error, req, res, next) => {
  // Create Sentry scope for this request
  Sentry.withScope((scope) => {
    // Add request context
    if (req) {
      scope.setUser({
        id: req.user?.id || 'anonymous',
        email: req.user?.email,
        ip_address: req.ip
      });

      scope.setContext('request', {
        url: req.url,
        method: req.method,
        headers: {
          'user-agent': req.get('User-Agent'),
          'accept': req.get('Accept'),
          'content-type': req.get('Content-Type')
        },
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      });

      scope.setTag('url', req.url);
      scope.setTag('method', req.method);
      scope.setTag('user_id', req.user?.id || 'anonymous');
    }

    // Add error context
    scope.setContext('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode || error.status
    });

    // Add application context
    scope.setContext('application', {
      node_version: process.version,
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });

    // Capture the exception
    Sentry.captureException(error);

    // Log the error
    logger.logError(error, req, {
      sentry_event_id: Sentry.lastEventId(),
      user_id: req?.user?.id,
      url: req?.url,
      method: req?.method
    });
  });

  next(error);
};

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const start = process.hrtime.bigint();

  // Add performance monitoring to response
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) {
      logger.logPerformance('http_request', duration, {
        url: req.url,
        method: req.method,
        status: res.statusCode,
        user_id: req.user?.id
      });

      // Send to Sentry for performance monitoring
      Sentry.withScope((scope) => {
        scope.setTag('performance', 'slow_request');
        scope.setContext('performance', {
          duration_ms: duration,
          url: req.url,
          method: req.method,
          status_code: res.statusCode
        });

        Sentry.captureMessage(`Slow request: ${req.method} ${req.url}`, 'warning');
      });
    }

    // Add performance header
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });

  next();
};

// Database error monitoring
const databaseMonitoring = (operation, collection, error, data = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('database_error', 'true');
    scope.setContext('database', {
      operation,
      collection,
      error_message: error.message,
      ...data
    });

    Sentry.captureException(error);
  });

  logger.logError(error, null, {
    operation,
    collection,
    ...data
  });
};

// AI service error monitoring
const aiMonitoring = (operation, model, error, data = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('ai_error', 'true');
    scope.setContext('ai', {
      operation,
      model,
      error_message: error.message,
      ...data
    });

    Sentry.captureException(error);
  });

  logger.logError(error, null, {
    operation,
    model,
    ...data
  });
};

// Circuit simulation error monitoring
const simulationMonitoring = (simulationId, error, data = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('simulation_error', 'true');
    scope.setContext('simulation', {
      simulation_id: simulationId,
      error_message: error.message,
      ...data
    });

    Sentry.captureException(error);
  });

  logger.logError(error, null, {
    simulation_id: simulationId,
    ...data
  });
};

// Security event monitoring
const securityMonitoring = (event, data = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('security_event', event);
    scope.setContext('security', {
      event,
      timestamp: new Date().toISOString(),
      ...data
    });

    Sentry.captureMessage(`Security Event: ${event}`, 'warning');
  });

  logger.logSecurity(event, data);
};

// Graceful shutdown handler
const gracefulShutdown = () => {
  Sentry.close(2000).then(() => {
    logger.info('Sentry closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  errorMonitoring,
  performanceMonitoring,
  databaseMonitoring,
  aiMonitoring,
  simulationMonitoring,
  securityMonitoring,
  gracefulShutdown
};