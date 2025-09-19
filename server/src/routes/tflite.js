/**
 * TensorFlow Lite Edge AI Routes
 * API endpoints for AI model deployment on microcontrollers
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const TFLiteService = require('../services/tfliteService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Create TensorFlow Lite model
 * @route   POST /api/tflite/create
 * @access  Private
 */
router.post('/create', [
  body('type')
    .isIn(['image_classification', 'audio_classification', 'gesture_recognition', 'anomaly_detection', 'object_detection'])
    .withMessage('Invalid model type'),
  body('targetBoard')
    .isIn(['esp32', 'arduino-nano-33-ble', 'raspberry-pi-pico', 'arduino-uno'])
    .withMessage('Invalid target board'),
  body('optimization')
    .optional()
    .isIn(['speed', 'size', 'balanced'])
    .withMessage('Invalid optimization type'),
  body('modelData')
    .optional()
    .isObject()
    .withMessage('Model data must be an object')
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

    const { type, targetBoard, optimization = 'balanced', modelData = {} } = req.body;

    // Create TFLite model
    const model = await TFLiteService.createModel(modelData, {
      type,
      targetBoard,
      optimization
    });

    res.status(201).json({
      success: true,
      data: model
    });

  } catch (error) {
    console.error('TFLite model creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create TFLite model',
      details: error.message
    });
  }
});

/**
 * @desc    Deploy model to device
 * @route   POST /api/tflite/deploy/:modelId
 * @access  Private
 */
router.post('/deploy/:modelId', [
  body('deviceConfig')
    .isObject()
    .withMessage('Device config must be an object'),
  body('deviceConfig.targetBoard')
    .isIn(['esp32', 'arduino-nano-33-ble', 'raspberry-pi-pico', 'arduino-uno'])
    .withMessage('Invalid target board'),
  body('deviceConfig.serialPort')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid serial port'),
  body('deviceConfig.baudRate')
    .optional()
    .isInt({ min: 9600, max: 921600 })
    .withMessage('Invalid baud rate')
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

    const { modelId } = req.params;
    const { deviceConfig } = req.body;

    // Deploy model
    const deployment = await TFLiteService.deployModel(modelId, deviceConfig);

    res.json({
      success: true,
      data: deployment
    });

  } catch (error) {
    console.error('Model deployment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy model',
      details: error.message
    });
  }
});

/**
 * @desc    Get TFLite model by ID
 * @route   GET /api/tflite/model/:modelId
 * @access  Private
 */
router.get('/model/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = TFLiteService.getModel(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      data: model
    });

  } catch (error) {
    console.error('Get model failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model'
    });
  }
});

/**
 * @desc    Get all TFLite models
 * @route   GET /api/tflite/models
 * @access  Private
 */
router.get('/models', async (req, res) => {
  try {
    const models = TFLiteService.getAllModels();

    res.json({
      success: true,
      count: models.length,
      data: models
    });

  } catch (error) {
    console.error('Get models failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get models'
    });
  }
});

/**
 * @desc    Get available model templates
 * @route   GET /api/tflite/templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'image_classification',
        name: 'Image Classification',
        description: 'Classify images into predefined categories',
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
        supportedBoards: ['esp32', 'arduino-nano-33-ble'],
        memory: { flash: 500000, ram: 100000 },
        useCases: ['Object recognition', 'Quality control', 'Smart cameras']
      },
      {
        id: 'audio_classification',
        name: 'Audio Classification',
        description: 'Classify audio signals and sounds',
        inputShape: [1, 1960],
        outputShape: [1, 3],
        supportedBoards: ['esp32', 'arduino-nano-33-ble'],
        memory: { flash: 300000, ram: 50000 },
        useCases: ['Sound detection', 'Voice commands', 'Environmental monitoring']
      },
      {
        id: 'gesture_recognition',
        name: 'Gesture Recognition',
        description: 'Recognize hand gestures and movements',
        inputShape: [1, 126],
        outputShape: [1, 4],
        supportedBoards: ['arduino-nano-33-ble', 'esp32'],
        memory: { flash: 200000, ram: 30000 },
        useCases: ['Gesture control', 'Sign language recognition', 'Motion sensing']
      },
      {
        id: 'anomaly_detection',
        name: 'Anomaly Detection',
        description: 'Detect unusual patterns in sensor data',
        inputShape: [1, 10],
        outputShape: [1, 1],
        supportedBoards: ['esp32', 'raspberry-pi-pico', 'arduino-uno'],
        memory: { flash: 150000, ram: 20000 },
        useCases: ['Predictive maintenance', 'Quality monitoring', 'Security systems']
      },
      {
        id: 'object_detection',
        name: 'Object Detection',
        description: 'Detect and locate objects in images',
        inputShape: [1, 96, 96, 3],
        outputShape: [1, 5, 6],
        supportedBoards: ['esp32'],
        memory: { flash: 800000, ram: 200000 },
        useCases: ['Smart cameras', 'Robotics', 'Security systems']
      }
    ];

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    console.error('Get templates failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * @desc    Get supported boards
 * @route   GET /api/tflite/boards
 * @access  Private
 */
router.get('/boards', async (req, res) => {
  try {
    const boards = [
      {
        id: 'esp32',
        name: 'ESP32',
        manufacturer: 'Espressif',
        specs: {
          mcu: 'ESP32-D0WDQ6',
          cores: 2,
          frequency: '240MHz',
          ram: '520KB',
          flash: '4-16MB',
          wifi: true,
          bluetooth: true
        },
        supportedModels: ['image_classification', 'audio_classification', 'gesture_recognition', 'anomaly_detection', 'object_detection'],
        memoryConstraints: { flash: 1600000, ram: 327680 }
      },
      {
        id: 'arduino-nano-33-ble',
        name: 'Arduino Nano 33 BLE',
        manufacturer: 'Arduino',
        specs: {
          mcu: 'nRF52840',
          cores: 1,
          frequency: '64MHz',
          ram: '256KB',
          flash: '1MB',
          wifi: false,
          bluetooth: true
        },
        supportedModels: ['image_classification', 'audio_classification', 'gesture_recognition'],
        memoryConstraints: { flash: 1000000, ram: 262144 }
      },
      {
        id: 'raspberry-pi-pico',
        name: 'Raspberry Pi Pico',
        manufacturer: 'Raspberry Pi',
        specs: {
          mcu: 'RP2040',
          cores: 2,
          frequency: '133MHz',
          ram: '264KB',
          flash: '2MB',
          wifi: false,
          bluetooth: false
        },
        supportedModels: ['anomaly_detection'],
        memoryConstraints: { flash: 2000000, ram: 270336 }
      },
      {
        id: 'arduino-uno',
        name: 'Arduino Uno',
        manufacturer: 'Arduino',
        specs: {
          mcu: 'ATmega328P',
          cores: 1,
          frequency: '16MHz',
          ram: '2KB',
          flash: '32KB',
          wifi: false,
          bluetooth: false
        },
        supportedModels: ['anomaly_detection'],
        memoryConstraints: { flash: 32768, ram: 2048 }
      }
    ];

    res.json({
      success: true,
      count: boards.length,
      data: boards
    });

  } catch (error) {
    console.error('Get boards failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get boards'
    });
  }
});

/**
 * @desc    Get deployment by ID
 * @route   GET /api/tflite/deployment/:deploymentId
 * @access  Private
 */
router.get('/deployment/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = TFLiteService.getDeployment(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      data: deployment
    });

  } catch (error) {
    console.error('Get deployment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment'
    });
  }
});

/**
 * @desc    Estimate model performance
 * @route   POST /api/tflite/estimate
 * @access  Private
 */
router.post('/estimate', [
  body('type')
    .isIn(['image_classification', 'audio_classification', 'gesture_recognition', 'anomaly_detection', 'object_detection'])
    .withMessage('Invalid model type'),
  body('targetBoard')
    .isIn(['esp32', 'arduino-nano-33-ble', 'raspberry-pi-pico', 'arduino-uno'])
    .withMessage('Invalid target board'),
  body('optimization')
    .optional()
    .isIn(['speed', 'size', 'balanced'])
    .withMessage('Invalid optimization type')
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

    const { type, targetBoard, optimization = 'balanced' } = req.body;

    // Get template for estimation
    const templates = await TFLiteService.getTemplates();
    const template = templates.find(t => t.id === type);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Estimate performance
    const performance = await TFLiteService.estimatePerformance(template, targetBoard, optimization);

    res.json({
      success: true,
      data: {
        type,
        targetBoard,
        optimization,
        performance,
        memoryRequirements: template.memory,
        compatibility: template.supportedBoards.includes(targetBoard)
      }
    });

  } catch (error) {
    console.error('Performance estimation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate performance'
    });
  }
});

/**
 * @desc    Generate model from training data
 * @route   POST /api/tflite/train
 * @access  Private
 */
router.post('/train', [
  body('type')
    .isIn(['image_classification', 'audio_classification', 'gesture_recognition', 'anomaly_detection', 'object_detection'])
    .withMessage('Invalid model type'),
  body('trainingData')
    .isObject()
    .withMessage('Training data must be an object'),
  body('targetBoard')
    .isIn(['esp32', 'arduino-nano-33-ble', 'raspberry-pi-pico', 'arduino-uno'])
    .withMessage('Invalid target board'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be an object')
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

    const { type, trainingData, targetBoard, parameters = {} } = req.body;

    // In a real implementation, this would train a model
    // For now, create a mock trained model
    const modelData = {
      layers: parameters.layers || 5,
      parameters: parameters.parameters || 25000,
      size: parameters.size || 100000,
      training: {
        epochs: parameters.epochs || 10,
        accuracy: 0.95,
        loss: 0.05,
        completed: new Date().toISOString()
      }
    };

    const model = await TFLiteService.createModel(modelData, {
      type,
      targetBoard,
      optimization: parameters.optimization || 'balanced'
    });

    res.status(201).json({
      success: true,
      data: {
        ...model,
        training: modelData.training
      }
    });

  } catch (error) {
    console.error('Model training failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to train model',
      details: error.message
    });
  }
});

/**
 * @desc    Delete TFLite model
 * @route   DELETE /api/tflite/model/:modelId
 * @access  Private
 */
router.delete('/model/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    await TFLiteService.deleteModel(modelId);

    res.json({
      success: true,
      message: 'Model deleted successfully'
    });

  } catch (error) {
    console.error('Model deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete model'
    });
  }
});

/**
 * @desc    Get model performance metrics
 * @route   GET /api/tflite/metrics/:modelId
 * @access  Private
 */
router.get('/metrics/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = TFLiteService.getModel(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Generate mock metrics (in real implementation, collect from device)
    const metrics = {
      inferenceTime: model.metadata.performance.inferenceTime,
      powerConsumption: model.metadata.performance.powerConsumption,
      accuracy: model.metadata.performance.accuracy,
      memoryUsage: {
        flash: model.metadata.memoryRequirements.flash,
        ram: model.metadata.memoryRequirements.ram,
        efficiency: model.metadata.performance.memoryEfficiency
      },
      performance: {
        fps: Math.round(1000 / model.metadata.performance.inferenceTime),
        latency: model.metadata.performance.inferenceTime,
        throughput: Math.round(1000 / model.metadata.performance.inferenceTime)
      },
      collectedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Get metrics failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

module.exports = router;