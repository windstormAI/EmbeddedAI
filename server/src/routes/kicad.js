/**
 * KiCad PCB Design Routes
 * API endpoints for professional PCB design
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const KiCadService = require('../services/kicadService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Create KiCad PCB project
 * @route   POST /api/kicad/create
 * @access  Private
 */
router.post('/create', [
  body('circuitData')
    .isObject()
    .withMessage('Circuit data must be an object'),
  body('circuitData.components')
    .optional()
    .isArray()
    .withMessage('Components must be an array'),
  body('options.template')
    .optional()
    .isIn(['arduino-shield', 'esp32-board', 'pico-board'])
    .withMessage('Invalid template'),
  body('options.boardName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be 1-100 characters')
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

    const { circuitData, options = {} } = req.body;

    // Create PCB project
    const project = await KiCadService.createPCBProject(circuitData, options);

    res.status(201).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('PCB project creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PCB project',
      details: error.message
    });
  }
});

/**
 * @desc    Export Gerber files
 * @route   POST /api/kicad/export/:projectId
 * @access  Private
 */
router.post('/export/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Export Gerber files
    const gerberData = await KiCadService.exportGerber(projectId);

    res.json({
      success: true,
      data: gerberData
    });

  } catch (error) {
    console.error('Gerber export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export Gerber files',
      details: error.message
    });
  }
});

/**
 * @desc    Run design rule check
 * @route   POST /api/kicad/drc/:projectId
 * @access  Private
 */
router.post('/drc/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Run DRC
    const drcResults = await KiCadService.runDRC(projectId);

    res.json({
      success: true,
      data: drcResults
    });

  } catch (error) {
    console.error('DRC failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run design rule check',
      details: error.message
    });
  }
});

/**
 * @desc    Get KiCad project
 * @route   GET /api/kicad/project/:projectId
 * @access  Private
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = KiCadService.getProject(projectId);

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
 * @desc    Get all KiCad projects
 * @route   GET /api/kicad/projects
 * @access  Private
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = KiCadService.getAllProjects();

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
 * @desc    Get available templates
 * @route   GET /api/kicad/templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'arduino-shield',
        name: 'Arduino Shield',
        description: 'Standard Arduino Uno shield format',
        dimensions: '68.58mm x 53.34mm',
        layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS'],
        connectors: ['28-pin Arduino header']
      },
      {
        id: 'esp32-board',
        name: 'ESP32 Development Board',
        description: 'ESP32-WROOM-32 module board',
        dimensions: '25.4mm x 48.26mm',
        layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS', 'F.Mask', 'B.Mask'],
        components: ['ESP32-WROOM-32', 'Power regulator', 'USB connector']
      },
      {
        id: 'pico-board',
        name: 'Raspberry Pi Pico',
        description: 'RP2040 microcontroller board',
        dimensions: '21mm x 51mm',
        layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS'],
        connectors: ['40-pin header']
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

/**
 * @desc    Update PCB project
 * @route   PUT /api/kicad/project/:projectId
 * @access  Private
 */
router.put('/project/:projectId', [
  body('circuitData')
    .optional()
    .isObject()
    .withMessage('Circuit data must be an object'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
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
    const { circuitData, options } = req.body;

    // Get existing project
    const project = KiCadService.getProject(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Update project data
    if (circuitData) {
      project.circuitData = { ...project.circuitData, ...circuitData };
    }

    if (options) {
      project.options = { ...project.options, ...options };
    }

    project.updated = new Date().toISOString();

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Project update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

/**
 * @desc    Delete KiCad project
 * @route   DELETE /api/kicad/project/:projectId
 * @access  Private
 */
router.delete('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    await KiCadService.deleteProject(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Project deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

/**
 * @desc    Generate BOM from PCB project
 * @route   GET /api/kicad/bom/:projectId
 * @access  Private
 */
router.get('/bom/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = KiCadService.getProject(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Generate BOM from circuit data
    const bom = this.generateBOM(project.circuitData);

    res.json({
      success: true,
      data: bom
    });

  } catch (error) {
    console.error('BOM generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate BOM'
    });
  }
});

/**
 * @desc    Get manufacturing specifications
 * @route   GET /api/kicad/specs/:projectId
 * @access  Private
 */
router.get('/specs/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = KiCadService.getProject(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const template = await KiCadService.getTemplate(project.template);
    const specs = {
      dimensions: template.dimensions,
      layers: template.layers,
      thickness: '1.6mm',
      copperWeight: '1oz',
      solderMask: 'Green',
      silkScreen: 'White',
      surfaceFinish: 'HASL',
      minTraceWidth: '0.15mm',
      minDrillSize: '0.3mm',
      designRules: {
        clearance: '0.15mm',
        trackWidth: '0.25mm',
        viaSize: '0.4mm'
      }
    };

    res.json({
      success: true,
      data: specs
    });

  } catch (error) {
    console.error('Get specs failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get manufacturing specs'
    });
  }
});

// Helper function to generate BOM
function generateBOM(circuitData) {
  const { components = [] } = circuitData;
  const bomItems = [];

  components.forEach(component => {
    const existingItem = bomItems.find(item => item.partNumber === component.type);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      bomItems.push({
        partNumber: component.type,
        description: component.name || component.type,
        quantity: 1,
        package: getPackageType(component.type),
        manufacturer: getManufacturer(component.type),
        mpn: getMPN(component.type)
      });
    }
  });

  return {
    items: bomItems,
    totalItems: bomItems.length,
    generated: new Date().toISOString()
  };
}

// Helper functions for BOM
function getPackageType(componentType) {
  const packageMap = {
    'resistor': '0805',
    'capacitor': '0805',
    'led': '0805',
    'arduino-uno': 'Arduino Shield',
    'esp32': 'ESP32-WROOM-32',
    'raspberry-pi-pico': 'RP2040'
  };
  return packageMap[componentType] || 'Unknown';
}

function getManufacturer(componentType) {
  const manufacturerMap = {
    'arduino-uno': 'Arduino',
    'esp32': 'Espressif',
    'raspberry-pi-pico': 'Raspberry Pi'
  };
  return manufacturerMap[componentType] || 'Various';
}

function getMPN(componentType) {
  const mpnMap = {
    'arduino-uno': 'A000066',
    'esp32': 'ESP32-WROOM-32',
    'raspberry-pi-pico': 'SC0915'
  };
  return mpnMap[componentType] || 'TBD';
}

module.exports = router;