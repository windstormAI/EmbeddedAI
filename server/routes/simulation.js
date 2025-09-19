/**
 * Simulation Routes
 * Circuit simulation and analysis endpoints
 */

const express = require('express');
const simulationService = require('../services/simulationService');
const { protect } = require('../middleware/auth');

// Import validation middleware
const {
  validateCircuitUpdate,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// All simulation routes require authentication
router.use(protect);

/**
 * @desc    Start circuit simulation
 * @route   POST /api/simulation/start
 * @access  Private
 */
router.post('/start', [
  validateCircuitUpdate
], async (req, res) => {
  try {
    const { circuitData } = req.body;
    const circuitId = `sim_${req.user._id}_${Date.now()}`;

    console.log('Starting simulation', {
      userId: req.user._id,
      circuitId,
      componentsCount: circuitData.components?.length || 0
    });

    const simulation = simulationService.startSimulation(circuitId, circuitData);

    res.json({
      success: true,
      data: {
        simulationId: circuitId,
        simulation,
        message: 'Simulation started successfully'
      }
    });

  } catch (error) {
    console.error('Start simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulation',
      message: error.message
    });
  }
});

/**
 * @desc    Stop circuit simulation
 * @route   POST /api/simulation/:simulationId/stop
 * @access  Private
 */
router.post('/:simulationId/stop', async (req, res) => {
  try {
    const { simulationId } = req.params;

    console.log('Stopping simulation', {
      userId: req.user._id,
      simulationId
    });

    const simulation = simulationService.stopSimulation(simulationId);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: {
        simulation,
        message: 'Simulation stopped successfully'
      }
    });

  } catch (error) {
    console.error('Stop simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop simulation',
      message: error.message
    });
  }
});

/**
 * @desc    Step through simulation
 * @route   POST /api/simulation/:simulationId/step
 * @access  Private
 */
router.post('/:simulationId/step', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { timeStep = 100 } = req.body;

    const simulation = simulationService.stepSimulation(simulationId, timeStep);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or not running'
      });
    }

    res.json({
      success: true,
      data: {
        simulation,
        stepTime: timeStep
      }
    });

  } catch (error) {
    console.error('Step simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to step simulation',
      message: error.message
    });
  }
});

/**
 * @desc    Get simulation status
 * @route   GET /api/simulation/:simulationId
 * @access  Private
 */
router.get('/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;

    const simulation = simulationService.simulationStates.get(simulationId);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: {
        simulation
      }
    });

  } catch (error) {
    console.error('Get simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation',
      message: error.message
    });
  }
});

/**
 * @desc    Get circuit analysis
 * @route   GET /api/simulation/:simulationId/analysis
 * @access  Private
 */
router.get('/:simulationId/analysis', async (req, res) => {
  try {
    const { simulationId } = req.params;

    const analysis = simulationService.getCircuitAnalysis(simulationId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('Get analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis',
      message: error.message
    });
  }
});

/**
 * @desc    Update sensor values during simulation
 * @route   PUT /api/simulation/:simulationId/sensors
 * @access  Private
 */
router.put('/:simulationId/sensors', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { sensorUpdates } = req.body;

    const simulation = simulationService.simulationStates.get(simulationId);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Update sensor values
    Object.entries(sensorUpdates).forEach(([componentId, value]) => {
      if (simulation.sensorValues[componentId]) {
        simulation.sensorValues[componentId].value = value;
        simulation.sensorValues[componentId].timestamp = Date.now();
      }
    });

    res.json({
      success: true,
      data: {
        sensorValues: simulation.sensorValues,
        message: 'Sensor values updated'
      }
    });

  } catch (error) {
    console.error('Update sensors failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sensors',
      message: error.message
    });
  }
});

/**
 * @desc    Get all active simulations for user
 * @route   GET /api/simulation/active
 * @access  Private
 */
router.get('/active', async (req, res) => {
  try {
    const activeSimulations = simulationService.getActiveSimulations()
      .filter(sim => sim.circuitData.user === req.user._id.toString());

    res.json({
      success: true,
      data: {
        simulations: activeSimulations,
        count: activeSimulations.length
      }
    });

  } catch (error) {
    console.error('Get active simulations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active simulations',
      message: error.message
    });
  }
});

/**
 * @desc    Clean up simulation
 * @route   DELETE /api/simulation/:simulationId
 * @access  Private
 */
router.delete('/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;

    simulationService.cleanup(simulationId);

    res.json({
      success: true,
      message: 'Simulation cleaned up successfully'
    });

  } catch (error) {
    console.error('Cleanup simulation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup simulation',
      message: error.message
    });
  }
});

/**
 * @desc    Get simulation statistics
 * @route   GET /api/simulation/stats
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const activeSimulations = simulationService.getActiveSimulations();
    const userSimulations = activeSimulations.filter(sim =>
      sim.circuitData.user === req.user._id.toString()
    );

    const stats = {
      totalActiveSimulations: activeSimulations.length,
      userActiveSimulations: userSimulations.length,
      totalComponents: userSimulations.reduce((sum, sim) =>
        sum + (sim.circuitData.components?.length || 0), 0
      ),
      totalConnections: userSimulations.reduce((sum, sim) =>
        sum + (sim.circuitData.connections?.length || 0), 0
      ),
      averagePowerConsumption: userSimulations.length > 0 ?
        userSimulations.reduce((sum, sim) => sum + sim.powerConsumption, 0) / userSimulations.length : 0
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get simulation stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation stats',
      message: error.message
    });
  }
});

module.exports = router;