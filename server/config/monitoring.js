/**
 * Monitoring Configuration
 * Application monitoring and alerting configuration
 */

module.exports = {
  // Health check configuration
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    services: {
      database: {
        enabled: true,
        timeout: 2000
      },
      redis: {
        enabled: process.env.REDIS_URL ? true : false,
        timeout: 2000
      },
      external: {
        enabled: false,
        endpoints: []
      }
    }
  },

  // Metrics configuration
  metrics: {
    enabled: true,
    collectionInterval: 30000, // 30 seconds
    retention: {
      requestMetrics: 1000, // Keep last 1000 request metrics
      systemMetrics: 100, // Keep last 100 system metrics
      slowQueries: 100 // Keep last 100 slow queries
    },
    thresholds: {
      responseTime: {
        warning: 1000, // 1 second
        critical: 5000 // 5 seconds
      },
      errorRate: {
        warning: 5, // 5%
        critical: 10 // 10%
      },
      memoryUsage: {
        warning: 80, // 80%
        critical: 90 // 90%
      },
      cpuUsage: {
        warning: 70, // 70%
        critical: 85 // 85%
      }
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: {
      console: {
        enabled: true,
        level: 'debug'
      },
      file: {
        enabled: true,
        level: 'info',
        filename: 'logs/app.log',
        maxsize: '10m',
        maxFiles: 5
      },
      errorFile: {
        enabled: true,
        level: 'error',
        filename: 'logs/error.log',
        maxsize: '10m',
        maxFiles: 5
      }
    }
  },

  // Alerting configuration
  alerting: {
    enabled: process.env.ALERTING_ENABLED === 'true',
    providers: {
      email: {
        enabled: false,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
      },
      slack: {
        enabled: false,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts'
      },
      webhook: {
        enabled: false,
        url: process.env.ALERT_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.ALERT_WEBHOOK_TOKEN
        }
      }
    },
    rules: {
      highErrorRate: {
        enabled: true,
        condition: 'errorRate > 10',
        severity: 'critical',
        message: 'High error rate detected: {errorRate}%'
      },
      highResponseTime: {
        enabled: true,
        condition: 'avgResponseTime > 5000',
        severity: 'warning',
        message: 'High average response time: {avgResponseTime}ms'
      },
      highMemoryUsage: {
        enabled: true,
        condition: 'memoryUsage > 90',
        severity: 'critical',
        message: 'High memory usage: {memoryUsage}%'
      },
      databaseConnectionLost: {
        enabled: true,
        condition: 'dbStatus !== "connected"',
        severity: 'critical',
        message: 'Database connection lost'
      }
    }
  },

  // Performance monitoring
  performance: {
    enabled: true,
    slowQueryThreshold: 100, // ms
    memoryLeakDetection: {
      enabled: true,
      threshold: 100 * 1024 * 1024, // 100MB
      interval: 300000 // 5 minutes
    },
    profiling: {
      enabled: process.env.NODE_ENV === 'development',
      heapdump: {
        enabled: false,
        interval: 3600000 // 1 hour
      }
    }
  },

  // External monitoring integration
  external: {
    datadog: {
      enabled: false,
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
      tags: ['service:embedded-platform', 'env:' + (process.env.NODE_ENV || 'development')]
    },
    newrelic: {
      enabled: false,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: 'Embedded Platform API'
    },
    prometheus: {
      enabled: false,
      port: 9090,
      path: '/metrics',
      collectDefaultMetrics: true
    }
  },

  // Security monitoring
  security: {
    enabled: true,
    rateLimitViolations: {
      enabled: true,
      threshold: 10, // violations per minute
      window: 60000 // 1 minute
    },
    suspiciousActivity: {
      enabled: true,
      patterns: [
        /union.*select/i,
        /script.*alert/i,
        /\.\./,
        /eval\(/i
      ]
    },
    failedAuthentications: {
      enabled: true,
      threshold: 5, // failed attempts per minute
      window: 60000 // 1 minute
    }
  }
};