/**
 * Authentication Handler - Netlify Function
 * Handles user registration, login, and profile management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User model (simplified for Netlify Functions)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, default: 'user' },
  avatar: String,
  bio: String,
  website: String,
  location: String,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  stats: {
    projectsCreated: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 }
  }
});

// Add password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Handle authentication routes
 */
async function handle(path, method, body, headers) {
  try {
    switch (method) {
      case 'POST':
        if (path === '/register') {
          return await register(body);
        } else if (path === '/login') {
          return await login(body);
        }
        break;

      case 'GET':
        if (path === '/me') {
          return await getProfile(headers);
        }
        break;

      case 'PUT':
        if (path === '/me') {
          return await updateProfile(headers, body);
        } else if (path === '/changepassword') {
          return await changePassword(headers, body);
        }
        break;

      case 'DELETE':
        if (path === '/me') {
          return await deleteAccount(headers);
        }
        break;
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Auth endpoint not found'
      })
    };

  } catch (error) {
    console.error('Auth handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Authentication service error'
      })
    };
  }
}

/**
 * User registration
 */
async function register(body) {
  const { username, email, password, name } = body;

  // Validation
  if (!username || !email || !password || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'All fields are required'
      })
    };
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });

  if (existingUser) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: existingUser.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Username already taken'
      })
    };
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    name: name.trim()
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  return {
    statusCode: 201,
    body: JSON.stringify({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  };
}

/**
 * User login
 */
async function login(body) {
  const { email, password } = body;

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Email and password are required'
      })
    };
  }

  // Find user
  const user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: email.toLowerCase() }
    ]
  }).select('+password');

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      })
    };
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      })
    };
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    })
  };
}

/**
 * Get user profile
 */
async function getProfile(headers) {
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Not authorized'
      })
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    const user = await User.findById(decoded.id);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Invalid token'
      })
    };
  }
}

/**
 * Update user profile
 */
async function updateProfile(headers, body) {
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Not authorized'
      })
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    const allowedFields = ['name', 'bio', 'website', 'location', 'avatar'];
    const updates = {};

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    });

    const user = await User.findByIdAndUpdate(decoded.id, updates, { new: true });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Profile update failed'
      })
    };
  }
}

/**
 * Change password
 */
async function changePassword(headers, body) {
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Not authorized'
      })
    };
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Current and new passwords are required'
      })
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    const user = await User.findById(decoded.id).select('+password');
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Current password is incorrect'
        })
      };
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Password updated successfully'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Password change failed'
      })
    };
  }
}

/**
 * Delete account
 */
async function deleteAccount(headers) {
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Not authorized'
      })
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    await User.findByIdAndUpdate(decoded.id, {
      isActive: false,
      deletedAt: new Date()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Account deactivated successfully'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Account deletion failed'
      })
    };
  }
}

module.exports = { handle };