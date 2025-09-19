/**
 * Stripe Payment Service
 * Handles all Stripe payment operations, subscriptions, and webhooks
 */

const Stripe = require('stripe');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    this.currency = process.env.CURRENCY || 'usd';
    this.trialDays = parseInt(process.env.TRIAL_PERIOD_DAYS) || 14;

    // Price IDs for different plans
    this.prices = {
      free: process.env.STRIPE_PRICE_FREE,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    };
  }

  /**
   * Create or retrieve Stripe customer
   */
  async createOrRetrieveCustomer(userId, email, name) {
    try {
      const user = await User.findById(userId);

      if (user.stripeCustomerId) {
        // Retrieve existing customer
        const customer = await this.stripe.customers.retrieve(user.stripeCustomerId);
        return customer;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: userId.toString()
        }
      });

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: customer.id
      });

      logger.logBilling('customer_created', userId, null, {
        stripeCustomerId: customer.id
      });

      return customer;
    } catch (error) {
      logger.logError(error, null, { userId, operation: 'create_customer' });
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(userId, planName, paymentMethodId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get or create Stripe customer
      const customer = await this.createOrRetrieveCustomer(
        userId,
        user.email,
        user.name
      );

      // Attach payment method if provided
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id
        });

        await this.stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: this.prices[planName]
        }],
        trial_period_days: planName !== 'free' ? this.trialDays : 0,
        metadata: {
          userId: userId.toString(),
          planName: planName
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      // Save subscription to database
      const dbSubscription = await Subscription.create({
        user: userId,
        customer_id: customer.id,
        plan_name: planName,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        stripe_price_id: this.prices[planName],
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0].price.unit_amount / 100, // Convert cents to dollars
        currency: subscription.currency,
        interval: subscription.items.data[0].price.recurring.interval,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      });

      logger.logBilling('subscription_created', userId, dbSubscription.amount, {
        planName,
        stripeSubscriptionId: subscription.id,
        status: subscription.status
      });

      return {
        subscription: dbSubscription,
        clientSecret: subscription.latest_invoice.payment_intent?.client_secret
      };
    } catch (error) {
      logger.logError(error, null, {
        userId,
        planName,
        operation: 'create_subscription'
      });
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: userId
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: cancelAtPeriodEnd
        }
      );

      // Update database
      await Subscription.findByIdAndUpdate(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? 'active' : 'canceled'
      });

      logger.logBilling('subscription_cancelled', userId, null, {
        subscriptionId,
        cancelAtPeriodEnd,
        stripeSubscriptionId: subscription.stripe_subscription_id
      });

      return { success: true };
    } catch (error) {
      logger.logError(error, null, {
        userId,
        subscriptionId,
        operation: 'cancel_subscription'
      });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(userId, subscriptionId, newPlanName) {
    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: userId
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: this.prices[newPlanName]
        }],
        proration_behavior: 'create_prorations'
      });

      // Update database
      await Subscription.findByIdAndUpdate(subscriptionId, {
        plan_name: newPlanName,
        stripe_price_id: this.prices[newPlanName]
      });

      logger.logBilling('subscription_updated', userId, null, {
        subscriptionId,
        oldPlan: subscription.plan_name,
        newPlan: newPlanName
      });

      return { success: true };
    } catch (error) {
      logger.logError(error, null, {
        userId,
        subscriptionId,
        newPlanName,
        operation: 'update_subscription'
      });
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(userId, amount, currency = 'usd', metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const customer = await this.createOrRetrieveCustomer(
        userId,
        user.email,
        user.name
      );

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        customer: customer.id,
        metadata: {
          userId: userId.toString(),
          ...metadata
        }
      });

      logger.logBilling('payment_intent_created', userId, amount, {
        paymentIntentId: paymentIntent.id,
        currency
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.logError(error, null, {
        userId,
        amount,
        currency,
        operation: 'create_payment_intent'
      });
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create invoice
   */
  async createInvoice(userId, invoiceData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const customer = await this.createOrRetrieveCustomer(
        userId,
        user.email,
        user.name
      );

      // Create invoice item
      await this.stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(invoiceData.amount * 100),
        currency: invoiceData.currency || this.currency,
        description: invoiceData.description
      });

      // Create invoice
      const stripeInvoice = await this.stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save to database
      const invoice = await Invoice.create({
        user: userId,
        customer_id: customer.id,
        customer_name: user.name,
        customer_email: user.email,
        amount: invoiceData.amount,
        currency: invoiceData.currency || this.currency,
        description: invoiceData.description,
        stripe_invoice_id: stripeInvoice.id,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'draft'
      });

      logger.logBilling('invoice_created', userId, invoiceData.amount, {
        invoiceId: invoice._id,
        stripeInvoiceId: stripeInvoice.id
      });

      return invoice;
    } catch (error) {
      logger.logError(error, null, {
        userId,
        invoiceData,
        operation: 'create_invoice'
      });
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(event) {
    try {
      const { type, data } = event;

      logger.info('Stripe webhook received', {
        type,
        id: event.id
      });

      switch (type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePayment(data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailure(data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(data.object);
          break;

        default:
          logger.info('Unhandled webhook type', { type });
      }

      return { received: true };
    } catch (error) {
      logger.logError(error, null, {
        webhookType: event.type,
        webhookId: event.id,
        operation: 'handle_webhook'
      });
      throw error;
    }
  }

  /**
   * Handle subscription updates from webhooks
   */
  async handleSubscriptionUpdate(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
      });

      if (subscription) {
        await Subscription.findByIdAndUpdate(subscription._id, {
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
        });

        logger.logBilling('subscription_webhook_update', subscription.user, null, {
          subscriptionId: subscription._id,
          status: stripeSubscription.status
        });
      }
    } catch (error) {
      logger.logError(error, null, {
        stripeSubscriptionId: stripeSubscription.id,
        operation: 'handle_subscription_update'
      });
    }
  }

  /**
   * Handle subscription cancellation from webhooks
   */
  async handleSubscriptionCancellation(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
      });

      if (subscription) {
        await Subscription.findByIdAndUpdate(subscription._id, {
          status: 'canceled',
          canceled_at: new Date()
        });

        logger.logBilling('subscription_cancelled_webhook', subscription.user, null, {
          subscriptionId: subscription._id
        });
      }
    } catch (error) {
      logger.logError(error, null, {
        stripeSubscriptionId: stripeSubscription.id,
        operation: 'handle_subscription_cancellation'
      });
    }
  }

  /**
   * Handle successful invoice payments
   */
  async handleInvoicePayment(stripeInvoice) {
    try {
      const invoice = await Invoice.findOne({
        stripe_invoice_id: stripeInvoice.id
      });

      if (invoice) {
        await Invoice.findByIdAndUpdate(invoice._id, {
          status: 'paid',
          paid_at: new Date(),
          payment_method: stripeInvoice.payment_intent?.payment_method
        });

        logger.logBilling('invoice_paid', invoice.user, invoice.amount, {
          invoiceId: invoice._id,
          stripeInvoiceId: stripeInvoice.id
        });
      }
    } catch (error) {
      logger.logError(error, null, {
        stripeInvoiceId: stripeInvoice.id,
        operation: 'handle_invoice_payment'
      });
    }
  }

  /**
   * Handle failed invoice payments
   */
  async handleInvoicePaymentFailure(stripeInvoice) {
    try {
      const invoice = await Invoice.findOne({
        stripe_invoice_id: stripeInvoice.id
      });

      if (invoice) {
        await Invoice.findByIdAndUpdate(invoice._id, {
          status: 'overdue'
        });

        logger.logBilling('invoice_payment_failed', invoice.user, invoice.amount, {
          invoiceId: invoice._id,
          stripeInvoiceId: stripeInvoice.id
        });
      }
    } catch (error) {
      logger.logError(error, null, {
        stripeInvoiceId: stripeInvoice.id,
        operation: 'handle_invoice_payment_failure'
      });
    }
  }

  /**
   * Handle successful payment intents
   */
  async handlePaymentSuccess(paymentIntent) {
    try {
      logger.logBilling('payment_succeeded', paymentIntent.metadata.userId, paymentIntent.amount / 100, {
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      logger.logError(error, null, {
        paymentIntentId: paymentIntent.id,
        operation: 'handle_payment_success'
      });
    }
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.logError(error, null, {
        userId,
        operation: 'get_payment_methods'
      });
      return [];
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(userId, subscriptionId) {
    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: userId
      }).populate('user', 'name email');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get latest invoice from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id,
        { expand: ['latest_invoice'] }
      );

      return {
        ...subscription.toObject(),
        stripeDetails: stripeSubscription
      };
    } catch (error) {
      logger.logError(error, null, {
        userId,
        subscriptionId,
        operation: 'get_subscription_details'
      });
      throw new Error('Failed to get subscription details');
    }
  }
}

module.exports = new StripeService();