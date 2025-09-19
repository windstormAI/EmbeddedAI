/**
 * Collaboration, Marketplace, Documentation, and Research Routes
 * API endpoints for team collaboration, marketplace, docs, and research
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const CollaborationService = require('../services/collaborationService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// COLLABORATION ROUTES

/**
 * @desc    Create collaborative session
 * @route   POST /api/collaboration/sessions
 * @access  Private
 */
router.post('/sessions', [
  body('projectId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project ID must be 1-100 characters'),
  body('config')
    .optional()
    .isObject()
    .withMessage('Config must be an object')
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

    const { projectId, config } = req.body;
    const creatorId = req.user._id;

    const session = CollaborationService.createSession(projectId, creatorId, config);

    res.status(201).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Session creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * @desc    Join collaborative session
 * @route   POST /api/collaboration/sessions/:sessionId/join
 * @access  Private
 */
router.post('/sessions/:sessionId/join', [
  body('userInfo')
    .optional()
    .isObject()
    .withMessage('User info must be an object')
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

    const { sessionId } = req.params;
    const { userInfo } = req.body;
    const userId = req.user._id;

    const session = CollaborationService.joinSession(sessionId, userId, userInfo);

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Session join failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join session'
    });
  }
});

/**
 * @desc    Update cursor position
 * @route   PUT /api/collaboration/sessions/:sessionId/cursor
 * @access  Private
 */
router.put('/sessions/:sessionId/cursor', [
  body('position')
    .isObject()
    .withMessage('Position must be an object'),
  body('position.line')
    .isNumeric()
    .withMessage('Line must be numeric'),
  body('position.column')
    .isNumeric()
    .withMessage('Column must be numeric')
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

    const { sessionId } = req.params;
    const { position } = req.body;
    const userId = req.user._id;

    CollaborationService.updateCursor(sessionId, userId, position);

    res.json({
      success: true
    });

  } catch (error) {
    console.error('Cursor update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cursor'
    });
  }
});

/**
 * @desc    Record collaborative change
 * @route   POST /api/collaboration/sessions/:sessionId/changes
 * @access  Private
 */
router.post('/sessions/:sessionId/changes', [
  body('change')
    .isObject()
    .withMessage('Change must be an object'),
  body('change.type')
    .isIn(['insert', 'delete', 'replace'])
    .withMessage('Invalid change type')
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

    const { sessionId } = req.params;
    const { change } = req.body;
    const userId = req.user._id;

    const changeRecord = CollaborationService.recordChange(sessionId, userId, change);

    res.json({
      success: true,
      data: changeRecord
    });

  } catch (error) {
    console.error('Change recording failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record change'
    });
  }
});

// MARKETPLACE ROUTES

/**
 * @desc    Publish item to marketplace
 * @route   POST /api/collaboration/marketplace
 * @access  Private
 */
router.post('/marketplace', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be 10-1000 characters'),
  body('category')
    .isIn(['components', 'templates', 'libraries', 'services'])
    .withMessage('Invalid category'),
  body('subcategory')
    .isString()
    .withMessage('Subcategory is required'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be numeric'),
  body('type')
    .optional()
    .isIn(['free', 'paid', 'subscription'])
    .withMessage('Invalid type')
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

    const itemData = req.body;
    const publisherId = req.user._id;

    const item = await CollaborationService.publishToMarketplace(itemData, publisherId);

    res.status(201).json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('Marketplace publish failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish to marketplace'
    });
  }
});

/**
 * @desc    Search marketplace
 * @route   GET /api/collaboration/marketplace/search
 * @access  Private
 */
router.get('/marketplace/search', async (req, res) => {
  try {
    const { q: query, category, subcategory, type, minRating, maxPrice } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (type) filters.type = type;
    if (minRating) filters.rating = { min: parseFloat(minRating) };
    if (maxPrice) filters.priceRange = { max: parseFloat(maxPrice) };

    const results = CollaborationService.searchMarketplace(query, filters);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Marketplace search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search marketplace'
    });
  }
});

/**
 * @desc    Download marketplace item
 * @route   POST /api/collaboration/marketplace/:itemId/download
 * @access  Private
 */
router.post('/marketplace/:itemId/download', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const item = await CollaborationService.downloadItem(itemId, userId);

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('Marketplace download failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download item'
    });
  }
});

// DOCUMENTATION ROUTES

/**
 * @desc    Generate documentation
 * @route   POST /api/collaboration/documentation
 * @access  Private
 */
router.post('/documentation', [
  body('projectData')
    .isObject()
    .withMessage('Project data must be an object'),
  body('projectData.id')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project ID must be 1-100 characters'),
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

    const { projectData, options = {} } = req.body;

    const documentation = await CollaborationService.generateDocumentation(projectData, options);

    res.status(201).json({
      success: true,
      data: documentation
    });

  } catch (error) {
    console.error('Documentation generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation'
    });
  }
});

/**
 * @desc    Get documentation
 * @route   GET /api/collaboration/documentation/:docId
 * @access  Private
 */
router.get('/documentation/:docId', async (req, res) => {
  try {
    const { docId } = req.params;

    const documentation = CollaborationService.getDocumentation(docId);

    if (!documentation) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      data: documentation
    });

  } catch (error) {
    console.error('Get documentation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get documentation'
    });
  }
});

/**
 * @desc    Export documentation
 * @route   GET /api/collaboration/documentation/:docId/export
 * @access  Private
 */
router.get('/documentation/:docId/export', async (req, res) => {
  try {
    const { docId } = req.params;
    const { format = 'pdf' } = req.query;

    const exportData = await CollaborationService.exportDocumentation(docId, format);

    res.setHeader('Content-Disposition', `attachment; filename="${exportData.path.split('/').pop()}"`);
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/markdown');

    // In real implementation, stream the file
    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Documentation export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export documentation'
    });
  }
});

// RESEARCH ROUTES

/**
 * @desc    Add research paper
 * @route   POST /api/collaboration/research
 * @access  Private
 */
router.post('/research', [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters'),
  body('abstract')
    .isLength({ min: 50, max: 1000 })
    .withMessage('Abstract must be 50-1000 characters'),
  body('category')
    .isString()
    .withMessage('Category is required'),
  body('content')
    .optional()
    .isLength({ max: 50000 })
    .withMessage('Content must be less than 50,000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
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

    const paperData = req.body;
    const authorId = req.user._id;

    const paper = await CollaborationService.addResearchPaper(paperData, authorId);

    res.status(201).json({
      success: true,
      data: paper
    });

  } catch (error) {
    console.error('Research paper addition failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add research paper'
    });
  }
});

/**
 * @desc    Search research papers
 * @route   GET /api/collaboration/research/search
 * @access  Private
 */
router.get('/research/search', async (req, res) => {
  try {
    const { q: query, category, author, year, tags } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (author) filters.author = author;
    if (year) filters.year = parseInt(year);
    if (tags) filters.tags = tags.split(',');

    const results = CollaborationService.searchResearch(query, filters);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Research search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search research'
    });
  }
});

/**
 * @desc    Get latest research
 * @route   GET /api/collaboration/research/latest
 * @access  Private
 */
router.get('/research/latest', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    const papers = CollaborationService.getLatestResearch(category, parseInt(limit));

    res.json({
      success: true,
      count: papers.length,
      data: papers
    });

  } catch (error) {
    console.error('Get latest research failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest research'
    });
  }
});

/**
 * @desc    Get research paper
 * @route   GET /api/collaboration/research/:paperId
 * @access  Private
 */
router.get('/research/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;

    const paper = CollaborationService.getResearchPaper(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: 'Research paper not found'
      });
    }

    res.json({
      success: true,
      data: paper
    });

  } catch (error) {
    console.error('Get research paper failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get research paper'
    });
  }
});

/**
 * @desc    Link research to project
 * @route   POST /api/collaboration/research/:paperId/link
 * @access  Private
 */
router.post('/research/:paperId/link', [
  body('projectId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project ID must be 1-100 characters')
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

    const { paperId } = req.params;
    const { projectId } = req.body;

    const paper = CollaborationService.linkResearchToProject(paperId, projectId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: 'Research paper not found'
      });
    }

    res.json({
      success: true,
      data: paper
    });

  } catch (error) {
    console.error('Research linking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link research to project'
    });
  }
});

// UTILITY ROUTES

/**
 * @desc    Get marketplace categories
 * @route   GET /api/collaboration/marketplace/categories
 * @access  Private
 */
router.get('/marketplace/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'components',
        name: 'Components',
        subcategories: ['sensors', 'actuators', 'microcontrollers', 'displays', 'communication']
      },
      {
        id: 'templates',
        name: 'Project Templates',
        subcategories: ['iot', 'robotics', 'automation', 'education', 'industrial']
      },
      {
        id: 'libraries',
        name: 'Code Libraries',
        subcategories: ['arduino', 'esp32', 'raspberry_pi', 'ai_ml', 'communication']
      },
      {
        id: 'services',
        name: 'Services',
        subcategories: ['consulting', 'development', 'training', 'support']
      }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
});

/**
 * @desc    Get session data
 * @route   GET /api/collaboration/sessions/:sessionId
 * @access  Private
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = CollaborationService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Get session failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

module.exports = router;