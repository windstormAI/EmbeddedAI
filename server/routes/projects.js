const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getUserProjects,
  updateCircuit,
  updateCode
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');
const { tenantDataFilter, verifyResourceOwnership } = require('../middleware/tenant');

// Import validation middleware
const {
  validateProjectCreation,
  validateProjectUpdate,
  validateCircuitUpdate,
  validateCodeUpdate,
  validateObjectId,
  validateUserId,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// All project routes require authentication
router.use(protect);

// Apply tenant data filtering to all project routes
router.use(tenantDataFilter);

// Routes with validation
router.route('/')
  .get(validatePagination, getProjects)
  .post(validateProjectCreation, createProject);

router.route('/:id')
  .get(validateObjectId, verifyResourceOwnership('project'), getProject)
  .put(validateObjectId, validateProjectUpdate, verifyResourceOwnership('project'), updateProject)
  .delete(validateObjectId, verifyResourceOwnership('project'), deleteProject);

// Additional routes with validation
router.get('/user/:userId', validateUserId, validatePagination, getUserProjects);
router.put('/:id/circuit', validateObjectId, validateCircuitUpdate, updateCircuit);
router.put('/:id/code', validateObjectId, validateCodeUpdate, updateCode);

module.exports = router;