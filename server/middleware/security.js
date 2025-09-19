/**
 * Security Middleware
 * Advanced security features for the application
 */

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Rate limiting configurations
const createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use IP address for rate limiting
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress;
    },
    // Skip rate limiting for certain routes
    skip: (req) => {
      return options.skip && options.skip.some(path => req.path.startsWith(path));
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  skip: ['/health', '/api/health'] // Skip health checks
});

// Strict rate limiting for authentication
const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  skip: [] // No skips for auth routes
});

// Rate limiting for AI endpoints (expensive operations)
const aiLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  skip: []
});

// File upload rate limiting
const uploadLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 uploads per minute
  skip: []
});

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Generate CSRF token
  const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  // For state-changing operations (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token missing'
      });
    }

    // In production, validate token against session
    // For now, we'll skip validation but log the attempt
    console.log('CSRF token received:', csrfToken.substring(0, 10) + '...');
  }

  // Add CSRF token to response headers for GET requests
  if (req.method === 'GET') {
    const token = generateToken();
    res.set('X-CSRF-Token', token);
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  });

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com wss://localhost:* ws://localhost:*",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.set('Content-Security-Policy', csp);

  next();
};

// Request logging middleware for security events
const securityLogger = (req, res, next) => {
  const start = Date.now();

  // Log security-relevant information
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // Log suspicious activities
  if (req.url.includes('..') || req.url.includes('%2e%2e')) {
    console.warn('🚨 Path traversal attempt detected:', logData);
  }

  if (req.method === 'POST' && req.url.includes('/auth/login')) {
    console.log('🔐 Login attempt:', {
      ...logData,
      email: req.body?.email || 'unknown'
    });
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log security events
    if (statusCode === 401 || statusCode === 403) {
      console.warn('🚨 Authentication/Authorization failure:', {
        ...logData,
        statusCode,
        duration: `${duration}ms`
      });
    }

    // Log slow requests (potential DoS)
    if (duration > 5000) {
      console.warn('🐌 Slow request detected:', {
        ...logData,
        duration: `${duration}ms`,
        statusCode
      });
    }
  });

  next();
};

// SQL injection prevention (for MongoDB)
const preventInjection = (req, res, next) => {
  const dangerousPatterns = [
    /(\$|\{|\}|\[|\]|\||\^|\*|\+|\?|\.|\$|\(|\))/,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          console.warn('🚨 Potentially dangerous input detected:', value.substring(0, 100));
          return false;
        }
      }
    }
    return true;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        if (!checkValue(obj[key])) {
          // Remove dangerous content
          obj[key] = obj[key].replace(/[<>'"&]/g, '');
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// File upload security
const fileUploadSecurity = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json'
  ];

  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB

  const checkFile = (file) => {
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${maxSize} bytes`);
    }

    // Check filename for dangerous characters
    const dangerousChars = /[<>:"\/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.originalname)) {
      throw new Error('Filename contains dangerous characters');
    }

    // Check for double extensions
    const extensions = file.originalname.split('.');
    if (extensions.length > 2) {
      throw new Error('Double extensions not allowed');
    }
  };

  try {
    if (req.file) {
      checkFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(checkFile);
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(checkFile);
          } else {
            checkFile(fileArray);
          }
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// API key validation for external services
const validateApiKeys = (req, res, next) => {
  const requiredKeys = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI
  };

  const missingKeys = Object.entries(requiredKeys)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error('🚨 Missing required environment variables:', missingKeys);
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'Some required services are not configured'
    });
  }

  next();
};

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);

  if (contentLength && contentLength > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({
      success: false,
      error: 'Request too large',
      message: 'Maximum request size is 10MB'
    });
  }

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  csrfProtection,
  securityHeaders,
  securityLogger,
  preventInjection,
  fileUploadSecurity,
  validateApiKeys,
  requestSizeLimit,
  createRateLimit
};