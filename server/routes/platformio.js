/**
 * PlatformIO Routes
 * Professional build system and hardware flashing endpoints
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const platformioService = require('../services/platformioService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All PlatformIO routes require authentication
router.use(protect);

/**
 * @desc    Initialize PlatformIO project
 * @route   POST /api/platformio/init
 * @access  Private
 */
router.post('/init', [
  body('projectId').isString().notEmpty(),
  body('boardType').optional().isIn([
    'arduino-uno', 'arduino-nano', 'arduino-mega',
    'esp32', 'esp8266', 'raspberry-pi-pico'
  ])
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

    const { projectId, boardType = 'arduino-uno' } = req.body;

    const result = await platformioService.initializeProject(projectId, boardType);

    res.json({
      success: true,
      data: {
        projectId,
        boardType,
        projectDir: result.projectDir,
        message: 'PlatformIO project initialized successfully'
      }
    });

  } catch (error) {
    console.error('PlatformIO init failed:', error);
    res.status(500).json({
      success: false,
      error: 'Project initialization failed',
      message: error.message
    });
  }
});

/**
 * @desc    Build project
 * @route   POST /api/platformio/build
 * @access  Private
 */
router.post('/build', [
  body('projectId').isString().notEmpty(),
  body('code').isString().notEmpty(),
  body('boardType').optional().isIn([
    'arduino-uno', 'arduino-nano', 'arduino-mega',
    'esp32', 'esp8266', 'raspberry-pi-pico'
  ])
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

    const { projectId, code, boardType } = req.body;

    const result = await platformioService.buildProject(projectId, code);

    res.json({
      success: true,
      data: {
        projectId,
        buildOutput: result.output,
        firmwarePath: result.firmwarePath,
        message: 'Project built successfully'
      }
    });

  } catch (error) {
    console.error('PlatformIO build failed:', error);
    res.status(500).json({
      success: false,
      error: 'Build failed',
      message: error.message
    });
  }
});

/**
 * @desc    Upload firmware to device
 * @route   POST /api/platformio/upload
 * @access  Private
 */
router.post('/upload', [
  body('projectId').isString().notEmpty(),
  body('port').optional().isString()
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

    const { projectId, port } = req.body;

    const result = await platformioService.uploadFirmware(projectId, port);

    res.json({
      success: true,
      data: {
        projectId,
        uploadOutput: result.output,
        port: result.port,
        message: 'Firmware uploaded successfully'
      }
    });

  } catch (error) {
    console.error('PlatformIO upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * @desc    Start serial monitor
 * @route   POST /api/platformio/monitor
 * @access  Private
 */
router.post('/monitor', [
  body('projectId').isString().notEmpty(),
  body('port').optional().isString(),
  body('baudRate').optional().isInt({ min: 300, max: 4000000 })
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

    const { projectId, port, baudRate = 115200 } = req.body;

    const result = await platformioService.startSerialMonitor(projectId, port, baudRate);

    // Return process info (process will continue running on server)
    res.json({
      success: true,
      data: {
        projectId,
        port: result.port,
        baudRate: result.baudRate,
        message: 'Serial monitor started'
      }
    });

  } catch (error) {
    console.error('Serial monitor failed:', error);
    res.status(500).json({
      success: false,
      error: 'Serial monitor failed',
      message: error.message
    });
  }
});

/**
 * @desc    Clean project build files
 * @route   POST /api/platformio/clean
 * @access  Private
 */
router.post('/clean', [
  body('projectId').isString().notEmpty()
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

    const { projectId } = req.body;

    const result = await platformioService.cleanupProject(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        message: 'Project cleaned successfully'
      }
    });

  } catch (error) {
    console.error('PlatformIO clean failed:', error);
    res.status(500).json({
      success: false,
      error: 'Clean failed',
      message: error.message
    });
  }
});

/**
 * @desc    Get build status
 * @route   GET /api/platformio/status/:projectId
 * @access  Private
 */
router.get('/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const status = await platformioService.getBuildStatus(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        status
      }
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * @desc    Install library
 * @route   POST /api/platformio/lib/install
 * @access  Private
 */
router.post('/lib/install', [
  body('projectId').isString().notEmpty(),
  body('libraryName').isString().notEmpty()
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

    const { projectId, libraryName } = req.body;

    const result = await platformioService.installLibrary(projectId, libraryName);

    res.json({
      success: true,
      data: {
        projectId,
        libraryName,
        installOutput: result.output,
        message: 'Library installed successfully'
      }
    });

  } catch (error) {
    console.error('Library install failed:', error);
    res.status(500).json({
      success: false,
      error: 'Library installation failed',
      message: error.message
    });
  }
});

/**
 * @desc    Get available boards
 * @route   GET /api/platformio/boards
 * @access  Private
 */
router.get('/boards', async (req, res) => {
  try {
    const boards = platformioService.getAvailableBoards();

    res.json({
      success: true,
      data: {
        boards,
        count: Object.keys(boards).length
      }
    });

  } catch (error) {
    console.error('Boards fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch boards',
      message: error.message
    });
  }
});

/**
 * @desc    Detect serial ports
 * @route   GET /api/platformio/ports
 * @access  Private
 */
router.get('/ports', async (req, res) => {
  try {
    const port = await platformioService.detectSerialPort();

    res.json({
      success: true,
      data: {
        availablePort: port,
        message: port ? 'Serial port detected' : 'No serial port detected'
      }
    });

  } catch (error) {
    console.error('Port detection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Port detection failed',
      message: error.message
    });
  }
});

module.exports = router;