/**
 * Components Handler - Netlify Function
 * Handles component library operations
 */

const mongoose = require('mongoose');

// Component model (simplified for Netlify Functions)
const ComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  library: { type: String, required: true },
  properties: {
    digitalPins: Number,
    analogPins: Number,
    pwmPins: Number,
    flashMemory: String,
    sram: String,
    eeprom: String,
    clockSpeed: String
  },
  pins: [{
    name: String,
    number: Number,
    type: { type: String, default: 'digital' },
    description: String
  }],
  stats: {
    usageCount: { type: Number, default: 0 },
    difficulty: { type: String, default: 'beginner' }
  },
  tags: [String],
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const Component = mongoose.models.Component || mongoose.model('Component', ComponentSchema);

/**
 * Handle component routes
 */
async function handle(path, method, body, headers, user) {
  try {
    switch (method) {
      case 'GET':
        if (path === '/') {
          return await getComponents(body);
        } else if (path.match(/^\/[^\/]+$/)) {
          const componentId = path.substring(1);
          return await getComponent(componentId);
        } else if (path === '/search') {
          return await searchComponents(body);
        } else if (path === '/categories') {
          return await getCategories();
        }
        break;

      case 'POST':
        if (path === '/' && user) {
          return await createComponent(body, user.id);
        }
        break;

      case 'PUT':
        if (path.match(/^\/[^\/]+$/)) {
          const componentId = path.substring(1);
          return await updateComponent(componentId, body, user?.id);
        }
        break;

      case 'DELETE':
        if (path.match(/^\/[^\/]+$/)) {
          const componentId = path.substring(1);
          return await deleteComponent(componentId, user?.id);
        }
        break;
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Component endpoint not found'
      })
    };

  } catch (error) {
    console.error('Component handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Component service error'
      })
    };
  }
}

/**
 * Get all components with filtering
 */
async function getComponents(query) {
  const {
    category,
    type,
    library,
    limit = 50,
    skip = 0,
    sort = 'name'
  } = query;

  const filter = { status: 'active' };

  if (category) filter.category = category;
  if (type) filter.type = type;
  if (library) filter.library = library;

  const sortOptions = {};
  if (sort === 'name') sortOptions.name = 1;
  else if (sort === 'usage') sortOptions['stats.usageCount'] = -1;
  else if (sort === 'newest') sortOptions.createdAt = -1;

  const components = await Component.find(filter)
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .select('name type category description library properties stats tags');

  const total = await Component.countDocuments(filter);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: components,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    })
  };
}

/**
 * Get single component
 */
async function getComponent(componentId) {
  const component = await Component.findOne({
    _id: componentId,
    status: 'active'
  });

  if (!component) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Component not found'
      })
    };
  }

  // Increment usage count
  component.stats.usageCount += 1;
  await component.save();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: component
    })
  };
}

/**
 * Search components
 */
async function searchComponents(query) {
  const { q, limit = 20 } = query;

  if (!q || q.length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Search query must be at least 2 characters'
      })
    };
  }

  const searchRegex = new RegExp(q, 'i');

  const components = await Component.find({
    status: 'active',
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { type: searchRegex },
      { category: searchRegex }
    ]
  })
  .limit(parseInt(limit))
  .sort({ 'stats.usageCount': -1 })
  .select('name type category description library properties stats tags');

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: components,
      query: q
    })
  };
}

/**
 * Get component categories
 */
async function getCategories() {
  const categories = await Component.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        types: { $addToSet: '$type' }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        types: 1,
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: categories
    })
  };
}

/**
 * Create new component (admin only)
 */
async function createComponent(body, userId) {
  // In a real implementation, you'd check if user is admin
  // For now, allow any authenticated user to create components

  const {
    name,
    type,
    category,
    description,
    library,
    properties,
    pins,
    tags
  } = body;

  if (!name || !type || !category || !description || !library) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Name, type, category, description, and library are required'
      })
    };
  }

  const component = new Component({
    name,
    type,
    category,
    description,
    library,
    properties: properties || {},
    pins: pins || [],
    tags: tags || [],
    submittedBy: userId
  });

  await component.save();

  return {
    statusCode: 201,
    body: JSON.stringify({
      success: true,
      data: component
    })
  };
}

/**
 * Update component
 */
async function updateComponent(componentId, body, userId) {
  const component = await Component.findById(componentId);

  if (!component) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Component not found'
      })
    };
  }

  // In a real implementation, check if user can edit this component
  // For now, allow any authenticated user

  const allowedFields = [
    'name', 'description', 'properties', 'pins', 'tags'
  ];

  Object.keys(body).forEach(key => {
    if (allowedFields.includes(key)) {
      component[key] = body[key];
    }
  });

  await component.save();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: component
    })
  };
}

/**
 * Delete component (admin only)
 */
async function deleteComponent(componentId, userId) {
  const component = await Component.findById(componentId);

  if (!component) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Component not found'
      })
    };
  }

  // In a real implementation, check if user is admin
  // For now, just mark as inactive
  component.status = 'deprecated';
  await component.save();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Component removed successfully'
    })
  };
}

module.exports = { handle };