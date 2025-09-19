/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Global test database
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to test database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Stop in-memory MongoDB server
  await mongoServer.stop();
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user',
      isActive: true,
      emailVerified: true
    };

    const user = new User({ ...defaultUser, ...overrides });
    await user.save();
    return user;
  },

  // Create test project
  createTestProject: async (userId, overrides = {}) => {
    const Project = require('../models/Project');
    const defaultProject = {
      user: userId,
      name: 'Test Project',
      description: 'A test project',
      boardType: 'arduino-uno',
      codeLanguage: 'cpp',
      code: 'void setup() {} void loop() {}',
      circuitData: {
        components: [],
        connections: []
      },
      tags: ['test'],
      isPublic: false,
      category: 'basic',
      difficulty: 'beginner'
    };

    const project = new Project({ ...defaultProject, ...overrides });
    await project.save();
    return project;
  },

  // Generate test JWT token
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  },

  // Mock request/response objects
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  createMockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  createMockNext: () => jest.fn()
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};