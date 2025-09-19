/**
 * Input Validation Middleware
 * Comprehensive validation for all API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize string fields
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Prevent SQL injection and other injection attacks
 */
const preventInjection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\#)|(\%27)|(\%22)|(\%3B)|(\%3C)|(\%3E)|(\%2F\*))/i,
    /(<script|javascript:|vbscript:|onload=|onerror=|onclick=)/i
  ];

  const checkForInjection = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForInjection);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkForInjection);
    }
    return false;
  };

  // Check all input sources
  const sources = [req.body, req.query, req.params, req.headers];
  const hasInjection = sources.some(source => checkForInjection(source));

  if (hasInjection) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      code: 'INJECTION_DETECTED'
    });
  }

  next();
};

/**
 * Request size limits
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  next();
};

/**
 * Validate API keys for external services
 */
const validateApiKeys = (req, res, next) => {
  // Skip validation for auth routes and health checks
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
    return next();
  }

  // Add API key validation logic here if needed
  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.openai.com; " +
    "frame-ancestors 'none';"
  );

  next();
};

/**
 * Security logger middleware
 */
const securityLogger = (req, res, next) => {
  const suspiciousActivities = [
    req.path.includes('..'), // Directory traversal
    req.headers['user-agent']?.includes('sqlmap') || req.headers['user-agent']?.includes('nmap'),
    req.url.includes('%00'), // Null byte injection
    req.headers['referer']?.includes('<script')
  ];

  if (suspiciousActivities.some(activity => activity)) {
    console.warn('Suspicious activity detected:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Rate limiting configurations
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  });
};

// Different rate limits for different endpoints
const apiLimiter = createRateLimit(15 * 60 * 1000, 1000, 'Too many API requests'); // 1000 requests per 15 minutes
const authLimiter = createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'); // 10 auth attempts per 15 minutes
const aiLimiter = createRateLimit(60 * 1000, 20, 'Too many AI requests'); // 20 AI requests per minute
const uploadLimiter = createRateLimit(60 * 1000, 10, 'Too many uploads'); // 10 uploads per minute

/**
 * Validation rules for different entities
 */

// User validation
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value) => {
      // Check if username is already taken
      const User = require('../models/User');
      const existingUser = await User.findOne({ username: value.toLowerCase() });
      if (existingUser) {
        throw new Error('Username already taken');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      // Check if email is already registered
      const User = require('../models/User');
      const existingUser = await User.findOne({ email: value.toLowerCase() });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
];

// Project validation
const validateProjectCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Project name contains invalid characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'arduino-nano', 'arduino-mega', 'esp32', 'esp8266', 'raspberry-pi'])
    .withMessage('Invalid board type'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// ObjectId validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  preventInjection,
  requestSizeLimit,
  validateApiKeys,
  securityHeaders,
  securityLogger,
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  validateUserRegistration,
  validateProjectCreation,
  validateObjectId,
  validatePagination
};