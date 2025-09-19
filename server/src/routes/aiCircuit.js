/**
 * AI Circuit Generation Routes
 * Endpoints for AI-powered circuit design and generation
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const aiCircuitGenerator = require('../services/aiCircuitGenerator');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @desc    Generate circuit from natural language prompt
 * @route   POST /api/ai/generate-circuit
 * @access  Private
 */
router.post('/generate-circuit', [
  // Validation middleware
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Prompt must be 10-1000 characters')
    .matches(/^[a-zA-Z0-9\s\.,!?\-()]+$/)
    .withMessage('Prompt contains invalid characters'),

  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi-pico', 'esp8266'])
    .withMessage('Invalid board type'),

  body('complexity')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid complexity level'),

  body('include3d')
    .optional()
    .isBoolean()
    .withMessage('include3d must be a boolean'),

  body('generateCode')
    .optional()
    .isBoolean()
    .withMessage('generateCode must be a boolean')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      prompt,
      boardType = 'arduino-uno',
      complexity = 'intermediate',
      include3d = true,
      generateCode = true
    } = req.body;

    console.log('[AI Circuit API] Generating circuit for user:', req.user._id);
    console.log('[AI Circuit API] Prompt:', prompt.substring(0, 100) + '...');

    // Generate circuit using AI
    const result = await aiCircuitGenerator.generateCircuit(prompt, {
      boardType,
      complexity,
      include3d,
      generateCode
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate circuit',
        details: result.error
      });
    }

    // Log successful generation
    console.log('[AI Circuit API] Circuit generated successfully');
    console.log('[AI Circuit API] Components:', result.data.components.length);
    console.log('[AI Circuit API] Connections:', result.data.connections.length);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('[AI Circuit API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during circuit generation'
    });
  }
});

/**
 * @desc    Refine existing circuit design
 * @route   POST /api/ai/refine-circuit
 * @access  Private
 */
router.post('/refine-circuit', [
  // Validation middleware
  body('originalDesign')
    .isObject()
    .withMessage('originalDesign must be an object'),

  body('refinementPrompt')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Refinement prompt must be 5-500 characters'),

  body('currentComponents')
    .isArray()
    .withMessage('currentComponents must be an array'),

  body('currentConnections')
    .isArray()
    .withMessage('currentConnections must be an array')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      originalDesign,
      refinementPrompt,
      currentComponents,
      currentConnections
    } = req.body;

    console.log('[AI Circuit API] Refining circuit for user:', req.user._id);
    console.log('[AI Circuit API] Refinement:', refinementPrompt.substring(0, 100) + '...');

    // Refine circuit using AI
    const result = await aiCircuitGenerator.refineCircuit(
      originalDesign,
      refinementPrompt,
      currentComponents,
      currentConnections
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to refine circuit',
        details: result.error
      });
    }

    console.log('[AI Circuit API] Circuit refined successfully');

    res.json({
      success: true,
      data: result.data,
      metadata: {
        refinementPrompt,
        refinedAt: new Date().toISOString(),
        userId: req.user._id
      }
    });

  } catch (error) {
    console.error('[AI Circuit API] Refinement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during circuit refinement'
    });
  }
});

/**
 * @desc    Get circuit design suggestions
 * @route   POST /api/ai/circuit-suggestions
 * @access  Private
 */
router.post('/circuit-suggestions', [
  // Validation middleware
  body('partialDesign')
    .isObject()
    .withMessage('partialDesign must be an object'),

  body('context')
    .optional()
    .isString()
    .withMessage('context must be a string')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { partialDesign, context = '' } = req.body;

    console.log('[AI Circuit API] Getting suggestions for user:', req.user._id);

    // This would use AI to suggest improvements or completions
    // For now, return basic suggestions
    const suggestions = [
      {
        type: 'component',
        suggestion: 'Add a power regulator for stable voltage',
        component: 'lm2596-buck-converter',
        reasoning: 'Ensures stable power supply for all components'
      },
      {
        type: 'connection',
        suggestion: 'Add pull-up resistor to button input',
        from: 'button',
        to: 'resistor-10k',
        reasoning: 'Prevents floating input and ensures reliable button detection'
      },
      {
        type: 'optimization',
        suggestion: 'Use PWM pin for LED brightness control',
        component: 'led',
        pin: 'pwm-capable',
        reasoning: 'Enables smooth brightness control without additional components'
      }
    ];

    res.json({
      success: true,
      data: {
        suggestions,
        context: context,
        designCompleteness: this.calculateDesignCompleteness(partialDesign)
      }
    });

  } catch (error) {
    console.error('[AI Circuit API] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error getting suggestions'
    });
  }
});

/**
 * @desc    Analyze circuit for issues and improvements
 * @route   POST /api/ai/analyze-circuit
 * @access  Private
 */
router.post('/analyze-circuit', [
  // Validation middleware
  body('components')
    .isArray()
    .withMessage('components must be an array'),

  body('connections')
    .isArray()
    .withMessage('connections must be an array'),

  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi-pico', 'esp8266'])
    .withMessage('Invalid board type')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { components, connections, boardType = 'arduino-uno' } = req.body;

    console.log('[AI Circuit API] Analyzing circuit for user:', req.user._id);
    console.log('[AI Circuit API] Components:', components.length, 'Connections:', connections.length);

    // Analyze circuit using AI
    const analysis = await aiCircuitGenerator.analyzeCircuit(components, connections, boardType);

    res.json({
      success: true,
      data: {
        analysis: analysis,
        score: this.calculateCircuitScore(components, connections),
        recommendations: analysis.recommendations || [],
        issues: analysis.issues || [],
        optimizations: analysis.optimizations || []
      }
    });

  } catch (error) {
    console.error('[AI Circuit API] Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during circuit analysis'
    });
  }
});

/**
 * @desc    Get component compatibility information
 * @route   GET /api/ai/component-compatibility
 * @access  Private
 */
router.get('/component-compatibility', async (req, res) => {
  try {
    const { component1, component2, boardType = 'arduino-uno' } = req.query;

    if (!component1 || !component2) {
      return res.status(400).json({
        success: false,
        error: 'component1 and component2 parameters are required'
      });
    }

    console.log('[AI Circuit API] Checking compatibility:', component1, 'vs', component2);

    // Check component compatibility
    const compatibility = await aiCircuitGenerator.checkCompatibility(
      component1,
      component2,
      boardType
    );

    res.json({
      success: true,
      data: {
        compatible: compatibility.isCompatible,
        issues: compatibility.issues || [],
        suggestions: compatibility.suggestions || [],
        pinConflicts: compatibility.pinConflicts || [],
        voltageMatch: compatibility.voltageMatch
      }
    });

  } catch (error) {
    console.error('[AI Circuit API] Compatibility check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error checking compatibility'
    });
  }
});

/**
 * @desc    Get circuit design templates
 * @route   GET /api/ai/circuit-templates
 * @access  Private
 */
router.get('/circuit-templates', async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    console.log('[AI Circuit API] Getting templates for category:', category, 'difficulty:', difficulty);

    const templates = await aiCircuitGenerator.getCircuitTemplates(category, difficulty);

    res.json({
      success: true,
      data: {
        templates: templates,
        categories: ['beginner', 'sensor', 'actuator', 'communication', 'iot', 'robotics'],
        difficulties: ['beginner', 'intermediate', 'advanced']
      }
    });

  } catch (error) {
    console.error('[AI Circuit API] Templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error getting templates'
    });
  }
});

/**
 * @desc    Export circuit design
 * @route   POST /api/ai/export-circuit
 * @access  Private
 */
router.post('/export-circuit', [
  // Validation middleware
  body('components')
    .isArray()
    .withMessage('components must be an array'),

  body('connections')
    .isArray()
    .withMessage('connections must be an array'),

  body('format')
    .isIn(['json', 'svg', 'png', 'pdf', 'gerber'])
    .withMessage('Invalid export format')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { components, connections, format, options = {} } = req.body;

    console.log('[AI Circuit API] Exporting circuit in format:', format);

    // Export circuit in requested format
    const exportData = await aiCircuitGenerator.exportCircuit(
      components,
      connections,
      format,
      options
    );

    // Set appropriate headers based on format
    const mimeTypes = {
      json: 'application/json',
      svg: 'image/svg+xml',
      png: 'image/png',
      pdf: 'application/pdf',
      gerber: 'application/zip'
    };

    res.setHeader('Content-Type', mimeTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="circuit.${format}"`);

    res.send(exportData);

  } catch (error) {
    console.error('[AI Circuit API] Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during export'
    });
  }
});

// Helper methods
calculateDesignCompleteness = (design) => {
  // Calculate how complete the circuit design is
  let score = 0;
  const maxScore = 100;

  if (design.components && design.components.length > 0) {
    score += 30;
  }

  if (design.connections && design.connections.length > 0) {
    score += 25;
  }

  if (design.power && design.power.source) {
    score += 20;
  }

  if (design.board && design.board.type) {
    score += 15;
  }

  if (design.specifications && Object.keys(design.specifications).length > 0) {
    score += 10;
  }

  return Math.min(score, maxScore);
};

calculateCircuitScore = (components, connections) => {
  // Calculate overall circuit quality score
  let score = 0;

  // Component diversity and appropriateness
  if (components.length > 0) {
    score += Math.min(components.length * 5, 30);
  }

  // Connection quality
  if (connections.length > 0) {
    score += Math.min(connections.length * 3, 25);
  }

  // Pin usage efficiency
  const usedPins = new Set();
  connections.forEach(conn => {
    if (conn.from && conn.from.pin) usedPins.add(conn.from.pin);
    if (conn.to && conn.to.pin) usedPins.add(conn.to.pin);
  });
  score += Math.min(usedPins.size * 2, 20);

  // Power considerations
  const hasPowerSource = components.some(comp =>
    comp.type.includes('battery') || comp.type.includes('power') || comp.type.includes('regulator')
  );
  if (hasPowerSource) {
    score += 15;
  }

  // Microcontroller presence
  const hasMCU = components.some(comp =>
    comp.type.includes('arduino') || comp.type.includes('esp') || comp.type.includes('raspberry')
  );
  if (hasMCU) {
    score += 10;
  }

  return Math.min(score, 100);
};

module.exports = router;