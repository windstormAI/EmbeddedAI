/**
 * Authentication Routes
 * JWT-based authentication with user registration and login
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock user storage (replace with database later)
let mockUsers = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMmiP2Vy', // password: demo123
    role: 'user',
    createdAt: new Date(),
    lastLogin: null
  }
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = mockUsers.find(user =>
      user.email === email || user.username === username
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      username,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      lastLogin: null
    };

    mockUsers.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    logger.info(`New user registered: ${username} (${email})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/v1/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // In a real implementation, this would come from middleware
    const userId = req.user?.id || '1'; // Mock user ID

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/v1/auth/me
// @desc    Update user profile
// @access  Private
router.put('/me', [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user?.id || '1'; // Mock user ID
    const updates = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates
    };

    const updatedUser = mockUsers[userIndex];

    logger.info(`User profile updated: ${updatedUser.username}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role
        }
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  // In JWT, logout is typically handled client-side by removing the token
  // For server-side logout, you might want to implement a token blacklist
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   POST /api/v1/auth/github
// @desc    GitHub OAuth login (mock implementation)
// @access  Public
router.post('/github', async (req, res) => {
  try {
    // Mock GitHub OAuth - in real implementation, this would handle OAuth flow
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code required'
      });
    }

    // Mock GitHub user data
    const githubUser = {
      id: 'github_123',
      username: 'github_user',
      email: 'github@example.com',
      avatar: 'https://github.com/images/error/avatar_happy.gif'
    };

    // Check if user exists, create if not
    let user = mockUsers.find(u => u.email === githubUser.email);
    if (!user) {
      user = {
        id: (mockUsers.length + 1).toString(),
        username: githubUser.username,
        email: githubUser.email,
        password: '', // OAuth users don't have passwords
        role: 'user',
        githubId: githubUser.id,
        avatar: githubUser.avatar,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      mockUsers.push(user);
    }

    const token = generateToken(user.id);

    logger.info(`GitHub login: ${user.username}`);

    res.json({
      success: true,
      message: 'GitHub login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });

  } catch (error) {
    logger.error('GitHub auth error:', error);
    res.status(500).json({
      success: false,
      message: 'GitHub authentication failed'
    });
  }
});

export default router;