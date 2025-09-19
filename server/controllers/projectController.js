const Project = require('../models/Project');
const cacheService = require('../services/cacheService');
const CacheService = require('../services/cacheService');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private (authenticated users see their projects, public for others)
 */
const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const includePublic = req.query.includePublic === 'true';
    const cacheKey = CacheService.keys.userProjects(userId);

    // Try to get from cache first
    if (cacheService.isAvailable()) {
      const cachedProjects = await cacheService.get(cacheKey);
      if (cachedProjects) {
        return res.status(200).json({
          success: true,
          count: cachedProjects.length,
          data: cachedProjects,
          cached: true
        });
      }
    }

    // Use tenant filter from middleware (automatically filters by user)
    const query = req.tenantFilter || {};

    // Add additional filters for public projects if requested
    if (includePublic) {
      query.$or = [
        { user: userId },
        { isPublic: true }
      ];
    }

    const projects = await Project.find(query)
      .populate('user', 'username name avatar')
      .sort({ updatedAt: -1 })
      .limit(50);

    // Cache the results
    if (cacheService.isAvailable()) {
      await cacheService.set(cacheKey, projects, 300); // Cache for 5 minutes
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
      cached: false
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('user', 'username name avatar')
      .populate('collaborators.user', 'username name avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to this project
    const hasAccess = project.user._id.toString() === req.user._id.toString() ||
                     project.visibility === 'public' ||
                     project.collaborators.some(c => c.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res) => {
  try {
    const { name, description, boardType, isPublic } = req.body;

    // Create project with tenant isolation
    const project = await Project.create({
      name,
      description,
      boardType: boardType || 'arduino-uno',
      isPublic: isPublic || false,
      user: req.user._id
    });

    // Populate user data
    await project.populate('user', 'username name avatar');

    // Invalidate cache for user's projects
    if (cacheService.isAvailable()) {
      const cacheKey = CacheService.keys.userProjects(userId);
      await cacheService.del(cacheKey);
    }

    res.status(201).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Create project error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'username name avatar');

    // Invalidate cache for user's projects
    if (cacheService.isAvailable()) {
      const cacheKey = CacheService.keys.userProjects(req.user._id);
      await cacheService.del(cacheKey);

      // Also invalidate individual project cache
      const projectCacheKey = CacheService.keys.project(req.params.id);
      await cacheService.del(projectCacheKey);
    }

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Update project error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
    }

    await project.deleteOne();

    // Invalidate cache for user's projects
    if (cacheService.isAvailable()) {
      const cacheKey = CacheService.keys.userProjects(req.user._id);
      await cacheService.del(cacheKey);

      // Also invalidate individual project cache
      const projectCacheKey = CacheService.keys.project(req.params.id);
      await cacheService.del(projectCacheKey);
    }

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get user's projects
 * @route   GET /api/projects/user/:userId
 * @access  Private
 */
const getUserProjects = async (req, res) => {
  try {
    // Use tenant filter but allow viewing other users' public projects
    const baseFilter = req.tenantFilter || {};
    const query = {
      ...baseFilter,
      $or: [
        { user: req.params.userId, isPublic: true }, // Public projects of the requested user
        { user: req.user._id } // All projects of the current user
      ]
    };

    const projects = await Project.find(query)
    .populate('user', 'username name avatar')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update project circuit data
 * @route   PUT /api/projects/:id/circuit
 * @access  Private
 */
const updateCircuit = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to update this project
    const hasAccess = project.user.toString() === req.user._id.toString() ||
                     project.collaborators.some(c =>
                       c.user.toString() === req.user._id.toString() &&
                       c.role !== 'viewer'
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
    }

    // Update circuit data
    project.circuitData = req.body.circuitData;
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Update circuit error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update project code
 * @route   PUT /api/projects/:id/code
 * @access  Private
 */
const updateCode = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to update this project
    const hasAccess = project.user.toString() === req.user._id.toString() ||
                     project.collaborators.some(c =>
                       c.user.toString() === req.user._id.toString() &&
                       c.role !== 'viewer'
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
    }

    // Update code
    project.code = req.body.code;
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Update code error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getUserProjects,
  updateCircuit,
  updateCode
};