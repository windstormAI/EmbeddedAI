/**
 * Multi-Tenant Middleware
 * Ensures proper tenant isolation and data access control
 */

const User = require('../models/User');
const Project = require('../models/Project');
const logger = require('../utils/logger');

/**
 * Tenant Isolation Middleware
 * Ensures users can only access data from their own tenant
 */
const tenantIsolation = (req, res, next) => {
  try {
    // Add tenant ID to request object
    if (req.user) {
      req.tenantId = req.user._id; // For now, each user is their own tenant
      // In a real multi-tenant setup, this would be req.user.tenantId
    }

    // Add tenant context to logger
    if (req.tenantId) {
      logger.info('Tenant context established', {
        tenantId: req.tenantId,
        userId: req.user?._id,
        endpoint: req.originalUrl,
        method: req.method
      });
    }

    next();
  } catch (error) {
    logger.logError(error, req, { operation: 'tenant_isolation' });
    res.status(500).json({
      success: false,
      error: 'Tenant isolation error'
    });
  }
};

/**
 * Resource Ownership Verification Middleware
 * Ensures users can only access resources they own or have permission to access
 */
const verifyResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.projectId || req.params.userId;
      const userId = req.user._id;

      if (!resourceId) {
        return next();
      }

      let resource;
      let ownerField = 'user'; // Default owner field

      switch (resourceType) {
        case 'project':
          resource = await Project.findById(resourceId);
          break;

        case 'user':
          // Users can only access their own data
          if (resourceId !== userId.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied: Cannot access other user data'
            });
          }
          return next();

        case 'invoice':
        case 'subscription':
          // These resources are handled by their respective controllers
          // with proper ownership checks
          return next();

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid resource type for ownership verification'
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Check ownership
      if (resource[ownerField].toString() !== userId.toString()) {
        // Check if user is a collaborator (for projects)
        if (resourceType === 'project') {
          const isCollaborator = resource.collaborators.some(
            collab => collab.user.toString() === userId.toString() &&
                     ['editor', 'admin'].includes(collab.role)
          );

          if (!isCollaborator) {
            logger.warn('Unauthorized resource access attempt', {
              userId,
              resourceId,
              resourceType,
              ownerId: resource[ownerField]
            });

            return res.status(403).json({
              success: false,
              error: 'Access denied: You do not have permission to access this resource'
            });
          }
        } else {
          logger.warn('Unauthorized resource access attempt', {
            userId,
            resourceId,
            resourceType,
            ownerId: resource[ownerField]
          });

          return res.status(403).json({
            success: false,
            error: 'Access denied: You do not own this resource'
          });
        }
      }

      // Add resource to request for use in subsequent middleware/controllers
      req.resource = resource;

      logger.info('Resource ownership verified', {
        userId,
        resourceId,
        resourceType,
        ownerId: resource[ownerField]
      });

      next();
    } catch (error) {
      logger.logError(error, req, {
        operation: 'verify_resource_ownership',
        resourceType
      });
      res.status(500).json({
        success: false,
        error: 'Resource ownership verification failed'
      });
    }
  };
};

/**
 * Tenant Data Filtering Middleware
 * Automatically filters database queries to only return tenant-specific data
 */
const tenantDataFilter = (req, res, next) => {
  try {
    // Add tenant filter to request for use in controllers
    req.tenantFilter = {
      user: req.user._id // In a real multi-tenant setup, this would be tenantId
    };

    // For public resources, add additional filters
    if (req.query.includePublic) {
      req.tenantFilter = {
        $or: [
          { user: req.user._id },
          { isPublic: true }
        ]
      };
    }

    next();
  } catch (error) {
    logger.logError(error, req, { operation: 'tenant_data_filter' });
    res.status(500).json({
      success: false,
      error: 'Tenant data filtering error'
    });
  }
};

/**
 * Rate Limiting by Tenant
 * Applies different rate limits based on tenant/subscription tier
 */
const tenantRateLimit = async (req, res, next) => {
  try {
    // In a real implementation, this would check the user's subscription tier
    // and apply different rate limits accordingly

    const user = req.user;
    let rateLimitTier = 'free'; // default

    // Check user's subscription status
    // This would be implemented based on your subscription model
    if (user.subscription && user.subscription.plan === 'pro') {
      rateLimitTier = 'pro';
    } else if (user.subscription && user.subscription.plan === 'enterprise') {
      rateLimitTier = 'enterprise';
    }

    // Set rate limit headers based on tier
    const limits = {
      free: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
      pro: { requests: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
      enterprise: { requests: 10000, windowMs: 15 * 60 * 1000 } // 10000 requests per 15 minutes
    };

    const limit = limits[rateLimitTier];

    // Add rate limit info to request for use in rate limiting middleware
    req.rateLimit = limit;

    // Set headers for client awareness
    res.set({
      'X-RateLimit-Tier': rateLimitTier,
      'X-RateLimit-Requests': limit.requests,
      'X-RateLimit-WindowMs': limit.windowMs
    });

    logger.info('Tenant rate limit applied', {
      userId: user._id,
      tier: rateLimitTier,
      limit: limit.requests,
      windowMs: limit.windowMs
    });

    next();
  } catch (error) {
    logger.logError(error, req, { operation: 'tenant_rate_limit' });
    next(); // Continue without rate limiting if there's an error
  }
};

/**
 * Tenant Context Middleware
 * Adds tenant-specific context to all requests
 */
const tenantContext = (req, res, next) => {
  try {
    if (req.user) {
      // Add tenant context for use throughout the request
      req.tenant = {
        id: req.user._id, // In real multi-tenant: req.user.tenantId
        userId: req.user._id,
        role: req.user.role,
        subscription: req.user.subscription || null,
        features: getTenantFeatures(req.user)
      };

      // Add tenant context to response for client-side usage
      res.locals.tenant = req.tenant;
    }

    next();
  } catch (error) {
    logger.logError(error, req, { operation: 'tenant_context' });
    next();
  }
};

/**
 * Get tenant features based on subscription
 */
const getTenantFeatures = (user) => {
  const baseFeatures = {
    basicProjects: true,
    circuitDesigner: true,
    codeEditor: true,
    simulation: true
  };

  // Add features based on subscription tier
  if (user.subscription) {
    switch (user.subscription.plan) {
      case 'pro':
        return {
          ...baseFeatures,
          aiCodeGeneration: true,
          advancedSimulation: true,
          teamCollaboration: true,
          prioritySupport: true,
          apiAccess: true
        };

      case 'enterprise':
        return {
          ...baseFeatures,
          aiCodeGeneration: true,
          advancedSimulation: true,
          teamCollaboration: true,
          unlimitedProjects: true,
          customIntegrations: true,
          dedicatedSupport: true,
          apiAccess: true,
          whiteLabel: true
        };

      default: // free
        return baseFeatures;
    }
  }

  return baseFeatures;
};

/**
 * Tenant Audit Logging Middleware
 * Logs all tenant-related operations for compliance and debugging
 */
const tenantAuditLog = (req, res, next) => {
  try {
    // Store original response methods for logging
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;

    let responseData = null;
    let statusCode = 200;

    // Override response methods to capture response data
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Log after response is sent
    res.on('finish', () => {
      if (req.tenant) {
        logger.info('Tenant operation completed', {
          tenantId: req.tenant.id,
          userId: req.user?._id,
          method: req.method,
          url: req.originalUrl,
          statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          responseSize: responseData ? JSON.stringify(responseData).length : 0
        });
      }
    });

    next();
  } catch (error) {
    logger.logError(error, req, { operation: 'tenant_audit_log' });
    next();
  }
};

module.exports = {
  tenantIsolation,
  verifyResourceOwnership,
  tenantDataFilter,
  tenantRateLimit,
  tenantContext,
  tenantAuditLog,
  getTenantFeatures
};