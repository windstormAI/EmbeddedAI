/**
 * Billing Routes
 * API endpoints for invoice and subscription management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All billing routes require authentication
router.use(protect);

// Get all invoices for the authenticated user
router.get('/invoices', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    let query = { user: req.user._id };

    // Add filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { customer_email: { $regex: search, $options: 'i' } },
        { invoice_number: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

// Get single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
});

// Create new invoice
router.post('/invoices', [
  body('customer_name').trim().isLength({ min: 1, max: 100 }),
  body('customer_email').isEmail(),
  body('amount').isFloat({ min: 0 }),
  body('due_date').isISO8601(),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const invoiceNumber = await Invoice.generateInvoiceNumber();

    const invoice = await Invoice.create({
      ...req.body,
      user: req.user._id,
      invoice_number: invoiceNumber,
      total_amount: req.body.amount
    });

    res.status(201).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
});

// Update invoice
router.put('/invoices/:id', [
  body('customer_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('customer_email').optional().isEmail(),
  body('amount').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  body('due_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
});

// Mark invoice as paid
router.put('/invoices/:id/mark-paid', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status: 'paid',
        paid_at: new Date()
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid'
    });
  }
});

// Download invoice PDF (placeholder)
router.get('/invoices/:id/download', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // In a real implementation, this would generate a PDF
    // For now, return JSON data that can be used to generate PDF on frontend
    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice'
    });
  }
});

// Send invoice via email (placeholder)
router.post('/invoices/:id/send', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // In a real implementation, this would send an email
    // For now, just mark as sent
    await Invoice.findByIdAndUpdate(invoice._id, { status: 'sent' });

    res.json({
      success: true,
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invoice'
    });
  }
});

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions'
    });
  }
});

// Get billing statistics
router.get('/stats', async (req, res) => {
  try {
    const [invoiceStats, subscriptionStats] = await Promise.all([
      Invoice.getInvoiceStats(req.user._id),
      Subscription.getSubscriptionStats(req.user._id)
    ]);

    res.json({
      success: true,
      data: {
        invoices: invoiceStats,
        subscriptions: subscriptionStats,
        combined: {
          totalRevenue: invoiceStats.totalRevenue + subscriptionStats.totalRevenue,
          monthlyRecurringRevenue: subscriptionStats.monthlyRecurringRevenue,
          outstandingAmount: invoiceStats.outstandingAmount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing statistics'
    });
  }
});

module.exports = router;