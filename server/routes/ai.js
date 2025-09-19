/**
 * AI Routes
 * OpenAI-powered code generation, analysis, and assistance
 */

const express = require('express');
const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');
const { generateToken } = require('../utils/jwt');

// Import validation middleware
const {
  validateCodeGeneration,
  validateCodeAnalysis,
  validateCodeSuggestions
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/v1/ai/generate
// @desc    Generate code from natural language description
// @access  Private
router.post('/generate', [protect, validateCodeGeneration], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      description,
      boardType = 'arduino-uno',
      language = 'arduino',
      components = [],
      existingCode = '',
      requirements = []
    } = req.body;

    console.log('AI code generation requested', {
      userId: req.user._id,
      description: description.substring(0, 50) + '...',
      boardType,
      language
    });

    const result = await aiService.generateCode(description, {
      boardType,
      components,
      existingCode,
      requirements
    });

    console.log('AI code generation completed', {
      userId: req.user._id,
      codeLength: result.code.length,
      tokensUsed: result.tokensUsed
    });

    res.json({
      success: true,
      data: {
        code: result.code,
        explanation: result.explanation,
        suggestions: result.suggestions,
        tokensUsed: result.tokensUsed,
        language,
        boardType
      }
    });

  } catch (error) {
    console.error('AI code generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Code generation failed',
      message: error.message
    });
  }
});

// @route   POST /api/v1/ai/analyze
// @desc    Analyze code for bugs, improvements, and best practices
// @access  Private
router.post('/analyze', [protect, validateCodeAnalysis], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { code, language = 'cpp' } = req.body;

    console.log('AI code analysis requested', {
      userId: req.user._id,
      codeLength: code.length,
      language
    });

    const result = await aiService.analyzeCode(code, language);

    console.log('AI code analysis completed', {
      userId: req.user._id,
      issuesFound: result.issues.length,
      suggestionsCount: result.suggestions.length,
      tokensUsed: result.tokensUsed
    });

    res.json({
      success: true,
      data: {
        analysis: result.analysis,
        issues: result.issues,
        suggestions: result.suggestions,
        tokensUsed: result.tokensUsed,
        language
      }
    });

  } catch (error) {
    console.error('AI code analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Code analysis failed',
      message: error.message
    });
  }
});

// @route   POST /api/v1/ai/suggestions
// @desc    Get code completion suggestions
// @access  Private
router.post('/suggestions', [protect, validateCodeSuggestions], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { code, cursorPosition, language = 'cpp' } = req.body;

    const result = await aiService.getCodeSuggestions(code, cursorPosition, language);

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions,
        tokensUsed: result.tokensUsed,
        language
      }
    });

  } catch (error) {
    console.error('AI code suggestions failed:', error);
    res.status(500).json({
      success: false,
      error: 'Code suggestions failed',
      message: error.message
    });
  }
});

// @route   POST /api/v1/ai/document
// @desc    Generate documentation for code
// @access  Private
router.post('/document', [
  protect,
  body('code').trim().isLength({ min: 1, max: 50000 }),
  body('language').optional().isIn(['arduino', 'cpp', 'python']),
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

    const { code, language = 'cpp' } = req.body;

    console.log('AI documentation generation requested', {
      userId: req.user._id,
      codeLength: code.length,
      language
    });

    const result = await aiService.generateDocumentation(code, language);

    console.log('AI documentation generation completed', {
      userId: req.user._id,
      tokensUsed: result.tokensUsed
    });

    res.json({
      success: true,
      data: {
        documentation: result.documentation,
        tokensUsed: result.tokensUsed,
        language
      }
    });

  } catch (error) {
    console.error('AI documentation generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Documentation generation failed',
      message: error.message
    });
  }
});

// @route   POST /api/v1/ai/circuit-to-code
// @desc    Convert circuit design to code
// @access  Private
router.post('/circuit-to-code', [
  protect,
  body('circuitData').isObject(),
  body('circuitData.components').isArray(),
  body('circuitData.connections').isArray(),
  body('boardType').optional().isIn(['arduino-uno', 'arduino-mega', 'esp32', 'esp8266', 'raspberry-pi']),
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

    const { circuitData, boardType = 'arduino-uno' } = req.body;

    console.log('AI circuit-to-code conversion requested', {
      userId: req.user._id,
      componentsCount: circuitData.components?.length || 0,
      connectionsCount: circuitData.connections?.length || 0,
      boardType
    });

    const result = await aiService.circuitToCode(circuitData, boardType);

    console.log('AI circuit-to-code conversion completed', {
      userId: req.user._id,
      codeLength: result.code.length,
      tokensUsed: result.tokensUsed
    });

    res.json({
      success: true,
      data: {
        code: result.code,
        tokensUsed: result.tokensUsed,
        boardType
      }
    });

  } catch (error) {
    console.error('AI circuit-to-code conversion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Circuit conversion failed',
      message: error.message
    });
  }
});

// @route   POST /api/v1/ai/chat
// @desc    Interactive AI chat for project guidance
// @access  Private
router.post('/chat', [
  protect,
  body('message').trim().isLength({ min: 1, max: 2000 }),
  body('context').optional().isObject(),
  body('conversationHistory').optional().isArray(),
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

    const { message, context = {}, conversationHistory = [] } = req.body;

    // Build context-aware prompt
    const systemPrompt = `You are an expert AI assistant for embedded systems development. Help users with:
1. Arduino/C++ programming
2. Circuit design and troubleshooting
3. Hardware integration
4. Best practices and optimization
5. Debugging and problem-solving
6. Project planning and guidance

Be helpful, accurate, and encouraging. Provide practical, actionable advice.`;

    const contextPrompt = buildContextPrompt(context);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await aiService.client.chat.completions.create({
      model: aiService.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response generated');
    }

    // Log conversation for analytics
    console.log('AI chat response generated', {
      userId: req.user._id,
      messageLength: message.length,
      responseLength: aiResponse.length,
      tokensUsed: response.usage?.total_tokens || 0
    });

    res.json({
      success: true,
      data: {
        response: aiResponse,
        tokensUsed: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI chat failed:', error);
    res.status(500).json({
      success: false,
      error: 'Chat failed',
      message: error.message
    });
  }
});

// Helper function to build context prompt
function buildContextPrompt(context) {
  let prompt = 'Current project context:\n';

  if (context.projectName) {
    prompt += `- Project: ${context.projectName}\n`;
  }

  if (context.boardType) {
    prompt += `- Board: ${context.boardType}\n`;
  }

  if (context.language) {
    prompt += `- Language: ${context.language}\n`;
  }

  if (context.components && context.components.length > 0) {
    prompt += `- Components: ${context.components.join(', ')}\n`;
  }

  if (context.currentCode) {
    prompt += `- Current code length: ${context.currentCode.length} characters\n`;
  }

  return prompt || 'No specific project context provided.';
}

module.exports = router;