/**
 * PlatformIO Build System Routes
 * API endpoints for professional embedded development
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const PlatformIOService = require('../services/platformioService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Initialize PlatformIO project
 * @route   POST /api/platformio/init
 * @access  Private
 */
router.post('/init', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be 1-100 characters')
    .trim(),
  body('boardType')
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi-pico'])
    .withMessage('Invalid board type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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

    const { name, boardType, description } = req.body;

    // Initialize project
    const project = await PlatformIOService.initializeProject({
      name,
      boardType,
      description
    });

    res.status(201).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Project initialization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize project'
    });
  }
});

/**
 * @desc    Build PlatformIO project
 * @route   POST /api/platformio/build/:projectId
 * @access  Private
 */
router.post('/build/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Build project
    const build = await PlatformIOService.buildProject(projectId);

    res.json({
      success: true,
      data: build
    });

  } catch (error) {
    console.error('Build failed:', error);
    res.status(500).json({
      success: false,
      error: 'Build failed',
      details: error.message
    });
  }
});

/**
 * @desc    Upload firmware to device
 * @route   POST /api/platformio/upload/:projectId
 * @access  Private
 */
router.post('/upload/:projectId', [
  body('port')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid port specification')
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

    const { projectId } = req.params;
    const { port } = req.body;

    // Upload firmware
    const upload = await PlatformIOService.uploadFirmware(projectId, port);

    res.json({
      success: true,
      data: upload
    });

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: error.message
    });
  }
});

/**
 * @desc    Install library
 * @route   POST /api/platformio/library/:projectId
 * @access  Private
 */
router.post('/library/:projectId', [
  body('libraryName')
    .isLength({ min: 1, max: 100 })
    .withMessage('Library name must be 1-100 characters')
    .trim()
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

    const { projectId } = req.params;
    const { libraryName } = req.body;

    // Install library
    const result = await PlatformIOService.installLibrary(projectId, libraryName);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Library installation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Library installation failed',
      details: error.message
    });
  }
});

/**
 * @desc    Update project code
 * @route   PUT /api/platformio/code/:projectId
 * @access  Private
 */
router.put('/code/:projectId', [
  body('fileName')
    .isLength({ min: 1, max: 100 })
    .withMessage('File name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9_\-\.]+$/)
    .withMessage('Invalid file name'),
  body('code')
    .isLength({ max: 100000 })
    .withMessage('Code cannot exceed 100KB')
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

    const { projectId } = req.params;
    const { fileName, code } = req.body;

    // Update code
    const result = await PlatformIOService.updateCode(projectId, fileName, code);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Code update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Code update failed',
      details: error.message
    });
  }
});

/**
 * @desc    Get project files
 * @route   GET /api/platformio/files/:projectId
 * @access  Private
 */
router.get('/files/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project files
    const files = await PlatformIOService.getProjectFiles(projectId);

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    console.error('Get files failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project files'
    });
  }
});

/**
 * @desc    Get project by ID
 * @route   GET /api/platformio/project/:projectId
 * @access  Private
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = PlatformIOService.getProject(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project'
    });
  }
});

/**
 * @desc    Get all projects
 * @route   GET /api/platformio/projects
 * @access  Private
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = PlatformIOService.getAllProjects();

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('Get projects failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projects'
    });
  }
});

/**
 * @desc    Get project builds
 * @route   GET /api/platformio/builds/:projectId
 * @access  Private
 */
router.get('/builds/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const builds = PlatformIOService.getProjectBuilds(projectId);

    res.json({
      success: true,
      count: builds.length,
      data: builds
    });

  } catch (error) {
    console.error('Get builds failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project builds'
    });
  }
});

/**
 * @desc    Get build by ID
 * @route   GET /api/platformio/build/:buildId
 * @access  Private
 */
router.get('/build/:buildId', async (req, res) => {
  try {
    const { buildId } = req.params;

    const build = PlatformIOService.getBuild(buildId);

    if (!build) {
      return res.status(404).json({
        success: false,
        error: 'Build not found'
      });
    }

    res.json({
      success: true,
      data: build
    });

  } catch (error) {
    console.error('Get build failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get build'
    });
  }
});

/**
 * @desc    Clean up project
 * @route   DELETE /api/platformio/project/:projectId
 * @access  Private
 */
router.delete('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    await PlatformIOService.cleanupProject(projectId);

    res.json({
      success: true,
      message: 'Project cleaned up successfully'
    });

  } catch (error) {
    console.error('Project cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup project'
    });
  }
});

/**
 * @desc    Get available board templates
 * @route   GET /api/platformio/templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    // Return available board templates
    const templates = [
      {
        id: 'arduino-uno',
        name: 'Arduino Uno',
        platform: 'atmelavr',
        board: 'uno',
        framework: 'arduino',
        description: 'Classic Arduino board with ATmega328P microcontroller'
      },
      {
        id: 'esp32',
        name: 'ESP32 Dev Board',
        platform: 'espressif32',
        board: 'esp32dev',
        framework: 'arduino',
        description: 'WiFi and Bluetooth enabled microcontroller'
      },
      {
        id: 'raspberry-pi-pico',
        name: 'Raspberry Pi Pico',
        platform: 'raspberrypi',
        board: 'pico',
        framework: 'arduino',
        description: 'RP2040 based microcontroller with dual cores'
      }
    ];

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    console.error('Get templates failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

module.exports = router;