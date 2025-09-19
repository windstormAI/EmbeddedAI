/**
 * Winston Logger Configuration
 * Production-ready logging with multiple transports
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'embedded-platform',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Security events log
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;

        if (Object.keys(meta).length > 0 && meta.stack) {
          log += `\n${meta.stack}`;
        }

        return log;
      })
    )
  }));
}

// Custom logging methods
logger.logRequest = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else if (duration > 1000) {
      logger.warn('Slow HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

logger.logError = (error, req = null, additionalData = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...additionalData
  };

  if (req) {
    errorData.url = req.url;
    errorData.method = req.method;
    errorData.ip = req.ip;
    errorData.userId = req.user?.id || 'anonymous';
  }

  logger.error('Application Error', errorData);
};

logger.logSecurity = (event, data = {}) => {
  const securityData = {
    event,
    timestamp: new Date().toISOString(),
    ...data
  };

  logger.warn('Security Event', securityData);
};

logger.logPerformance = (operation, duration, data = {}) => {
  const perfData = {
    operation,
    duration: `${duration}ms`,
    ...data
  };

  if (duration > 1000) {
    logger.warn('Performance Issue', perfData);
  } else {
    logger.info('Performance Metric', perfData);
  }
};

logger.logDatabase = (operation, collection, data = {}) => {
  const dbData = {
    operation,
    collection,
    ...data
  };

  logger.info('Database Operation', dbData);
};

logger.logAI = (operation, model, tokens = 0, data = {}) => {
  const aiData = {
    operation,
    model,
    tokensUsed: tokens,
    ...data
  };

  logger.info('AI Operation', aiData);
};

module.exports = logger;