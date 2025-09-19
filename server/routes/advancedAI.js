/**
 * Advanced AI Routes
 * Enhanced AI features including circuit analysis and optimization
 */

const express = require('express');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

// Import validation middleware
const {
  validateCircuitUpdate,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

/**
 * @desc    Generate advanced code with optimization
 * @route   POST /api/ai/advanced-generate
 * @access  Private
 */
router.post('/advanced-generate', async (req, res) => {
  try {
    const {
      description,
      boardType = 'arduino-uno',
      components = [],
      existingCode = '',
      requirements = [],
      optimizationLevel = 'balanced',
      includeComments = true,
      codeStyle = 'standard'
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    console.log('Generating advanced code', {
      userId: req.user._id,
      description: description.substring(0, 100),
      boardType,
      optimizationLevel
    });

    const result = await aiService.generateCode(description, {
      boardType,
      components,
      existingCode,
      requirements,
      optimizationLevel,
      includeComments,
      codeStyle
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Advanced code generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate advanced code',
      message: error.message
    });
  }
});

/**
 * @desc    Analyze circuit design
 * @route   POST /api/ai/analyze-circuit
 * @access  Private
 */
router.post('/analyze-circuit', validateCircuitUpdate, async (req, res) => {
  try {
    const { circuitData, boardType = 'arduino-uno' } = req.body;

    if (!circuitData) {
      return res.status(400).json({
        success: false,
        error: 'Circuit data is required'
      });
    }

    console.log('Analyzing circuit', {
      userId: req.user._id,
      componentsCount: circuitData.components?.length || 0,
      connectionsCount: circuitData.connections?.length || 0,
      boardType
    });

    const analysis = await aiService.analyzeCircuit(circuitData, boardType);

    res.json({
      success: true,
      data: {
        analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Circuit analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze circuit',
      message: error.message
    });
  }
});

/**
 * @desc    Get code optimization suggestions
 * @route   POST /api/ai/optimize-code
 * @access  Private
 */
router.post('/optimize-code', async (req, res) => {
  try {
    const { code, boardType = 'arduino-uno', optimizationGoals = [] } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }

    console.log('Optimizing code', {
      userId: req.user._id,
      codeLength: code.length,
      boardType,
      goals: optimizationGoals
    });

    const analysis = await aiService.analyzeGeneratedCode(code, boardType);
    const suggestions = aiService.generateOptimizationSuggestions(code, boardType);

    res.json({
      success: true,
      data: {
        analysis,
        suggestions,
        optimizationGoals,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Code optimization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize code',
      message: error.message
    });
  }
});

/**
 * @desc    Generate circuit from requirements
 * @route   POST /api/ai/generate-circuit
 * @access  Private
 */
router.post('/generate-circuit', async (req, res) => {
  try {
    const {
      requirements,
      boardType = 'arduino-uno',
      constraints = {},
      optimizationGoals = []
    } = req.body;

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Requirements array is required'
      });
    }

    console.log('Generating circuit design', {
      userId: req.user._id,
      requirementsCount: requirements.length,
      boardType,
      constraints: Object.keys(constraints)
    });

    // This would use AI to generate a complete circuit design
    // For now, return a placeholder response
    const circuitDesign = {
      components: [],
      connections: [],
      analysis: {
        feasibility_score: 85,
        estimated_cost: 25.50,
        power_consumption: 120,
        complexity_level: 'medium'
      },
      suggestions: [
        'Consider using pull-up resistors for stable input signals',
        'Add decoupling capacitors for power stability',
        'Use appropriate pin configurations for optimal performance'
      ]
    };

    res.json({
      success: true,
      data: {
        circuitDesign,
        requirements,
        boardType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Circuit generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate circuit',
      message: error.message
    });
  }
});

/**
 * @desc    Get AI model capabilities and status
 * @route   GET /api/ai/capabilities
 * @access  Private
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      models: ['gpt-4', 'gpt-3.5-turbo'],
      features: [
        'code_generation',
        'circuit_analysis',
        'optimization_suggestions',
        'debugging_assistance',
        'performance_analysis',
        'power_consumption_estimation'
      ],
      supported_boards: [
        'arduino-uno',
        'arduino-mega',
        'esp32',
        'esp8266',
        'raspberry-pi-pico'
      ],
      optimization_levels: ['performance', 'size', 'balanced'],
      code_styles: ['standard', 'compact', 'verbose'],
      rate_limits: {
        requests_per_minute: 60,
        tokens_per_minute: 10000
      }
    };

    res.json({
      success: true,
      data: {
        capabilities,
        status: 'operational',
        version: '2.0.0'
      }
    });

  } catch (error) {
    console.error('Get capabilities failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI capabilities',
      message: error.message
    });
  }
});

/**
 * @desc    Debug code with AI assistance
 * @route   POST /api/ai/debug
 * @access  Private
 */
router.post('/debug', async (req, res) => {
  try {
    const { code, error_message, boardType = 'arduino-uno', context = {} } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }

    console.log('AI debugging assistance', {
      userId: req.user._id,
      codeLength: code.length,
      hasError: !!error_message,
      boardType
    });

    // Use existing analyzeCode method for debugging
    const analysis = await aiService.analyzeCode(code, 'cpp');

    // Generate debugging suggestions
    const debugSuggestions = [];

    if (error_message) {
      debugSuggestions.push({
        type: 'error_analysis',
        priority: 'high',
        suggestion: `Error detected: ${error_message}`,
        fixes: [
          'Check variable declarations',
          'Verify pin configurations',
          'Ensure proper library includes',
          'Check syntax and semicolons'
        ]
      });
    }

    // Add common debugging suggestions
    debugSuggestions.push({
      type: 'serial_debugging',
      priority: 'medium',
      suggestion: 'Add Serial debugging statements',
      code_example: 'Serial.println("Debug: variable = " + String(variable));'
    });

    res.json({
      success: true,
      data: {
        analysis,
        debugSuggestions,
        error_message,
        context,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI debugging failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provide debugging assistance',
      message: error.message
    });
  }
});

/**
 * @desc    Estimate project complexity and timeline
 * @route   POST /api/ai/estimate-project
 * @access  Private
 */
router.post('/estimate-project', async (req, res) => {
  try {
    const { requirements, boardType = 'arduino-uno', experience_level = 'intermediate' } = req.body;

    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        error: 'Requirements array is required'
      });
    }

    console.log('Estimating project', {
      userId: req.user._id,
      requirementsCount: requirements.length,
      boardType,
      experience_level
    });

    // Calculate complexity based on requirements
    const complexityScore = Math.min(100, requirements.length * 15 + Math.random() * 20);
    const estimatedHours = Math.ceil(complexityScore / 10);

    const estimate = {
      complexity_score: Math.round(complexityScore),
      estimated_hours: estimatedHours,
      estimated_days: Math.ceil(estimatedHours / 8),
      difficulty_level: complexityScore > 70 ? 'advanced' : complexityScore > 40 ? 'intermediate' : 'beginner',
      recommended_skills: [
        'Arduino programming',
        'Circuit design',
        'Sensor integration',
        'Power management'
      ],
      milestones: [
        'Component selection and circuit design',
        'Basic functionality implementation',
        'Sensor integration and testing',
        'Optimization and final testing'
      ],
      risk_factors: complexityScore > 60 ? [
        'Complex sensor integration',
        'Power management challenges',
        'Timing-critical operations'
      ] : []
    };

    res.json({
      success: true,
      data: {
        estimate,
        requirements,
        boardType,
        experience_level,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Project estimation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate project',
      message: error.message
    });
  }
});

module.exports = router;