/**
 * Jest Configuration
 * Testing configuration for both backend and frontend
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test files pattern
  testMatch: [
    '<rootDir>/server/tests/**/*.test.js',
    '<rootDir>/client/src/**/*.test.js',
    '<rootDir>/client/src/**/*.test.jsx'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/server/tests/setup.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'server/**/*.js',
    'client/src/**/*.{js,jsx}',
    '!server/index.js',
    '!client/src/index.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@server/(.*)$': '<rootDir>/server/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Restore mocks between tests
  restoreMocks: true
};