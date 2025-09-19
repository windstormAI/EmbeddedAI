/**
 * Component Model
 * MongoDB schema for electronic components library
 */

const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a component name'],
    trim: true,
    maxlength: [100, 'Component name cannot exceed 100 characters']
  },

  type: {
    type: String,
    required: [true, 'Please add a component type'],
    enum: [
      'microcontroller', 'sensor', 'actuator', 'display', 'communication',
      'power', 'passive', 'integrated-circuit', 'connector', 'other'
    ]
  },

  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['board', 'input', 'output', 'power', 'communication', 'storage', 'other'],
    default: 'other'
  },

  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },

  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  manufacturer: {
    type: String,
    trim: true,
    maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
  },

  partNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Part number cannot exceed 50 characters']
  },

  // Electrical specifications
  specifications: {
    voltage: {
      min: Number,
      max: Number,
      nominal: Number,
      unit: { type: String, default: 'V' }
    },
    current: {
      min: Number,
      max: Number,
      nominal: Number,
      unit: { type: String, default: 'mA' }
    },
    power: {
      min: Number,
      max: Number,
      nominal: Number,
      unit: { type: String, default: 'mW' }
    },
    frequency: {
      min: Number,
      max: Number,
      nominal: Number,
      unit: { type: String, default: 'MHz' }
    },
    temperature: {
      min: Number,
      max: Number,
      nominal: Number,
      unit: { type: String, default: '°C' }
    }
  },

  // Pin configuration
  pins: [{
    name: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['digital', 'analog', 'power', 'ground', 'communication', 'special'],
      default: 'digital'
    },
    description: String,
    capabilities: [{
      type: String,
      enum: ['input', 'output', 'pwm', 'adc', 'uart', 'spi', 'i2c', 'interrupt']
    }],
    voltage: Number,
    current: Number
  }],

  // Physical properties
  dimensions: {
    length: Number, // mm
    width: Number,  // mm
    height: Number, // mm
    weight: Number, // grams
    package: {
      type: String,
      enum: ['DIP', 'SOIC', 'QFN', 'BGA', 'SMD', 'Through-hole', 'Module']
    }
  },

  // Usage properties
  properties: {
    digitalPins: Number,
    analogPins: Number,
    pwmPins: Number,
    flashMemory: String, // e.g., "32KB"
    sram: String,       // e.g., "2KB"
    eeprom: String,     // e.g., "1KB"
    clockSpeed: String, // e.g., "16MHz"
    operatingVoltage: String, // e.g., "5V"
    inputVoltage: String,     // e.g., "7-12V"
    ioVoltage: String,        // e.g., "5V"
    communication: [String],  // e.g., ["UART", "SPI", "I2C"]
    wireless: [String],       // e.g., ["WiFi", "Bluetooth"]
    interfaces: [String]      // e.g., ["USB", "Ethernet"]
  },

  // Library and compatibility
  library: {
    type: String,
    required: true,
    enum: ['arduino', 'esp32', 'raspberry-pi', 'custom', 'basic'],
    default: 'basic'
  },

  compatibility: [{
    platform: {
      type: String,
      enum: ['arduino', 'esp32', 'esp8266', 'raspberry-pi', 'particle', 'other']
    },
    version: String,
    notes: String
  }],

  // Documentation and resources
  documentation: {
    datasheet: String,     // URL to datasheet
    schematic: String,     // URL to schematic
    tutorial: String,      // URL to tutorial
    codeExamples: [String], // URLs to code examples
    notes: String          // Additional notes
  },

  // Pricing and availability
  pricing: {
    currency: { type: String, default: 'USD' },
    price: Number,
    source: String, // e.g., "Adafruit", "SparkFun"
    lastUpdated: Date
  },

  // Usage statistics
  stats: {
    usageCount: { type: Number, default: 0 },
    projectCount: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },

  // Tags and search
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  // Images and media
  images: [{
    url: String,
    alt: String,
    caption: String,
    primary: { type: Boolean, default: false }
  }],

  // Status and moderation
  status: {
    type: String,
    enum: ['active', 'deprecated', 'pending', 'rejected'],
    default: 'active'
  },

  isOfficial: {
    type: Boolean,
    default: false
  },

  isTemplate: {
    type: Boolean,
    default: false
  },

  // Moderation
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewNotes: String,

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
ComponentSchema.index({ name: 1 });
ComponentSchema.index({ type: 1 });
ComponentSchema.index({ category: 1 });
ComponentSchema.index({ library: 1 });
ComponentSchema.index({ 'compatibility.platform': 1 });
ComponentSchema.index({ tags: 1 });
ComponentSchema.index({ status: 1 });
ComponentSchema.index({ 'stats.usageCount': -1 });
ComponentSchema.index({ createdAt: -1 });

// Virtual for primary image
ComponentSchema.virtual('primaryImage').get(function() {
  return this.images.find(img => img.primary) || this.images[0];
});

// Virtual for average rating (if we add user ratings later)
ComponentSchema.virtual('averageRating').get(function() {
  return this.stats.rating;
});

// Virtual for compatibility summary
ComponentSchema.virtual('compatibilitySummary').get(function() {
  return this.compatibility.map(comp => comp.platform);
});

// Instance method to increment usage
ComponentSchema.methods.incrementUsage = function() {
  this.stats.usageCount += 1;
  return this.save();
};

// Instance method to add to project
ComponentSchema.methods.addToProject = function(projectId) {
  this.stats.projectCount += 1;
  return this.save();
};

// Instance method to get pin by number
ComponentSchema.methods.getPinByNumber = function(pinNumber) {
  return this.pins.find(pin => pin.number === pinNumber);
};

// Instance method to get pins by type
ComponentSchema.methods.getPinsByType = function(pinType) {
  return this.pins.filter(pin => pin.type === pinType);
};

// Instance method to get compatible platforms
ComponentSchema.methods.getCompatiblePlatforms = function() {
  return this.compatibility.map(comp => comp.platform);
};

// Static method to find components by platform
ComponentSchema.statics.findByPlatform = function(platform) {
  return this.find({
    'compatibility.platform': platform,
    status: 'active'
  });
};

// Static method to find components by type
ComponentSchema.statics.findByType = function(type) {
  return this.find({
    type: type,
    status: 'active'
  }).sort({ 'stats.usageCount': -1 });
};

// Static method to find components by category
ComponentSchema.statics.findByCategory = function(category) {
  return this.find({
    category: category,
    status: 'active'
  }).sort({ 'stats.usageCount': -1 });
};

// Static method to search components
ComponentSchema.statics.search = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');

  return this.find({
    status: 'active',
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { type: searchRegex },
      { category: searchRegex }
    ]
  })
  .limit(limit)
  .sort({ 'stats.usageCount': -1 });
};

// Static method to get component statistics
ComponentSchema.statics.getComponentStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { status: 'active' }
    },
    {
      $group: {
        _id: null,
        totalComponents: { $sum: 1 },
        totalUsage: { $sum: '$stats.usageCount' },
        averageRating: { $avg: '$stats.rating' },
        componentsByType: {
          $push: '$type'
        },
        componentsByCategory: {
          $push: '$category'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalComponents: 0,
      totalUsage: 0,
      averageRating: 0,
      componentsByType: {},
      componentsByCategory: {}
    };
  }

  const result = stats[0];

  // Count by type and category
  result.componentsByType = result.componentsByType.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  result.componentsByCategory = result.componentsByCategory.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return result;
};

// Pre-save middleware to update updatedAt
ComponentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validation middleware
ComponentSchema.pre('save', function(next) {
  // Ensure at least one pin if it's a microcontroller or integrated circuit
  if (['microcontroller', 'integrated-circuit'].includes(this.type) && (!this.pins || this.pins.length === 0)) {
    return next(new Error('Microcontrollers and integrated circuits must have pin definitions'));
  }

  // Ensure specifications are provided for active components
  if (this.status === 'active' && !this.specifications) {
    return next(new Error('Active components must have specifications'));
  }

  next();
});

module.exports = mongoose.model('Component', ComponentSchema);