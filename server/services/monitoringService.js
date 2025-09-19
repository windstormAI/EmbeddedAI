/**
 * Monitoring Service
 * Application monitoring, metrics collection, and health checks
 */

const os = require('os');
const mongoose = require('mongoose');

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        responseTimes: [],
        errors: 0
      },
      database: {
        connections: 0,
        operations: new Map(),
        errors: 0,
        slowQueries: []
      },
      system: {
        memoryUsage: [],
        cpuUsage: [],
        uptime: 0
      },
      ai: {
        requests: 0,
        tokensUsed: 0,
        errors: 0,
        responseTimes: []
      },
      simulation: {
        activeSessions: 0,
        totalSessions: 0,
        errors: 0,
        averageDuration: 0
      }
    };

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  /**
   * Record HTTP request metrics
   */
  recordRequest(method, url, responseTime, statusCode, error = null) {
    // Increment total requests
    this.metrics.requests.total++;

    // Record by endpoint (simplified path)
    const endpoint = this.simplifyEndpoint(url);
    const endpointKey = `${method} ${endpoint}`;
    this.metrics.requests.byEndpoint.set(
      endpointKey,
      (this.metrics.requests.byEndpoint.get(endpointKey) || 0) + 1
    );

    // Record by method
    this.metrics.requests.byMethod.set(
      method,
      (this.metrics.requests.byMethod.get(method) || 0) + 1
    );

    // Record response time
    this.metrics.requests.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }

    // Record errors
    if (statusCode >= 400 || error) {
      this.metrics.requests.errors++;
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(operation, collection, duration, error = null) {
    const opKey = `${operation}:${collection}`;
    this.metrics.database.operations.set(
      opKey,
      (this.metrics.database.operations.get(opKey) || 0) + 1
    );

    if (error) {
      this.metrics.database.errors++;
    }

    // Record slow queries (>100ms)
    if (duration > 100) {
      this.metrics.database.slowQueries.push({
        operation,
        collection,
        duration,
        timestamp: new Date()
      });

      // Keep only last 100 slow queries
      if (this.metrics.database.slowQueries.length > 100) {
        this.metrics.database.slowQueries.shift();
      }
    }
  }

  /**
   * Record AI service metrics
   */
  recordAIMetrics(tokensUsed, responseTime, error = null) {
    this.metrics.ai.requests++;
    this.metrics.ai.tokensUsed += tokensUsed;
    this.metrics.ai.responseTimes.push(responseTime);

    if (error) {
      this.metrics.ai.errors++;
    }

    // Keep only last 100 response times
    if (this.metrics.ai.responseTimes.length > 100) {
      this.metrics.ai.responseTimes.shift();
    }
  }

  /**
   * Record simulation metrics
   */
  recordSimulationMetrics(action, duration = null, error = null) {
    switch (action) {
      case 'start':
        this.metrics.simulation.activeSessions++;
        this.metrics.simulation.totalSessions++;
        break;
      case 'end':
        this.metrics.simulation.activeSessions = Math.max(0, this.metrics.simulation.activeSessions - 1);
        if (duration) {
          // Update average duration
          const currentAvg = this.metrics.simulation.averageDuration;
          const totalSessions = this.metrics.simulation.totalSessions;
          this.metrics.simulation.averageDuration =
            (currentAvg * (totalSessions - 1) + duration) / totalSessions;
        }
        break;
    }

    if (error) {
      this.metrics.simulation.errors++;
    }
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    const dbStatus = await this.checkDatabaseHealth();
    const systemStatus = this.getSystemHealth();

    const overallStatus = (dbStatus.healthy && systemStatus.healthy) ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
        system: systemStatus
      },
      metrics: this.getMetricsSummary()
    };
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();

      // Check MongoDB connection
      await mongoose.connection.db.admin().ping();

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        connections: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        connections: 'disconnected'
      };
    }
  }

  /**
   * Get system health metrics
   */
  getSystemHealth() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;

    return {
      healthy: memoryUsagePercent < 90 && loadAverage[0] < cpuCount * 2,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        systemUsedPercent: Math.round(memoryUsagePercent)
      },
      cpu: {
        loadAverage: loadAverage.map(avg => Math.round(avg * 100) / 100),
        cores: cpuCount
      },
      uptime: os.uptime()
    };
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const avgResponseTime = this.calculateAverage(this.metrics.requests.responseTimes);
    const avgAIResponseTime = this.calculateAverage(this.metrics.ai.responseTimes);

    return {
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: this.metrics.requests.total > 0 ?
          Math.round((this.metrics.requests.errors / this.metrics.requests.total) * 100) : 0
      },
      database: {
        operations: Object.fromEntries(this.metrics.database.operations),
        errors: this.metrics.database.errors,
        slowQueriesCount: this.metrics.database.slowQueries.length
      },
      ai: {
        requests: this.metrics.ai.requests,
        tokensUsed: this.metrics.ai.tokensUsed,
        errors: this.metrics.ai.errors,
        averageResponseTime: Math.round(avgAIResponseTime)
      },
      simulation: {
        activeSessions: this.metrics.simulation.activeSessions,
        totalSessions: this.metrics.simulation.totalSessions,
        errors: this.metrics.simulation.errors,
        averageDuration: Math.round(this.metrics.simulation.averageDuration)
      }
    };
  }

  /**
   * Get detailed metrics
   */
  getDetailedMetrics() {
    return {
      ...this.getMetricsSummary(),
      requests: {
        ...this.getMetricsSummary().requests,
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
        byMethod: Object.fromEntries(this.metrics.requests.byMethod),
        recentResponseTimes: this.metrics.requests.responseTimes.slice(-50)
      },
      database: {
        ...this.getMetricsSummary().database,
        recentSlowQueries: this.metrics.database.slowQueries.slice(-10)
      },
      ai: {
        ...this.getMetricsSummary().ai,
        recentResponseTimes: this.metrics.ai.responseTimes.slice(-50)
      },
      system: this.getSystemHealth()
    };
  }

  /**
   * Start system metrics collection
   */
  startSystemMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.metrics.system.memoryUsage.push({
        timestamp: new Date(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });

      this.metrics.system.cpuUsage.push({
        timestamp: new Date(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // Keep only last 100 entries
      if (this.metrics.system.memoryUsage.length > 100) {
        this.metrics.system.memoryUsage.shift();
      }
      if (this.metrics.system.cpuUsage.length > 100) {
        this.metrics.system.cpuUsage.shift();
      }
    }, 30000);

    // Update database connection count
    setInterval(() => {
      this.metrics.database.connections = mongoose.connection.readyState;
    }, 5000);
  }

  /**
   * Simplify endpoint path for metrics
   */
  simplifyEndpoint(url) {
    // Remove query parameters
    const path = url.split('?')[0];

    // Replace dynamic segments with placeholders
    return path
      .replace(/\/[0-9a-fA-F]{24}/g, '/:id') // MongoDB ObjectId
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/\/[^\/]+/g, (match) => {
        // Replace other dynamic segments
        if (match.includes('-') || match.length > 20) {
          return '/:param';
        }
        return match;
      });
  }

  /**
   * Calculate average of array
   */
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        responseTimes: [],
        errors: 0
      },
      database: {
        connections: 0,
        operations: new Map(),
        errors: 0,
        slowQueries: []
      },
      system: {
        memoryUsage: [],
        cpuUsage: [],
        uptime: 0
      },
      ai: {
        requests: 0,
        tokensUsed: 0,
        errors: 0,
        responseTimes: []
      },
      simulation: {
        activeSessions: 0,
        totalSessions: 0,
        errors: 0,
        averageDuration: 0
      }
    };
  }
}

module.exports = new MonitoringService();