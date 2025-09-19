/**
 * Projects Handler - Netlify Function
 * Handles project CRUD operations
 */

const mongoose = require('mongoose');

// Project model
const ProjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  boardType: { type: String, default: 'arduino-uno' },
  codeLanguage: { type: String, default: 'cpp' },
  code: { type: String, default: '' },
  circuitData: {
    components: [{
      id: String,
      type: String,
      name: String,
      x: Number,
      y: Number,
      rotation: { type: Number, default: 0 },
      properties: mongoose.Schema.Types.Mixed
    }],
    connections: [{
      id: String,
      from: {
        componentId: String,
        pin: String
      },
      to: {
        componentId: String,
        pin: String
      }
    }]
  },
  status: { type: String, default: 'draft', enum: ['draft', 'in-progress', 'completed', 'archived'] },
  tags: [String],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

/**
 * Handle project routes
 */
async function handle(path, method, body, headers, user) {
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Authentication required'
      })
    };
  }

  try {
    switch (method) {
      case 'GET':
        if (path === '/') {
          return await getProjects(user.id);
        } else if (path.match(/^\/[^\/]+$/)) {
          const projectId = path.substring(1);
          return await getProject(projectId, user.id);
        }
        break;

      case 'POST':
        if (path === '/') {
          return await createProject(body, user.id);
        }
        break;

      case 'PUT':
        if (path.match(/^\/[^\/]+$/)) {
          const projectId = path.substring(1);
          return await updateProject(projectId, body, user.id);
        }
        break;

      case 'DELETE':
        if (path.match(/^\/[^\/]+$/)) {
          const projectId = path.substring(1);
          return await deleteProject(projectId, user.id);
        }
        break;
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Project endpoint not found'
      })
    };

  } catch (error) {
    console.error('Project handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Project service error'
      })
    };
  }
}

/**
 * Get all projects for user
 */
async function getProjects(userId) {
  const projects = await Project.find({ user: userId })
    .sort({ updatedAt: -1 })
    .select('name description boardType status tags createdAt updatedAt');

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: projects
    })
  };
}

/**
 * Get single project
 */
async function getProject(projectId, userId) {
  const project = await Project.findOne({
    _id: projectId,
    user: userId
  });

  if (!project) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Project not found'
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: project
    })
  };
}

/**
 * Create new project
 */
async function createProject(body, userId) {
  const { name, description, boardType = 'arduino-uno' } = body;

  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Project name is required'
      })
    };
  }

  const project = new Project({
    user: userId,
    name,
    description,
    boardType,
    circuitData: {
      components: [],
      connections: []
    }
  });

  await project.save();

  return {
    statusCode: 201,
    body: JSON.stringify({
      success: true,
      data: project
    })
  };
}

/**
 * Update project
 */
async function updateProject(projectId, body, userId) {
  const project = await Project.findOne({
    _id: projectId,
    user: userId
  });

  if (!project) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Project not found'
      })
    };
  }

  // Update allowed fields
  const allowedFields = [
    'name', 'description', 'boardType', 'code', 'circuitData',
    'status', 'tags', 'isPublic'
  ];

  Object.keys(body).forEach(key => {
    if (allowedFields.includes(key)) {
      project[key] = body[key];
    }
  });

  project.updatedAt = new Date();
  await project.save();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: project
    })
  };
}

/**
 * Delete project
 */
async function deleteProject(projectId, userId) {
  const project = await Project.findOneAndDelete({
    _id: projectId,
    user: userId
  });

  if (!project) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Project not found'
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Project deleted successfully'
    })
  };
}

module.exports = { handle };