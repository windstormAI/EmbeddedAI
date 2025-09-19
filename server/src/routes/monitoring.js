/**
 * Monitoring and Analytics Routes
 * API endpoints for system monitoring, analytics, and predictive maintenance
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const MonitoringService = require('../services/monitoringService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Record metric data
 * @route   POST /api/monitoring/metrics
 * @access  Private
 */
router.post('/metrics', [
  body('category')
    .isIn(['system', 'application', 'devices', 'projects'])
    .withMessage('Invalid metric category'),
  body('metric')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid metric name'),
  body('value')
    .isNumeric()
    .withMessage('Value must be numeric'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Invalid timestamp format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { category, metric, value, timestamp } = req.body;

    MonitoringService.recordMetric(category, metric, value, timestamp ? new Date(timestamp) : undefined);

    res.json({
      success: true,
      message: 'Metric recorded successfully'
    });

  } catch (error) {
    console.error('Metric recording failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record metric'
    });
  }
});

/**
 * @desc    Get metrics data
 * @route   GET /api/monitoring/metrics
 * @access  Private
 */
router.get('/metrics', async (req, res) => {
  try {
    const { category, timeRange = '1h' } = req.query;

    const metrics = MonitoringService.getMetrics(category, timeRange);

    res.json({
      success: true,
      data: metrics,
      timeRange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get metrics failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * @desc    Get alerts
 * @route   GET /api/monitoring/alerts
 * @access  Private
 */
router.get('/alerts', async (req, res) => {
  try {
    const { status = 'active', limit = 50 } = req.query;

    const alerts = MonitoringService.getAlerts(status, parseInt(limit));

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });

  } catch (error) {
    console.error('Get alerts failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

/**
 * @desc    Acknowledge alert
 * @route   PUT /api/monitoring/alerts/:alertId/acknowledge
 * @access  Private
 */
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = MonitoringService.acknowledgeAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Alert acknowledge failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

/**
 * @desc    Resolve alert
 * @route   PUT /api/monitoring/alerts/:alertId/resolve
 * @access  Private
 */
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = MonitoringService.resolveAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Alert resolve failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

/**
 * @desc    Create dashboard
 * @route   POST /api/monitoring/dashboards
 * @access  Private
 */
router.post('/dashboards', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Dashboard name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('widgets')
    .optional()
    .isArray()
    .withMessage('Widgets must be an array'),
  body('layout')
    .optional()
    .isIn(['grid', 'masonry', 'flex'])
    .withMessage('Invalid layout type'),
  body('public')
    .optional()
    .isBoolean()
    .withMessage('Public must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const dashboard = MonitoringService.createDashboard(req.body);

    res.status(201).json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Dashboard creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dashboard'
    });
  }
});

/**
 * @desc    Get dashboard data
 * @route   GET /api/monitoring/dashboards/:dashboardId
 * @access  Private
 */
router.get('/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const dashboardData = MonitoringService.getDashboardData(dashboardId);

    if (!dashboardData) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard'
    });
  }
});

/**
 * @desc    Get all dashboards
 * @route   GET /api/monitoring/dashboards
 * @access  Private
 */
router.get('/dashboards', async (req, res) => {
  try {
    const dashboards = MonitoringService.getAllDashboards();

    res.json({
      success: true,
      count: dashboards.length,
      data: dashboards
    });

  } catch (error) {
    console.error('Get dashboards failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboards'
    });
  }
});

/**
 * @desc    Generate analytics report
 * @route   POST /api/monitoring/analytics
 * @access  Private
 */
router.post('/analytics', [
  body('timeRange')
    .optional()
    .matches(/^\d+[mhdw]$/)
    .withMessage('Invalid time range format (e.g., 1h, 7d, 1w)'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .isIn(['system', 'application', 'devices', 'projects'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { timeRange = '7d', categories = ['all'] } = req.body;

    const report = await MonitoringService.generateAnalyticsReport(timeRange, categories);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Analytics generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics report'
    });
  }
});

/**
 * @desc    Get analytics report
 * @route   GET /api/monitoring/analytics/:reportId
 * @access  Private
 */
router.get('/analytics/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = MonitoringService.getAnalyticsReport(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Analytics report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get analytics report failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics report'
    });
  }
});

/**
 * @desc    Predictive maintenance analysis
 * @route   POST /api/monitoring/predictive/:deviceId
 * @access  Private
 */
router.post('/predictive/:deviceId', [
  body('sensorData')
    .isObject()
    .withMessage('Sensor data must be an object'),
  body('sensorData.temperature')
    .optional()
    .isNumeric()
    .withMessage('Temperature must be numeric'),
  body('sensorData.vibration')
    .optional()
    .isNumeric()
    .withMessage('Vibration must be numeric'),
  body('sensorData.current')
    .optional()
    .isNumeric()
    .withMessage('Current must be numeric')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId } = req.params;
    const { sensorData } = req.body;

    const prediction = await MonitoringService.predictiveMaintenance(deviceId, sensorData);

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Predictive maintenance failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform predictive maintenance analysis'
    });
  }
});

/**
 * @desc    Get predictive data for device
 * @route   GET /api/monitoring/predictive/:deviceId
 * @access  Private
 */
router.get('/predictive/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const predictions = MonitoringService.getPredictiveData(deviceId);

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });

  } catch (error) {
    console.error('Get predictive data failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictive data'
    });
  }
});

/**
 * @desc    Delete dashboard
 * @route   DELETE /api/monitoring/dashboards/:dashboardId
 * @access  Private
 */
router.delete('/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;

    MonitoringService.deleteDashboard(dashboardId);

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });

  } catch (error) {
    console.error('Dashboard deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dashboard'
    });
  }
});

module.exports = router;