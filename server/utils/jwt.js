/**
 * JWT Utility Functions
 * Token generation and validation
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} userId - User ID to encode in token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'embedded-platform',
      audience: 'embedded-users'
    }
  );
};

/**
 * Generate refresh token
 * @param {string} userId - User ID to encode in token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: 'embedded-platform',
      audience: 'embedded-users'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
      {
        issuer: 'embedded-platform',
        audience: 'embedded-users'
      }
    );
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
      {
        issuer: 'embedded-platform',
        audience: 'embedded-users'
      }
    );
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error('Cannot decode token');
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error('Token has no expiration');
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Cannot get token expiration');
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  try {
    const expiration = getTokenExpiration(token);
    return expiration < new Date();
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Generate token pair
 * @param {string} userId - User ID
 * @returns {object} Object with accessToken and refreshToken
 */
const generateTokenPair = (userId) => {
  const accessToken = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  generateTokenPair
};