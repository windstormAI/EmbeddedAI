/**
 * Advanced Monitoring and Analytics Service
 * Real-time monitoring, predictive analytics, and insights
 */

const { v4: uuidv4 } = require('uuid');

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.dashboards = new Map();
    this.analytics = new Map();
    this.predictiveModels = new Map();

    this.initializeMetrics();
  }

  /**
   * Initialize monitoring metrics
   */
  initializeMetrics() {
    // System metrics
    this.metrics.set('system', {
      cpu: { current: 0, history: [], threshold: 80 },
      memory: { current: 0, history: [], threshold: 90 },
      disk: { current: 0, history: [], threshold: 85 },
      network: { current: 0, history: [], threshold: 1000 }
    });

    // Application metrics
    this.metrics.set('application', {
      responseTime: { current: 0, history: [], threshold: 1000 },
      errorRate: { current: 0, history: [], threshold: 5 },
      throughput: { current: 0, history: [], threshold: 100 },
      activeUsers: { current: 0, history: [], threshold: 1000 }
    });

    // Device metrics
    this.metrics.set('devices', {
      online: { current: 0, history: [] },
      offline: { current: 0, history: [] },
      error: { current: 0, history: [] },
      battery: { current: 0, history: [], threshold: 20 }
    });

    // Project metrics
    this.metrics.set('projects', {
      active: { current: 0, history: [] },
      completed: { current: 0, history: [] },
      failed: { current: 0, history: [] },
      avgBuildTime: { current: 0, history: [] }
    });
  }

  /**
   * Record metric data
   */
  recordMetric(category, metric, value, timestamp = new Date()) {
    const categoryMetrics = this.metrics.get(category);
    if (!categoryMetrics || !categoryMetrics[metric]) return;

    const metricData = categoryMetrics[metric];
    metricData.current = value;
    metricData.history.push({
      value,
      timestamp: timestamp.toISOString()
    });

    // Keep only last 1000 data points
    if (metricData.history.length > 1000) {
      metricData.history.shift();
    }

    // Check thresholds and create alerts
    if (metricData.threshold && value > metricData.threshold) {
      this.createAlert(category, metric, value, metricData.threshold);
    }
  }

  /**
   * Create alert for threshold violation
   */
  createAlert(category, metric, value, threshold) {
    const alertId = uuidv4();
    const alert = {
      id: alertId,
      category,
      metric,
      type: 'threshold',
      severity: value > threshold * 1.5 ? 'critical' : 'warning',
      message: `${category} ${metric} exceeded threshold: ${value} > ${threshold}`,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);

    // Trigger alert notifications
    this.notifyAlert(alert);

    return alert;
  }

  /**
   * Get metric data
   */
  getMetrics(category = null, timeRange = '1h') {
    if (category) {
      return this.metrics.get(category) || {};
    }

    // Return all metrics filtered by time range
    const result = {};
    const now = new Date();
    const timeLimit = new Date(now.getTime() - this.parseTimeRange(timeRange));

    for (const [cat, catMetrics] of this.metrics) {
      result[cat] = {};
      for (const [metric, data] of Object.entries(catMetrics)) {
        result[cat][metric] = {
          current: data.current,
          history: data.history.filter(point =>
            new Date(point.timestamp) > timeLimit
          )
        };
      }
    }

    return result;
  }

  /**
   * Get alerts
   */
  getAlerts(status = 'active', limit = 50) {
    const alerts = Array.from(this.alerts.values());

    let filtered = alerts;
    if (status === 'active') {
      filtered = alerts.filter(alert => !alert.resolved);
    } else if (status === 'resolved') {
      filtered = alerts.filter(alert => alert.resolved);
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    }
    return alert;
  }

  /**
   * Create dashboard
   */
  createDashboard(config) {
    const dashboardId = uuidv4();
    const dashboard = {
      id: dashboardId,
      name: config.name,
      description: config.description,
      widgets: config.widgets || [],
      layout: config.layout || 'grid',
      public: config.public || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  /**
   * Get dashboard data
   */
  getDashboardData(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const data = {
      dashboard,
      metrics: {},
      charts: []
    };

    // Populate dashboard with current metric data
    for (const widget of dashboard.widgets) {
      if (widget.type === 'metric') {
        const metricData = this.getMetrics(widget.category);
        data.metrics[widget.id] = metricData[widget.category]?.[widget.metric];
      } else if (widget.type === 'chart') {
        data.charts.push(this.generateChartData(widget));
      }
    }

    return data;
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(timeRange = '7d', categories = ['all']) {
    const reportId = uuidv4();
    const report = {
      id: reportId,
      timeRange,
      categories,
      generatedAt: new Date().toISOString(),
      summary: {},
      trends: {},
      anomalies: [],
      recommendations: []
    };

    // Generate summary statistics
    report.summary = this.generateSummaryStats(timeRange, categories);

    // Analyze trends
    report.trends = this.analyzeTrends(timeRange, categories);

    // Detect anomalies
    report.anomalies = this.detectAnomalies(timeRange, categories);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    this.analytics.set(reportId, report);
    return report;
  }

  /**
   * Predictive maintenance analysis
   */
  async predictiveMaintenance(deviceId, sensorData) {
    const predictionId = uuidv4();
    const prediction = {
      id: predictionId,
      deviceId,
      timestamp: new Date().toISOString(),
      predictions: [],
      confidence: 0,
      recommendations: []
    };

    // Analyze sensor data for failure prediction
    const analysis = this.analyzeSensorData(sensorData);

    prediction.predictions = analysis.predictions;
    prediction.confidence = analysis.confidence;
    prediction.recommendations = analysis.recommendations;

    // Store prediction
    if (!this.predictiveModels.has(deviceId)) {
      this.predictiveModels.set(deviceId, []);
    }
    this.predictiveModels.get(deviceId).push(prediction);

    // Create alerts for critical predictions
    for (const pred of prediction.predictions) {
      if (pred.probability > 0.8 && pred.timeToFailure < 7 * 24 * 60 * 60 * 1000) { // 7 days
        this.createAlert('devices', 'predictive', pred.probability, 0.8);
      }
    }

    return prediction;
  }

  // Helper methods

  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // 1 hour default
    }
  }

  notifyAlert(alert) {
    // In real implementation, send notifications via email, SMS, webhook, etc.
    console.log('ALERT:', alert.message);
  }

  generateChartData(widget) {
    const timeRange = widget.timeRange || '1h';
    const metrics = this.getMetrics(widget.category, timeRange);

    return {
      id: widget.id,
      type: widget.chartType,
      title: widget.title,
      data: metrics[widget.category]?.[widget.metric]?.history || [],
      config: widget.config
    };
  }

  generateSummaryStats(timeRange, categories) {
    const summary = {};
    const metrics = this.getMetrics(null, timeRange);

    for (const category of categories) {
      if (category === 'all' || categories.includes(category)) {
        summary[category] = {};

        for (const [metric, data] of Object.entries(metrics[category] || {})) {
          const values = data.history.map(h => h.value);
          summary[category][metric] = {
            current: data.current,
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
          };
        }
      }
    }

    return summary;
  }

  analyzeTrends(timeRange, categories) {
    const trends = {};
    const metrics = this.getMetrics(null, timeRange);

    for (const category of categories) {
      if (category === 'all' || categories.includes(category)) {
        trends[category] = {};

        for (const [metric, data] of Object.entries(metrics[category] || {})) {
          const values = data.history.map(h => h.value);
          if (values.length < 2) continue;

          // Simple linear trend analysis
          const trend = this.calculateTrend(values);
          trends[category][metric] = {
            direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            slope: trend,
            changePercent: ((values[values.length - 1] - values[0]) / values[0]) * 100
          };
        }
      }
    }

    return trends;
  }

  detectAnomalies(timeRange, categories) {
    const anomalies = [];
    const metrics = this.getMetrics(null, timeRange);

    for (const category of categories) {
      if (category === 'all' || categories.includes(category)) {
        for (const [metric, data] of Object.entries(metrics[category] || {})) {
          const values = data.history.map(h => h.value);
          if (values.length < 10) continue;

          const anomaly = this.detectMetricAnomaly(values, metric, category);
          if (anomaly) {
            anomalies.push(anomaly);
          }
        }
      }
    }

    return anomalies;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Analyze summary for recommendations
    const summary = report.summary;

    if (summary.system?.cpu?.average > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'High CPU usage detected. Consider optimizing code or upgrading hardware.',
        category: 'system'
      });
    }

    if (summary.application?.errorRate?.average > 2) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High error rate detected. Review error logs and implement better error handling.',
        category: 'application'
      });
    }

    if (summary.devices?.offline?.current > summary.devices?.online?.current) {
      recommendations.push({
        type: 'connectivity',
        priority: 'medium',
        message: 'More devices offline than online. Check network connectivity and device health.',
        category: 'devices'
      });
    }

    return recommendations;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  detectMetricAnomaly(values, metric, category) {
    if (values.length < 10) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const recentValues = values.slice(-5);
    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    // Check if recent values deviate significantly from overall mean
    const deviation = Math.abs(recentMean - mean);
    const threshold = stdDev * 2; // 2 standard deviations

    if (deviation > threshold) {
      return {
        metric,
        category,
        type: recentMean > mean ? 'spike' : 'drop',
        severity: deviation > threshold * 2 ? 'high' : 'medium',
        deviation,
        threshold,
        timestamp: new Date().toISOString(),
        description: `${metric} showing unusual ${recentMean > mean ? 'increase' : 'decrease'}`
      };
    }

    return null;
  }

  analyzeSensorData(sensorData) {
    // Mock predictive analysis
    const predictions = [];
    const recommendations = [];

    // Temperature analysis
    if (sensorData.temperature > 80) {
      predictions.push({
        component: 'temperature_sensor',
        failure: 'overheating',
        probability: 0.85,
        timeToFailure: 2 * 24 * 60 * 60 * 1000, // 2 days
        confidence: 0.8
      });
      recommendations.push('Reduce operating temperature or improve cooling');
    }

    // Vibration analysis
    if (sensorData.vibration > 100) {
      predictions.push({
        component: 'motor',
        failure: 'bearing_wear',
        probability: 0.7,
        timeToFailure: 5 * 24 * 60 * 60 * 1000, // 5 days
        confidence: 0.75
      });
      recommendations.push('Inspect motor bearings and lubrication');
    }

    // Current analysis
    if (sensorData.current > 2.0) {
      predictions.push({
        component: 'power_supply',
        failure: 'overload',
        probability: 0.6,
        timeToFailure: 7 * 24 * 60 * 60 * 1000, // 1 week
        confidence: 0.7
      });
      recommendations.push('Check power consumption and consider load balancing');
    }

    return {
      predictions,
      confidence: 0.75,
      recommendations
    };
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId) {
    return this.dashboards.get(dashboardId);
  }

  /**
   * Get all dashboards
   */
  getAllDashboards() {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get analytics report by ID
   */
  getAnalyticsReport(reportId) {
    return this.analytics.get(reportId);
  }

  /**
   * Get predictive maintenance data for device
   */
  getPredictiveData(deviceId) {
    return this.predictiveModels.get(deviceId) || [];
  }

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId) {
    this.dashboards.delete(dashboardId);
  }
}

module.exports = new MonitoringService();