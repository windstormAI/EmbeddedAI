/**
 * Authentication Middleware
 * JWT token validation and user authentication
 */

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Mock user database (replace with actual database later)
const mockUsers = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
    role: 'user'
  }
];

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Find user (in real implementation, this would query the database)
    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Attach user to request
    req.user = user;

    logger.debug(`Authenticated user: ${user.username} (${user.id})`);

    next();

  } catch (error) {
    logger.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - resource not owned by user'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = mockUsers.find(u => u.id === decoded.userId);

      if (user) {
        req.user = user;
        logger.debug(`Optional auth - authenticated user: ${user.username}`);
      }
    }

    next();

  } catch (error) {
    // For optional auth, we don't fail on errors
    logger.debug('Optional auth failed, continuing without authentication');
    next();
  }
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (replace with Redis in production)
  const clientIP = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // 5 requests per window

  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const userAttempts = global.rateLimitStore.get(clientIP) || [];

  // Remove old attempts outside the window
  const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);

  if (validAttempts.length >= maxRequests) {
    logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((windowMs - (now - validAttempts[0])) / 1000)
    });
  }

  // Add current attempt
  validAttempts.push(now);
  global.rateLimitStore.set(clientIP, validAttempts);

  next();
};

/**
 * Middleware to refresh JWT tokens
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token (in production, store refresh tokens in database)
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');

    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`Token refreshed for user: ${user.username}`);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Middleware to log authentication events
 */
export const logAuthEvents = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log authentication events
    if (req.path.includes('/auth/') && res.statusCode >= 200 && res.statusCode < 300) {
      const user = req.user || { id: 'unknown' };
      logger.info(`Auth event: ${req.method} ${req.path}`, {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to validate API key for external services
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : ['demo-key'];

  if (!validApiKeys.includes(apiKey)) {
    logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};

/**
 * Middleware to check user permissions for specific actions
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Mock permission system (replace with actual RBAC in production)
    const userPermissions = {
      user: ['read_own_projects', 'create_projects', 'update_own_projects', 'delete_own_projects'],
      admin: ['read_all_projects', 'create_projects', 'update_all_projects', 'delete_all_projects', 'manage_users', 'manage_components']
    };

    const userRolePermissions = userPermissions[req.user.role] || [];

    if (!userRolePermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`
      });
    }

    next();
  };
};

export default {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
  authRateLimit,
  refreshToken,
  logAuthEvents,
  validateApiKey,
  checkPermission
};