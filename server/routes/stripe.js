/**
 * Stripe Payment Routes
 * API endpoints for Stripe payment operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const stripeService = require('../services/stripeService');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Create subscription
 * @route   POST /api/stripe/create-subscription
 * @access  Private
 */
router.post('/create-subscription', [
  body('planName').isIn(['free', 'pro', 'enterprise']).withMessage('Invalid plan name'),
  body('paymentMethodId').optional().isString()
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

    const { planName, paymentMethodId } = req.body;
    const userId = req.user._id;

    const result = await stripeService.createSubscription(userId, planName, paymentMethodId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'create_subscription' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/stripe/cancel-subscription
 * @access  Private
 */
router.post('/cancel-subscription', [
  body('subscriptionId').isMongoId().withMessage('Invalid subscription ID'),
  body('cancelAtPeriodEnd').optional().isBoolean()
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

    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;
    const userId = req.user._id;

    await stripeService.cancelSubscription(userId, subscriptionId, cancelAtPeriodEnd);

    res.json({
      success: true,
      message: cancelAtPeriodEnd ? 'Subscription will be cancelled at period end' : 'Subscription cancelled immediately'
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'cancel_subscription' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
});

/**
 * @desc    Update subscription
 * @route   POST /api/stripe/update-subscription
 * @access  Private
 */
router.post('/update-subscription', [
  body('subscriptionId').isMongoId().withMessage('Invalid subscription ID'),
  body('newPlanName').isIn(['free', 'pro', 'enterprise']).withMessage('Invalid plan name')
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

    const { subscriptionId, newPlanName } = req.body;
    const userId = req.user._id;

    await stripeService.updateSubscription(userId, subscriptionId, newPlanName);

    res.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'update_subscription' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update subscription'
    });
  }
});

/**
 * @desc    Create payment intent
 * @route   POST /api/stripe/create-payment-intent
 * @access  Private
 */
router.post('/create-payment-intent', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency')
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

    const { amount, currency = 'usd', metadata = {} } = req.body;
    const userId = req.user._id;

    const result = await stripeService.createPaymentIntent(userId, amount, currency, metadata);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'create_payment_intent' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

/**
 * @desc    Create invoice
 * @route   POST /api/stripe/create-invoice
 * @access  Private
 */
router.post('/create-invoice', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required'),
  body('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency')
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

    const userId = req.user._id;
    const invoiceData = req.body;

    const invoice = await stripeService.createInvoice(userId, invoiceData);

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'create_invoice' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create invoice'
    });
  }
});

/**
 * @desc    Get customer payment methods
 * @route   GET /api/stripe/payment-methods
 * @access  Private
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const userId = req.user._id;
    const paymentMethods = await stripeService.getCustomerPaymentMethods(userId);

    res.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'get_payment_methods' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment methods'
    });
  }
});

/**
 * @desc    Get subscription details
 * @route   GET /api/stripe/subscription/:id
 * @access  Private
 */
router.get('/subscription/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptionId = req.params.id;

    const subscription = await stripeService.getSubscriptionDetails(userId, subscriptionId);

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.logError(error, req, { operation: 'get_subscription_details' });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription details'
    });
  }
});

/**
 * @desc    Stripe webhook handler
 * @route   POST /api/stripe/webhook
 * @access  Public (but verified with Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeService.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      error: err.message,
      signature: sig
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    logger.logError(error, req, { operation: 'webhook_handler' });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * @desc    Get Stripe publishable key
 * @route   GET /api/stripe/config
 * @access  Private
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: process.env.CURRENCY || 'usd'
    }
  });
});

module.exports = router;