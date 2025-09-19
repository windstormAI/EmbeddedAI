/**
 * GitHub Integration Routes
 * API endpoints for GitHub repository operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const githubService = require('../services/githubService');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @desc    Connect GitHub account
 * @route   POST /api/github/connect
 * @access  Private
 */
router.post('/connect', [
  // Validation middleware
  body('code')
    .notEmpty()
    .withMessage('Authorization code is required'),

  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string')
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

    const { code, state } = req.body;

    console.log('[GitHub API] Connecting GitHub account for user:', req.user._id);

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      return res.status(400).json({
        success: false,
        error: 'Failed to obtain GitHub access token'
      });
    }

    // Validate token and get user profile
    const validation = await githubService.validateToken(req.user._id, tokenResponse.access_token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub token',
        details: validation.error
      });
    }

    // Get user profile
    const profile = await githubService.getUserProfile(req.user._id);

    // Update user with GitHub information
    await User.findByIdAndUpdate(req.user._id, {
      githubId: profile.id,
      githubUsername: profile.login,
      githubAccessToken: tokenResponse.access_token, // Encrypted in production
      githubProfile: profile,
      githubConnected: true,
      githubConnectedAt: new Date()
    });

    console.log('[GitHub API] GitHub account connected successfully');

    res.json({
      success: true,
      data: {
        profile,
        connected: true,
        connectedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[GitHub API] Connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during GitHub connection'
    });
  }
});

/**
 * @desc    Get GitHub profile
 * @route   GET /api/github/profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    console.log('[GitHub API] Getting profile for user:', req.user._id);

    const profile = await githubService.getUserProfile(req.user._id);

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[GitHub API] Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GitHub profile'
    });
  }
});

/**
 * @desc    Get user repositories
 * @route   GET /api/github/repositories
 * @access  Private
 */
router.get('/repositories', async (req, res) => {
  try {
    const { type, sort, limit } = req.query;

    console.log('[GitHub API] Getting repositories for user:', req.user._id);

    const options = {};
    if (type) options.type = type;
    if (sort) options.sort = sort;
    if (limit) options.limit = parseInt(limit);

    const repositories = await githubService.getUserRepositories(req.user._id, options);

    res.json({
      success: true,
      data: repositories,
      count: repositories.length
    });

  } catch (error) {
    console.error('[GitHub API] Repositories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GitHub repositories'
    });
  }
});

/**
 * @desc    Create new repository
 * @route   POST /api/github/repositories
 * @access  Private
 */
router.post('/repositories', [
  // Validation middleware
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Repository name can only contain letters, numbers, hyphens, underscores, and dots'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('private')
    .optional()
    .isBoolean()
    .withMessage('Private must be a boolean')
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

    const { name, description, private: isPrivate } = req.body;

    console.log('[GitHub API] Creating repository:', name, 'for user:', req.user._id);

    const repoData = {
      name,
      description: description || '',
      private: isPrivate || false
    };

    const repository = await githubService.createRepository(req.user._id, repoData);

    res.status(201).json({
      success: true,
      data: repository
    });

  } catch (error) {
    console.error('[GitHub API] Create repository error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Repository with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create GitHub repository'
    });
  }
});

/**
 * @desc    Push project to GitHub
 * @route   POST /api/github/push
 * @access  Private
 */
router.post('/push', [
  // Validation middleware
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),

  body('repository')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository name is required'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Commit message cannot exceed 200 characters')
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

    const { projectId, repository, message, createRepo } = req.body;

    console.log('[GitHub API] Pushing project:', projectId, 'to repo:', repository);

    // Get project data from database
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Create repository if requested
    if (createRepo) {
      try {
        await githubService.createRepository(req.user._id, {
          name: repository,
          description: `Embedded project: ${project.name}`,
          private: false
        });
      } catch (error) {
        // Repository might already exist, continue
        console.log('[GitHub API] Repository creation skipped:', error.message);
      }
    }

    // Prepare project data for GitHub
    const projectData = {
      name: project.name,
      description: project.description,
      boardType: project.boardType,
      code: project.code,
      circuitData: project.circuitData,
      author: req.user.name,
      features: project.features || []
    };

    // Push to GitHub
    const result = await githubService.pushProjectToRepository(
      req.user._id,
      projectData,
      repository,
      {
        message: message || `Update project: ${project.name}`,
        projectName: project.name
      }
    );

    // Update project with GitHub info
    await Project.findByIdAndUpdate(projectId, {
      githubRepo: result.repository.full_name,
      githubUrl: result.repository.html_url,
      lastPushedToGitHub: new Date(),
      githubPushHistory: [
        ...(project.githubPushHistory || []),
        {
          commit: result.commit.sha,
          message: result.commit.message,
          timestamp: new Date(),
          repository: result.repository.full_name
        }
      ]
    });

    console.log('[GitHub API] Project pushed successfully');

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[GitHub API] Push error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found. Make sure it exists and you have access.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to push project to GitHub'
    });
  }
});

/**
 * @desc    Fork repository
 * @route   POST /api/github/fork
 * @access  Private
 */
router.post('/fork', [
  // Validation middleware
  body('owner')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository owner is required'),

  body('repo')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository name is required')
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

    const { owner, repo } = req.body;

    console.log('[GitHub API] Forking repository:', `${owner}/${repo}`);

    const forkedRepo = await githubService.forkRepository(req.user._id, owner, repo);

    res.json({
      success: true,
      data: forkedRepo
    });

  } catch (error) {
    console.error('[GitHub API] Fork error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fork repository'
    });
  }
});

/**
 * @desc    Create pull request
 * @route   POST /api/github/pull-request
 * @access  Private
 */
router.post('/pull-request', [
  // Validation middleware
  body('owner')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository owner is required'),

  body('repo')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Repository name is required'),

  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pull request title is required'),

  body('head')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Head branch is required'),

  body('base')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Base branch is required'),

  body('body')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Body cannot exceed 1000 characters')
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

    const { owner, repo, title, head, base, body } = req.body;

    console.log('[GitHub API] Creating pull request for:', `${owner}/${repo}`);

    const repoData = { owner, name: repo };
    const prData = { title, head, base, body: body || '' };

    const pullRequest = await githubService.createPullRequest(req.user._id, repoData, prData);

    res.json({
      success: true,
      data: pullRequest
    });

  } catch (error) {
    console.error('[GitHub API] Pull request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pull request'
    });
  }
});

/**
 * @desc    Get repository contents
 * @route   GET /api/github/repositories/:owner/:repo/contents
 * @access  Private
 */
router.get('/repositories/:owner/:repo/contents', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path } = req.query;

    console.log('[GitHub API] Getting contents for:', `${owner}/${repo}/${path || ''}`);

    const contents = await githubService.getRepositoryContents(req.user._id, owner, repo, path);

    res.json({
      success: true,
      data: contents
    });

  } catch (error) {
    console.error('[GitHub API] Contents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get repository contents'
    });
  }
});

/**
 * @desc    Get repository statistics
 * @route   GET /api/github/repositories/:owner/:repo/stats
 * @access  Private
 */
router.get('/repositories/:owner/:repo/stats', async (req, res) => {
  try {
    const { owner, repo } = req.params;

    console.log('[GitHub API] Getting stats for:', `${owner}/${repo}`);

    const stats = await githubService.getRepositoryStats(req.user._id, owner, repo);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[GitHub API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get repository statistics'
    });
  }
});

/**
 * @desc    Disconnect GitHub account
 * @route   DELETE /api/github/disconnect
 * @access  Private
 */
router.delete('/disconnect', async (req, res) => {
  try {
    console.log('[GitHub API] Disconnecting GitHub account for user:', req.user._id);

    // Remove GitHub information from user
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        githubId: 1,
        githubUsername: 1,
        githubAccessToken: 1,
        githubProfile: 1,
        githubConnected: 1,
        githubConnectedAt: 1
      }
    });

    // Clear token from service
    githubService.userTokens.delete(req.user._id);

    res.json({
      success: true,
      message: 'GitHub account disconnected successfully'
    });

  } catch (error) {
    console.error('[GitHub API] Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect GitHub account'
    });
  }
});

/**
 * @desc    Get GitHub OAuth URL
 * @route   GET /api/github/oauth-url
 * @access  Private
 */
router.get('/oauth-url', async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.CLIENT_URL}/github/callback`;
    const scope = 'repo,user';
    const state = generateState();

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    res.json({
      success: true,
      data: {
        url: oauthUrl,
        state: state
      }
    });

  } catch (error) {
    console.error('[GitHub API] OAuth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

// Helper function to exchange code for token
async function exchangeCodeForToken(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  return await response.json();
}

// Helper function to generate state
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = router;