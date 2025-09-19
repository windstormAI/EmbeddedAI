/**
 * Embedded Systems Design Platform - Backend Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const logger = require('./utils/logger');
// const cacheService = require('./services/cacheService');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Project = require('./models/Project');
const Component = require('./models/Component');

// Import middleware
// const { optionalAuth } = require('./middleware/auth');
// const {
//   tenantIsolation,
//   tenantDataFilter,
//   tenantRateLimit,
//   tenantContext,
//   tenantAuditLog,
//   getTenantFeatures
// } = require('./middleware/tenant');
// const {
//   requestMonitoring,
//   databaseMonitoring,
//   aiMonitoring,
//   simulationMonitoring,
//   errorMonitoring,
//   healthCheck,
//   metricsEndpoint,
//   performanceMonitoring
// } = require('./middleware/monitoring');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
const PORT = process.env.PORT || 3001;

// Import validation middleware
const {
  sanitizeInput,
  preventInjection,
  requestSizeLimit,
  validateApiKeys,
  securityHeaders,
  securityLogger,
  apiLimiter,
  authLimiter,
  aiLimiter,
  handleValidationErrors,
  validateUserRegistration,
  validateProjectCreation,
  validateObjectId,
  validatePagination
} = require('./middleware/validation');

// Security middleware (applied first)
// app.use(securityHeaders);
// app.use(securityLogger);
// app.use(validateApiKeys);

// Monitoring middleware
// app.use(requestMonitoring);
// app.use(performanceMonitoring);

// Request logging
app.use(logger.logRequest);

// Rate limiting
// app.use('/api/', apiLimiter);
// app.use('/api/auth/', authLimiter);
// app.use('/api/ai/', aiLimiter);

// CORS configuration - More restrictive
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001', // Development server
      'https://embedded-platform.com', // Production domain
      /\.embedded-platform\.com$/ // Subdomains
    ];

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      return allowedOrigin.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request size limiting and parsing
app.use(requestSizeLimit);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and injection prevention
// app.use(sanitizeInput);
// app.use(preventInjection);

// Multi-tenant middleware
// app.use(tenantIsolation);
// app.use(tenantContext);
// app.use(tenantRateLimit);
// app.use(tenantAuditLog);

// Database connection (optional for development)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/embedded', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Database connected successfully', {
    database: mongoose.connection.name,
    host: mongoose.connection.host
  });
})
.catch(err => {
  logger.warn('Database connection failed - running without database', {
    error: err.message
  });
  // Don't exit process - allow server to run without database
});

// Handle database connection events
mongoose.connection.on('error', (err) => {
  logger.error('Database runtime error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Database disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Database reconnected');
});

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const aiRoutes = require('./routes/ai');
const advancedAIRoutes = require('./routes/advancedAI');
const simulationRoutes = require('./routes/simulation');
const hardwareRoutes = require('./routes/hardware');
const platformioRoutes = require('./routes/platformio');
const kicadRoutes = require('./routes/kicad');
const billingRoutes = require('./routes/billing');
const stripeRoutes = require('./routes/stripe');

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Advanced AI routes
app.use('/api/ai/advanced', advancedAIRoutes);

// Simulation routes
app.use('/api/simulation', simulationRoutes);

// Hardware routes
app.use('/api/hardware', hardwareRoutes);

// PlatformIO routes
app.use('/api/platformio', platformioRoutes);

// KiCad routes
app.use('/api/kicad', kicadRoutes);

// Billing routes
app.use('/api/billing', billingRoutes);

// Stripe routes
app.use('/api/stripe', stripeRoutes);

// Components API (public for now)
app.get('/api/components', async (req, res) => {
  try {
    const { category, type } = req.query;

    let query = {
      $or: [
        { isBuiltIn: true },
        { status: 'approved' }
      ]
    };

    if (category) query.category = category;
    if (type) query.type = type;

    const components = await Component.find(query)
      .sort({ usageCount: -1 })
      .limit(50);

    res.json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components'
    });
  }
});

// Users API (basic)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }, 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error monitoring middleware
// app.use(errorMonitoring);

// Global error handler
app.use((error, req, res, next) => {
  logger.logError(error, req, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Basic Socket.io handlers
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    features: ['Socket.io', 'MongoDB', 'JWT Auth', 'REST API']
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');

  try {
    // Close Socket.io connections
    io.close(() => {
      logger.info('Socket.io connections closed');
    });

    // Close database connection
    await mongoose.connection.close(() => {
      logger.info('Database connection closed');
    });

    // Close cache connection
    // await cacheService.close();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});