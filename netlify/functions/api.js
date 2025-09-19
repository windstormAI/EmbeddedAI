/**
 * Netlify Function - Main API Handler
 * Routes API requests to appropriate handlers
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import handlers
const authHandler = require('./handlers/auth');
const projectHandler = require('./handlers/projects');
const componentHandler = require('./handlers/components');
const aiHandler = require('./handlers/ai');

// Database connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    cachedDb = connection;
    return cachedDb;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Main handler function
exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Parse request
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    const headers = event.headers;
    const body = event.body ? JSON.parse(event.body) : {};

    // Extract user from JWT token
    let user = null;
    const authHeader = headers.authorization || headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }

    // Route to appropriate handler
    let result;

    // Authentication routes
    if (path.startsWith('/auth')) {
      result = await authHandler.handle(path.replace('/auth', ''), method, body, headers);
    }
    // Project routes
    else if (path.startsWith('/projects')) {
      result = await projectHandler.handle(path.replace('/projects', ''), method, body, headers, user);
    }
    // Component routes
    else if (path.startsWith('/components')) {
      result = await componentHandler.handle(path.replace('/components', ''), method, body, headers, user);
    }
    // AI routes
    else if (path.startsWith('/ai')) {
      result = await aiHandler.handle(path.replace('/ai', ''), method, body, headers, user);
    }
    // Health check
    else if (path === '/health' && method === 'GET') {
      result = {
        statusCode: 200,
        body: JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
          version: '1.0.0'
        })
      };
    }
    // 404 Not Found
    else {
      result = {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: 'API endpoint not found',
          path: path,
          method: method
        })
      };
    }

    // Add CORS headers to response
    if (result.headers) {
      result.headers = { ...result.headers, ...corsHeaders };
    } else {
      result.headers = corsHeaders;
    }

    return result;

  } catch (error) {
    console.error('API Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      })
    };
  }
};