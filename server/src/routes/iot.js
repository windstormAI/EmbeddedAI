/**
 * IoT Platform Integration Routes
 * API endpoints for IoT platform connections and device management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const IoTService = require('../services/iotService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Get supported IoT platforms
 * @route   GET /api/iot/platforms
 * @access  Private
 */
router.get('/platforms', async (req, res) => {
  try {
    const platforms = IoTService.getAllPlatforms();
    res.json({
      success: true,
      count: platforms.length,
      data: platforms
    });
  } catch (error) {
    console.error('Get platforms failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platforms'
    });
  }
});

/**
 * @desc    Connect to IoT platform
 * @route   POST /api/iot/connect
 * @access  Private
 */
router.post('/connect', [
  body('platformId')
    .isIn(['aws-iot', 'google-iot', 'azure-iot', 'ibm-iot', 'adafruit-io', 'blynk', 'thingsboard'])
    .withMessage('Invalid platform ID'),
  body('credentials')
    .isObject()
    .withMessage('Credentials must be an object'),
  body('credentials.endpoint')
    .optional()
    .isURL()
    .withMessage('Invalid endpoint URL'),
  body('credentials.apiKey')
    .optional()
    .isLength({ min: 10, max: 100 })
    .withMessage('API key must be 10-100 characters'),
  body('credentials.username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
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

    const { platformId, credentials } = req.body;

    const connection = await IoTService.connectPlatform(platformId, credentials);

    res.status(201).json({
      success: true,
      data: connection
    });

  } catch (error) {
    console.error('Platform connection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to platform',
      details: error.message
    });
  }
});

/**
 * @desc    Register device with platform
 * @route   POST /api/iot/devices
 * @access  Private
 */
router.post('/devices', [
  body('connectionId')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid connection ID'),
  body('deviceId')
    .isLength({ min: 3, max: 50 })
    .withMessage('Device ID must be 3-50 characters'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be 1-100 characters'),
  body('type')
    .isIn(['sensor', 'actuator', 'gateway', 'controller'])
    .withMessage('Invalid device type'),
  body('sensors')
    .optional()
    .isArray()
    .withMessage('Sensors must be an array'),
  body('actuators')
    .optional()
    .isArray()
    .withMessage('Actuators must be an array')
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

    const deviceData = req.body;

    const device = await IoTService.registerDevice(deviceData.connectionId, deviceData);

    res.status(201).json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Device registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device',
      details: error.message
    });
  }
});

/**
 * @desc    Send telemetry data
 * @route   POST /api/iot/telemetry/:deviceId
 * @access  Private
 */
router.post('/telemetry/:deviceId', [
  body('data')
    .isObject()
    .withMessage('Telemetry data must be an object'),
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

    const { deviceId } = req.params;
    const { data, timestamp } = req.body;

    const result = await IoTService.sendTelemetry(deviceId, data);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Telemetry send failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send telemetry',
      details: error.message
    });
  }
});

/**
 * @desc    Receive commands for device
 * @route   GET /api/iot/commands/:deviceId
 * @access  Private
 */
router.get('/commands/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const commands = await IoTService.receiveCommands(deviceId);

    res.json({
      success: true,
      count: commands.length,
      data: commands
    });

  } catch (error) {
    console.error('Command receive failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive commands',
      details: error.message
    });
  }
});

/**
 * @desc    Create device dashboard
 * @route   POST /api/iot/dashboards
 * @access  Private
 */
router.post('/dashboards', [
  body('deviceId')
    .isLength({ min: 3, max: 50 })
    .withMessage('Invalid device ID'),
  body('config')
    .isObject()
    .withMessage('Dashboard config must be an object'),
  body('config.widgets')
    .optional()
    .isArray()
    .withMessage('Widgets must be an array'),
  body('config.layout')
    .optional()
    .isIn(['grid', 'masonry', 'flex'])
    .withMessage('Invalid layout type')
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

    const { deviceId, config } = req.body;

    const dashboard = await IoTService.createDashboard(deviceId, config);

    res.status(201).json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Dashboard creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dashboard',
      details: error.message
    });
  }
});

/**
 * @desc    Setup device shadow/twin
 * @route   POST /api/iot/shadows
 * @access  Private
 */
router.post('/shadows', [
  body('deviceId')
    .isLength({ min: 3, max: 50 })
    .withMessage('Invalid device ID'),
  body('config')
    .isObject()
    .withMessage('Shadow config must be an object'),
  body('config.desired')
    .optional()
    .isObject()
    .withMessage('Desired state must be an object'),
  body('config.reported')
    .optional()
    .isObject()
    .withMessage('Reported state must be an object')
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

    const { deviceId, config } = req.body;

    const shadow = await IoTService.setupDeviceShadow(deviceId, config);

    res.status(201).json({
      success: true,
      data: shadow
    });

  } catch (error) {
    console.error('Shadow setup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup device shadow',
      details: error.message
    });
  }
});

/**
 * @desc    Update device shadow
 * @route   PUT /api/iot/shadows/:deviceId
 * @access  Private
 */
router.put('/shadows/:deviceId', [
  body('state')
    .isObject()
    .withMessage('State must be an object'),
  body('state.desired')
    .optional()
    .isObject()
    .withMessage('Desired state must be an object'),
  body('state.reported')
    .optional()
    .isObject()
    .withMessage('Reported state must be an object')
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
    const { state } = req.body;

    const shadow = await IoTService.updateShadow(deviceId, state);

    res.json({
      success: true,
      data: shadow
    });

  } catch (error) {
    console.error('Shadow update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shadow',
      details: error.message
    });
  }
});

/**
 * @desc    Get device shadow
 * @route   GET /api/iot/shadows/:deviceId
 * @access  Private
 */
router.get('/shadows/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const shadow = await IoTService.getShadow(deviceId);

    res.json({
      success: true,
      data: shadow
    });

  } catch (error) {
    console.error('Shadow get failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shadow',
      details: error.message
    });
  }
});

/**
 * @desc    Get connection by ID
 * @route   GET /api/iot/connections/:connectionId
 * @access  Private
 */
router.get('/connections/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = IoTService.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      data: connection
    });

  } catch (error) {
    console.error('Get connection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connection'
    });
  }
});

/**
 * @desc    Get device by ID
 * @route   GET /api/iot/devices/:deviceId
 * @access  Private
 */
router.get('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = IoTService.getDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Get device failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device'
    });
  }
});

/**
 * @desc    Get all connections
 * @route   GET /api/iot/connections
 * @access  Private
 */
router.get('/connections', async (req, res) => {
  try {
    const connections = IoTService.getAllConnections();

    res.json({
      success: true,
      count: connections.length,
      data: connections
    });

  } catch (error) {
    console.error('Get connections failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connections'
    });
  }
});

/**
 * @desc    Get all devices
 * @route   GET /api/iot/devices
 * @access  Private
 */
router.get('/devices', async (req, res) => {
  try {
    const devices = IoTService.getAllDevices();

    res.json({
      success: true,
      count: devices.length,
      data: devices
    });

  } catch (error) {
    console.error('Get devices failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get devices'
    });
  }
});

/**
 * @desc    Disconnect from platform
 * @route   DELETE /api/iot/connections/:connectionId
 * @access  Private
 */
router.delete('/connections/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    await IoTService.disconnectPlatform(connectionId);

    res.json({
      success: true,
      message: 'Platform disconnected successfully'
    });

  } catch (error) {
    console.error('Platform disconnect failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect platform'
    });
  }
});

/**
 * @desc    Delete device
 * @route   DELETE /api/iot/devices/:deviceId
 * @access  Private
 */
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    await IoTService.deleteDevice(deviceId);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Device deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete device'
    });
  }
});

module.exports = router;