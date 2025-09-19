/**
 * Invoice Model
 * MongoDB schema for billing invoices
 */

const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Invoice must belong to a user']
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

  customer_email: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },

  amount: {
    type: Number,
    required: [true, 'Invoice amount is required'],
    min: [0, 'Amount cannot be negative']
  },

  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud']
  },

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },

  invoice_number: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },

  paid_at: {
    type: Date,
    default: null
  },

  payment_method: {
    type: String,
    default: null
  },

  stripe_invoice_id: {
    type: String,
    default: null
  },

  line_items: [{
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    period_start: Date,
    period_end: Date
  }],

  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },

  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },

  total_amount: {
    type: Number,
    required: true,
    min: 0
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
InvoiceSchema.index({ user: 1, created_at: -1 });
InvoiceSchema.index({ customer_email: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ due_date: 1 });
InvoiceSchema.index({ invoice_number: 1 });

// Virtual for amount due
InvoiceSchema.virtual('amount_due').get(function() {
  return this.total_amount - (this.discount_amount || 0);
});

// Virtual for days overdue
InvoiceSchema.virtual('days_overdue').get(function() {
  if (this.status !== 'paid' && this.due_date < new Date()) {
    const diffTime = Math.abs(new Date() - this.due_date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware to calculate total amount
InvoiceSchema.pre('save', function(next) {
  if (this.line_items && this.line_items.length > 0) {
    const subtotal = this.line_items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    this.total_amount = subtotal + (this.tax_amount || 0) - (this.discount_amount || 0);
  } else {
    this.total_amount = this.amount;
  }
  next();
});

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function() {
  const currentYear = new Date().getFullYear();
  const count = await this.countDocuments({
    created_at: {
      $gte: new Date(currentYear, 0, 1),
      $lt: new Date(currentYear + 1, 0, 1)
    }
  });

  return `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
};

// Static method to get invoice statistics
InvoiceSchema.statics.getInvoiceStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        paidInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        pendingInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        overdueInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total_amount', 0] }
        },
        outstandingAmount: {
          $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$amount_due', 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: 0,
    outstandingAmount: 0
  };
};

module.exports = mongoose.model('Invoice', InvoiceSchema);