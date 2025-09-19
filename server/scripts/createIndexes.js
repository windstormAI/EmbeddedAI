/**
 * Database Indexes Creation Script
 * Creates performance indexes for MongoDB collections
 */

const mongoose = require('mongoose');
require('dotenv').config();

const logger = console; // Simple console logger for this script

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/embedded', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Connected to MongoDB');

    const db = mongoose.connection.db;

    // User collection indexes
    logger.info('Creating User collection indexes...');
    const userCollection = db.collection('users');

    await userCollection.createIndex({ email: 1 }, { unique: true });
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await userCollection.createIndex({ createdAt: -1 });
    await userCollection.createIndex({ 'stats.lastActivity': -1 });
    await userCollection.createIndex({ role: 1 });
    await userCollection.createIndex({ isActive: 1 });
    await userCollection.createIndex({ stripeCustomerId: 1 });

    logger.info('User indexes created');

    // Project collection indexes
    logger.info('Creating Project collection indexes...');
    const projectCollection = db.collection('projects');

    await projectCollection.createIndex({ user: 1, createdAt: -1 });
    await projectCollection.createIndex({ user: 1, status: 1 });
    await projectCollection.createIndex({ isPublic: 1, createdAt: -1 });
    await projectCollection.createIndex({ tags: 1 });
    await projectCollection.createIndex({ category: 1 });
    await projectCollection.createIndex({ difficulty: 1 });
    await projectCollection.createIndex({ 'stats.views': -1 });
    await projectCollection.createIndex({ 'stats.likes': -1 });
    await projectCollection.createIndex({ boardType: 1 });
    await projectCollection.createIndex({ codeLanguage: 1 });
    await projectCollection.createIndex({ updatedAt: -1 });
    await projectCollection.createIndex({ 'collaborators.user': 1 });

    // Compound indexes for complex queries
    await projectCollection.createIndex({
      user: 1,
      isPublic: 1,
      status: 1,
      createdAt: -1
    });

    await projectCollection.createIndex({
      isPublic: 1,
      'stats.views': -1,
      'stats.likes': -1,
      createdAt: -1
    });

    logger.info('Project indexes created');

    // Component collection indexes
    logger.info('Creating Component collection indexes...');
    const componentCollection = db.collection('components');

    await componentCollection.createIndex({ isBuiltIn: 1, status: 1 });
    await componentCollection.createIndex({ category: 1 });
    await componentCollection.createIndex({ type: 1 });
    await componentCollection.createIndex({ usageCount: -1 });
    await componentCollection.createIndex({ createdAt: -1 });

    logger.info('Component indexes created');

    // Invoice collection indexes (if exists)
    try {
      logger.info('Creating Invoice collection indexes...');
      const invoiceCollection = db.collection('invoices');

      await invoiceCollection.createIndex({ user: 1, createdAt: -1 });
      await invoiceCollection.createIndex({ status: 1, dueDate: 1 });
      await invoiceCollection.createIndex({ customerEmail: 1 });
      await invoiceCollection.createIndex({ stripeInvoiceId: 1 }, { unique: true, sparse: true });

      logger.info('Invoice indexes created');
    } catch (error) {
      logger.warn('Invoice collection may not exist yet:', error.message);
    }

    // Subscription collection indexes (if exists)
    try {
      logger.info('Creating Subscription collection indexes...');
      const subscriptionCollection = db.collection('subscriptions');

      await subscriptionCollection.createIndex({ user: 1, status: 1 });
      await subscriptionCollection.createIndex({ stripeSubscriptionId: 1 }, { unique: true, sparse: true });
      await subscriptionCollection.createIndex({ status: 1, currentPeriodEnd: 1 });
      await subscriptionCollection.createIndex({ planName: 1 });

      logger.info('Subscription indexes created');
    } catch (error) {
      logger.warn('Subscription collection may not exist yet:', error.message);
    }

    // Simulation collection indexes (if exists)
    try {
      logger.info('Creating Simulation collection indexes...');
      const simulationCollection = db.collection('simulations');

      await simulationCollection.createIndex({ project: 1, createdAt: -1 });
      await simulationCollection.createIndex({ status: 1 });
      await simulationCollection.createIndex({ user: 1 });

      logger.info('Simulation indexes created');
    } catch (error) {
      logger.warn('Simulation collection may not exist yet:', error.message);
    }

    // Get index statistics
    logger.info('Getting index statistics...');
    const collections = ['users', 'projects', 'components', 'invoices', 'subscriptions', 'simulations'];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        logger.info(`${collectionName} collection has ${indexes.length} indexes`);
      } catch (error) {
        logger.debug(`${collectionName} collection may not exist:`, error.message);
      }
    }

    logger.info('All database indexes created successfully!');

  } catch (error) {
    logger.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createIndexes()
    .then(() => {
      logger.info('Index creation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes };