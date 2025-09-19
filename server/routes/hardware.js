/**
 * Hardware Communication Routes
 * WebSerial API endpoints for device communication
 */

const express = require('express');
const hardwareService = require('../services/hardwareService');
const { protect } = require('../middleware/auth');

// Import validation middleware
const {
  validateObjectId,
  validatePinNumber,
  validatePinMode,
  validateDigitalValue,
  validateAnalogValue
} = require('../middleware/validation');

const router = express.Router();

// All hardware routes require authentication
router.use(protect);

/**
 * @desc    Get list of connected devices
 * @route   GET /api/hardware/devices
 * @access  Private
 */
router.get('/devices', async (req, res) => {
  try {
    const devices = hardwareService.getConnectedDevices();

    res.json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    console.error('Get devices failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected devices',
      message: error.message
    });
  }
});

/**
 * @desc    Connect to a hardware device
 * @route   POST /api/hardware/connect
 * @access  Private
 */
router.post('/connect', async (req, res) => {
  try {
    const { boardType = 'arduino-uno' } = req.body;

    // Note: This endpoint would typically be called from the client-side
    // where the WebSerial API is available. For server-side simulation,
    // we'll return mock connection info
    const result = await hardwareService.connectDevice(boardType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Device connection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to device',
      message: error.message
    });
  }
});

/**
 * @desc    Disconnect from a hardware device
 * @route   POST /api/hardware/:deviceId/disconnect
 * @access  Private
 */
router.post('/:deviceId/disconnect', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await hardwareService.disconnectDevice(deviceId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Device disconnection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect device',
      message: error.message
    });
  }
});

/**
 * @desc    Get device status
 * @route   GET /api/hardware/:deviceId/status
 * @access  Private
 */
router.get('/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const status = hardwareService.getDeviceStatus(deviceId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get device status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device status',
      message: error.message
    });
  }
});

/**
 * @desc    Configure pin mode
 * @route   PUT /api/hardware/:deviceId/pins/:pin/mode
 * @access  Private
 */
router.put('/:deviceId/pins/:pin/mode', validatePinNumber, validatePinMode, async (req, res) => {
  try {
    const { deviceId, pin } = req.params;
    const { mode } = req.body;

    const result = await hardwareService.setPinMode(deviceId, pin, mode);

    res.json({
      success: true,
      data: result,
      pin: parseInt(pin),
      mode
    });
  } catch (error) {
    console.error('Set pin mode failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set pin mode',
      message: error.message
    });
  }
});

/**
 * @desc    Write digital value to pin
 * @route   PUT /api/hardware/:deviceId/pins/:pin/digital
 * @access  Private
 */
router.put('/:deviceId/pins/:pin/digital', validatePinNumber, validateDigitalValue, async (req, res) => {
  try {
    const { deviceId, pin } = req.params;
    const { value } = req.body;

    const result = await hardwareService.digitalWrite(deviceId, pin, value);

    res.json({
      success: true,
      data: result,
      pin: parseInt(pin),
      value
    });
  } catch (error) {
    console.error('Digital write failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to write digital value',
      message: error.message
    });
  }
});

/**
 * @desc    Write analog value to pin (PWM)
 * @route   PUT /api/hardware/:deviceId/pins/:pin/analog
 * @access  Private
 */
router.put('/:deviceId/pins/:pin/analog', validatePinNumber, validateAnalogValue, async (req, res) => {
  try {
    const { deviceId, pin } = req.params;
    const { value } = req.body;

    const result = await hardwareService.analogWrite(deviceId, pin, value);

    res.json({
      success: true,
      data: result,
      pin: parseInt(pin),
      value
    });
  } catch (error) {
    console.error('Analog write failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to write analog value',
      message: error.message
    });
  }
});

/**
 * @desc    Read digital value from pin
 * @route   GET /api/hardware/:deviceId/pins/:pin/digital
 * @access  Private
 */
router.get('/:deviceId/pins/:pin/digital', validatePinNumber, async (req, res) => {
  try {
    const { deviceId, pin } = req.params;

    const result = await hardwareService.digitalRead(deviceId, pin);

    res.json({
      success: true,
      data: result,
      pin: parseInt(pin)
    });
  } catch (error) {
    console.error('Digital read failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read digital value',
      message: error.message
    });
  }
});

/**
 * @desc    Read analog value from pin
 * @route   GET /api/hardware/:deviceId/pins/:pin/analog
 * @access  Private
 */
router.get('/:deviceId/pins/:pin/analog', validatePinNumber, async (req, res) => {
  try {
    const { deviceId, pin } = req.params;

    const result = await hardwareService.analogRead(deviceId, pin);

    res.json({
      success: true,
      data: result,
      pin: parseInt(pin)
    });
  } catch (error) {
    console.error('Analog read failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read analog value',
      message: error.message
    });
  }
});

/**
 * @desc    Send custom command to device
 * @route   POST /api/hardware/:deviceId/command
 * @access  Private
 */
router.post('/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, params = {} } = req.body;

    const result = await hardwareService.sendCommand(deviceId, command, params);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Send command failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send command',
      message: error.message
    });
  }
});

/**
 * @desc    Upload code to device
 * @route   POST /api/hardware/:deviceId/upload
 * @access  Private
 */
router.post('/:deviceId/upload', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { code, boardType } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }

    const result = await hardwareService.uploadCode(deviceId, code, boardType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Code upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload code',
      message: error.message
    });
  }
});

/**
 * @desc    Get device performance metrics
 * @route   GET /api/hardware/:deviceId/metrics
 * @access  Private
 */
router.get('/:deviceId/metrics', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const metrics = await hardwareService.getDeviceMetrics(deviceId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get device metrics failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device metrics',
      message: error.message
    });
  }
});

/**
 * @desc    Get supported board types
 * @route   GET /api/hardware/boards
 * @access  Private
 */
router.get('/boards', async (req, res) => {
  try {
    const boards = Object.keys(hardwareService.supportedBoards).map(key => ({
      type: key,
      ...hardwareService.supportedBoards[key]
    }));

    res.json({
      success: true,
      count: boards.length,
      data: boards
    });
  } catch (error) {
    console.error('Get supported boards failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported boards',
      message: error.message
    });
  }
});

module.exports = router;