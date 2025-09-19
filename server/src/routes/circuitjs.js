/**
 * CircuitJS Simulation Routes
 * API endpoints for circuit simulation and analysis
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const CircuitJSSimulator = require('../services/circuitjsService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Generate circuit from natural language
 * @route   POST /api/circuitjs/generate
 * @access  Private
 */
router.post('/generate', [
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be 10-1000 characters')
    .trim(),
  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi'])
    .withMessage('Invalid board type')
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

    const { description, boardType = 'arduino-uno' } = req.body;

    // Generate circuit from description
    const circuit = await CircuitJSSimulator.generateCircuitFromDescription(description);

    // Create simulation
    const simulation = await CircuitJSSimulator.createSimulation(circuit, {
      width: 800,
      height: 600,
      interactive: true,
      showValues: true
    });

    res.json({
      success: true,
      data: {
        circuit,
        simulation,
        boardType
      }
    });

  } catch (error) {
    console.error('Circuit generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate circuit'
    });
  }
});

/**
 * @desc    Create circuit simulation
 * @route   POST /api/circuitjs/simulate
 * @access  Private
 */
router.post('/simulate', [
  body('circuitData')
    .isObject()
    .withMessage('Circuit data must be an object'),
  body('circuitData.components')
    .isArray()
    .withMessage('Components must be an array'),
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

    const { circuitData, options = {} } = req.body;

    // Create simulation
    const simulation = await CircuitJSSimulator.createSimulation(circuitData, options);

    res.json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Simulation creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create simulation'
    });
  }
});

/**
 * @desc    Analyze circuit for issues
 * @route   POST /api/circuitjs/analyze
 * @access  Private
 */
router.post('/analyze', [
  body('circuitData')
    .isObject()
    .withMessage('Circuit data must be an object')
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

    const { circuitData } = req.body;

    // Analyze circuit
    const analysis = await CircuitJSSimulator.analyzeCircuit(circuitData);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Circuit analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze circuit'
    });
  }
});

/**
 * @desc    Export circuit in different formats
 * @route   POST /api/circuitjs/export
 * @access  Private
 */
router.post('/export', [
  body('circuitData')
    .isObject()
    .withMessage('Circuit data must be an object'),
  body('format')
    .isIn(['circuitjs', 'spice', 'json', 'svg'])
    .withMessage('Invalid export format')
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

    const { circuitData, format } = req.body;

    // Export circuit
    const exportedData = await CircuitJSSimulator.exportCircuit(circuitData, format);

    // Set appropriate content type
    let contentType = 'text/plain';
    let filename = `circuit.${format}`;

    switch (format) {
      case 'json':
        contentType = 'application/json';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'spice':
        contentType = 'text/plain';
        filename = 'circuit.spice';
        break;
      default:
        contentType = 'text/plain';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(exportedData);

  } catch (error) {
    console.error('Circuit export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export circuit'
    });
  }
});

/**
 * @desc    Get simulation by ID
 * @route   GET /api/circuitjs/simulation/:id
 * @access  Private
 */
router.get('/simulation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const simulation = CircuitJSSimulator.getSimulation(id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Get simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation'
    });
  }
});

/**
 * @desc    Get all active simulations
 * @route   GET /api/circuitjs/simulations
 * @access  Private
 */
router.get('/simulations', async (req, res) => {
  try {
    const simulations = CircuitJSSimulator.getActiveSimulations();

    res.json({
      success: true,
      count: simulations.length,
      data: simulations
    });

  } catch (error) {
    console.error('Get simulations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulations'
    });
  }
});

/**
 * @desc    Delete simulation
 * @route   DELETE /api/circuitjs/simulation/:id
 * @access  Private
 */
router.delete('/simulation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = CircuitJSSimulator.deleteSimulation(id);

    res.json({
      success: true,
      deleted
    });

  } catch (error) {
    console.error('Delete simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete simulation'
    });
  }
});

/**
 * @desc    Convert existing circuit to CircuitJS format
 * @route   POST /api/circuitjs/convert
 * @access  Private
 */
router.post('/convert', [
  body('circuitData')
    .isObject()
    .withMessage('Circuit data must be an object')
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

    const { circuitData } = req.body;

    // Convert to CircuitJS format
    const circuitJS = CircuitJSSimulator.convertToCircuitJS(circuitData);

    res.json({
      success: true,
      data: {
        circuitJS,
        originalData: circuitData
      }
    });

  } catch (error) {
    console.error('Circuit conversion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert circuit'
    });
  }
});

module.exports = router;