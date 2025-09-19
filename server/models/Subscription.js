/**
 * Subscription Model
 * MongoDB schema for user subscriptions
 */

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Subscription must belong to a user']
  },

  customer_id: {
    type: String,
    required: [true, 'Customer ID is required']
  },

  customer_name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },

  plan_name: {
    type: String,
    required: [true, 'Plan name is required'],
    enum: ['free', 'pro', 'enterprise']
  },

  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete'],
    default: 'active'
  },

  stripe_subscription_id: {
    type: String,
    default: null
  },

  stripe_customer_id: {
    type: String,
    default: null
  },

  stripe_price_id: {
    type: String,
    default: null
  },

  amount: {
    type: Number,
    required: [true, 'Subscription amount is required'],
    min: [0, 'Amount cannot be negative']
  },

  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud']
  },

  interval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },

  interval_count: {
    type: Number,
    default: 1,
    min: 1
  },

  current_period_start: {
    type: Date,
    required: [true, 'Current period start is required']
  },

  current_period_end: {
    type: Date,
    required: [true, 'Current period end is required']
  },

  cancel_at_period_end: {
    type: Boolean,
    default: false
  },

  canceled_at: {
    type: Date,
    default: null
  },

  payment_method: {
    type: String,
    default: null
  },

  trial_start: {
    type: Date,
    default: null
  },

  trial_end: {
    type: Date,
    default: null
  },

  features: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

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
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ customer_id: 1 });
SubscriptionSchema.index({ stripe_subscription_id: 1 });
SubscriptionSchema.index({ current_period_end: 1 });
SubscriptionSchema.index({ status: 1, current_period_end: 1 });

// Virtual for subscription health
SubscriptionSchema.virtual('isHealthy').get(function() {
  return this.status === 'active' && !this.cancel_at_period_end;
});

// Virtual for days until renewal
SubscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (this.current_period_end) {
    const diffTime = this.current_period_end - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for trial status
SubscriptionSchema.virtual('isOnTrial').get(function() {
  if (!this.trial_end) return false;
  return new Date() < this.trial_end;
});

// Virtual for trial days remaining
SubscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.isOnTrial) return 0;
  const diffTime = this.trial_end - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update timestamps
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get subscription statistics
SubscriptionSchema.statics.getSubscriptionStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        canceledSubscriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
        },
        pastDueSubscriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'past_due'] }, 1, 0] }
        },
        monthlyRecurringRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'active'] },
              { $cond: [{ $eq: ['$interval', 'month'] }, '$amount', { $divide: ['$amount', 12] }] },
              0
            ]
          }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    canceledSubscriptions: 0,
    pastDueSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    totalRevenue: 0
  };
};

// Static method to get subscriptions by plan
SubscriptionSchema.statics.getSubscriptionsByPlan = async function(userId) {
  const planStats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$plan_name',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        revenue: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] }
        }
      }
    }
  ]);

  return planStats;
};

// Instance method to cancel subscription
SubscriptionSchema.methods.cancel = function(options = {}) {
  this.status = 'canceled';
  this.canceled_at = new Date();
  this.cancel_at_period_end = options.atPeriodEnd || false;

  return this.save();
};

// Instance method to reactivate subscription
SubscriptionSchema.methods.reactivate = function() {
  this.status = 'active';
  this.canceled_at = null;
  this.cancel_at_period_end = false;

  return this.save();
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);