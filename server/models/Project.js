/**
 * Project Model
 * MongoDB schema for embedded projects
 */

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project must belong to a user']
  },

  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },

  boardType: {
    type: String,
    enum: ['arduino-uno', 'arduino-nano', 'arduino-mega', 'esp32', 'esp8266', 'raspberry-pi'],
    default: 'arduino-uno'
  },

  codeLanguage: {
    type: String,
    enum: ['cpp', 'python', 'javascript'],
    default: 'cpp'
  },

  code: {
    type: String,
    default: ''
  },

  circuitData: {
    components: [{
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      x: {
        type: Number,
        required: true,
        min: 0
      },
      y: {
        type: Number,
        required: true,
        min: 0
      },
      rotation: {
        type: Number,
        default: 0,
        min: 0,
        max: 360
      },
      properties: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      connections: [{
        pin: String,
        connectedTo: {
          componentId: String,
          pin: String
        }
      }]
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
      },
      type: {
        type: String,
        enum: ['wire', 'bus'],
        default: 'wire'
      },
      color: {
        type: String,
        default: '#000000'
      }
    }],
    metadata: {
      gridSize: { type: Number, default: 20 },
      snapToGrid: { type: Boolean, default: true },
      showGrid: { type: Boolean, default: true },
      backgroundColor: { type: String, default: '#ffffff' }
    }
  },

  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft'
  },

  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  isPublic: {
    type: Boolean,
    default: false
  },

  isTemplate: {
    type: Boolean,
    default: false
  },

  category: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'iot', 'robotics', 'automation'],
    default: 'basic'
  },

  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },

  estimatedTime: {
    type: Number, // in minutes
    min: 0,
    max: 480 // 8 hours max
  },

  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [100, 'Prerequisite cannot exceed 100 characters']
  }],

  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: [200, 'Learning objective cannot exceed 200 characters']
  }],

  // Version control
  version: {
    type: Number,
    default: 1,
    min: 1
  },

  parentProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  forkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Collaboration
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // GitHub integration
  githubRepo: {
    owner: String,
    name: String,
    url: String,
    lastSync: Date
  },

  // Statistics
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    lastViewed: Date
  },

  // AI-generated content
  aiGenerated: {
    isAIGenerated: { type: Boolean, default: false },
    prompt: String,
    model: String,
    generatedAt: Date
  },

  // Comments and feedback
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProjectSchema.index({ user: 1, createdAt: -1 });
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ isPublic: 1, createdAt: -1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ difficulty: 1 });
ProjectSchema.index({ 'stats.views': -1 });
ProjectSchema.index({ 'stats.likes': -1 });

// Virtual for project URL slug
ProjectSchema.virtual('slug').get(function() {
  return this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
});

// Virtual for completion percentage
ProjectSchema.virtual('completionPercentage').get(function() {
  let percentage = 0;

  if (this.name) percentage += 20;
  if (this.description) percentage += 15;
  if (this.code && this.code.length > 10) percentage += 25;
  if (this.circuitData && this.circuitData.components.length > 0) percentage += 25;
  if (this.status === 'completed') percentage += 15;

  return Math.min(percentage, 100);
});

// Virtual for estimated completion time
ProjectSchema.virtual('estimatedCompletionTime').get(function() {
  const baseTime = 30; // 30 minutes base
  const codeMultiplier = this.code ? this.code.length / 1000 : 0;
  const componentsMultiplier = this.circuitData?.components?.length || 0;

  return Math.round(baseTime + (codeMultiplier * 10) + (componentsMultiplier * 5));
});

// Instance method to fork project
ProjectSchema.methods.fork = function(newUserId) {
  const forkedProject = new Project({
    user: newUserId,
    name: `${this.name} (Fork)`,
    description: this.description,
    boardType: this.boardType,
    codeLanguage: this.codeLanguage,
    code: this.code,
    circuitData: this.circuitData,
    category: this.category,
    difficulty: this.difficulty,
    tags: [...this.tags],
    forkedFrom: this._id,
    aiGenerated: this.aiGenerated
  });

  return forkedProject;
};

// Instance method to add collaborator
ProjectSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  // Check if user is already a collaborator
  const existingIndex = this.collaborators.findIndex(
    collab => collab.user.toString() === userId.toString()
  );

  if (existingIndex >= 0) {
    this.collaborators[existingIndex].role = role;
  } else {
    this.collaborators.push({
      user: userId,
      role: role,
      addedAt: new Date()
    });
  }

  return this.save();
};

// Instance method to remove collaborator
ProjectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );

  return this.save();
};

// Instance method to check if user can edit
ProjectSchema.methods.canUserEdit = function(userId) {
  // Owner can always edit
  if (this.user.toString() === userId.toString()) {
    return true;
  }

  // Check collaborators
  const collaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );

  return collaborator && ['editor', 'admin'].includes(collaborator.role);
};

// Static method to get public projects
ProjectSchema.statics.getPublicProjects = function(limit = 20, skip = 0) {
  return this.find({ isPublic: true })
    .populate('user', 'username name avatar')
    .sort({ 'stats.views': -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get project statistics
ProjectSchema.statics.getProjectStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        publicProjects: {
          $sum: { $cond: ['$isPublic', 1, 0] }
        },
        completedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalViews: { $sum: '$stats.views' },
        totalLikes: { $sum: '$stats.likes' },
        totalForks: { $sum: '$stats.forks' }
      }
    }
  ]);

  return stats[0] || {
    totalProjects: 0,
    publicProjects: 0,
    completedProjects: 0,
    totalViews: 0,
    totalLikes: 0,
    totalForks: 0
  };
};

// Pre-save middleware to update updatedAt
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to increment version
ProjectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);