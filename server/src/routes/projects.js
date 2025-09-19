/**
 * Projects Routes
 * CRUD operations for user projects
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../../models/Project');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/v1/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const projects = await Project.find({ user: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name description createdAt updatedAt version tags isPublic status category difficulty');

    const total = await Project.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        projects,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// @route   POST /api/v1/projects
// @desc    Create a new project
// @access  Private
router.post('/', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'arduino-nano', 'arduino-mega', 'esp32', 'esp8266', 'raspberry-pi'])
    .withMessage('Invalid board type'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { name, description, boardType, tags, isPublic, category, difficulty } = req.body;

    const newProject = new Project({
      user: userId,
      name,
      description: description || '',
      boardType: boardType || 'arduino-uno',
      circuitData: {
        components: [],
        connections: [],
        metadata: {
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
          backgroundColor: '#ffffff'
        }
      },
      code: `// New Arduino Project
void setup() {
  // Initialize your components here
  Serial.begin(9600);
}

void loop() {
  // Your main code here

}`,
      tags: tags || [],
      isPublic: isPublic || false,
      category: category || 'basic',
      difficulty: difficulty || 'beginner'
    });

    const savedProject = await newProject.save();

    logger.info(`New project created: ${name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: savedProject
      }
    });

  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// @route   GET /api/v1/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const projectId = req.params.id;

    const project = await Project.findOne({
      _id: projectId,
      user: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: {
        project
      }
    });

  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// @route   PUT /api/v1/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('circuitData')
    .optional()
    .isObject()
    .withMessage('Circuit data must be an object'),
  body('code')
    .optional()
    .isString()
    .withMessage('Code must be a string'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const projectId = req.params.id;
    const updates = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: projectId, user: userId },
      {
        ...updates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    logger.info(`Project updated: ${project.name} (v${project.version})`);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project
      }
    });

  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// @route   DELETE /api/v1/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const projectId = req.params.id;

    const project = await Project.findOneAndDelete({
      _id: projectId,
      user: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    logger.info(`Project deleted: ${project.name}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

// @route   POST /api/v1/projects/:id/duplicate
// @desc    Duplicate a project
// @access  Private
router.post('/:id/duplicate', async (req, res) => {
  try {
    const userId = req.user?.id || '1'; // Mock user ID
    const projectId = req.params.id;

    const originalProject = mockProjects.find(p => p.id === projectId && p.userId === userId);

    if (!originalProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const duplicatedProject = {
      ...originalProject,
      id: (mockProjects.length + 1).toString(),
      name: `${originalProject.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    mockProjects.push(duplicatedProject);

    logger.info(`Project duplicated: ${originalProject.name} -> ${duplicatedProject.name}`);

    res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      data: {
        project: duplicatedProject
      }
    });

  } catch (error) {
    logger.error('Duplicate project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/v1/projects/:id/share
// @desc    Share project publicly
// @access  Private
router.post('/:id/share', async (req, res) => {
  try {
    const userId = req.user?.id || '1'; // Mock user ID
    const projectId = req.params.id;

    const projectIndex = mockProjects.findIndex(p => p.id === projectId && p.userId === userId);

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    mockProjects[projectIndex].isPublic = true;
    mockProjects[projectIndex].updatedAt = new Date();

    logger.info(`Project shared publicly: ${mockProjects[projectIndex].name}`);

    res.json({
      success: true,
      message: 'Project shared successfully',
      data: {
        shareUrl: `https://platform.example.com/shared/${projectId}`,
        project: mockProjects[projectIndex]
      }
    });

  } catch (error) {
    logger.error('Share project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/v1/projects/public/:id
// @desc    Get public project by ID
// @access  Public
router.get('/public/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = mockProjects.find(p => p.id === projectId && p.isPublic);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Public project not found'
      });
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          circuitData: project.circuitData,
          code: project.code,
          tags: project.tags,
          createdAt: project.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Get public project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;