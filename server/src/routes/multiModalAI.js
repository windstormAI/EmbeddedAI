/**
 * Multi-Modal AI Routes
 * API endpoints for processing text, images, and other modalities
 */

const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const MultiModalAIService = require('../services/multiModalAIService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'image/bmp',
      'image/tiff'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`), false);
    }
  }
});

/**
 * @desc    Process multi-modal input (text + images)
 * @route   POST /api/multimodal/process
 * @access  Private
 */
router.post('/process', [
  body('text')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Text cannot exceed 5000 characters'),
  body('modality')
    .optional()
    .isIn(['circuit_diagram', 'schematic', 'hand_drawn', 'pcb_layout', 'code_image'])
    .withMessage('Invalid modality type'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
  body('images.*.data')
    .optional()
    .isString()
    .withMessage('Image data must be base64 string')
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

    const { text, images = [], modality = 'circuit_diagram' } = req.body;

    // Validate input
    if (!text && images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Either text or images must be provided'
      });
    }

    // Process multi-modal input
    const result = await MultiModalAIService.processMultiModal({
      text,
      images,
      modality
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Multi-modal processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Multi-modal processing failed',
      details: error.message
    });
  }
});

/**
 * @desc    Upload and process files
 * @route   POST /api/multimodal/upload
 * @access  Private
 */
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { modality = 'circuit_diagram' } = req.body;

    // Process uploaded files
    const result = await MultiModalAIService.processBatch(req.files);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('File upload processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'File processing failed',
      details: error.message
    });
  }
});

/**
 * @desc    Process single uploaded file
 * @route   POST /api/multimodal/upload/single
 * @access  Private
 */
router.post('/upload/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { modality = 'circuit_diagram' } = req.body;

    // Process single file
    const result = await MultiModalAIService.processFile(req.file);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Single file processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'File processing failed',
      details: error.message
    });
  }
});

/**
 * @desc    Get supported modalities
 * @route   GET /api/multimodal/modalities
 * @access  Private
 */
router.get('/modalities', async (req, res) => {
  try {
    const modalities = [
      {
        id: 'circuit_diagram',
        name: 'Circuit Diagram',
        description: 'Process electronic circuit diagrams and schematics',
        supportedFormats: ['jpg', 'png', 'svg', 'pdf'],
        example: 'Upload a photo of your breadboard circuit'
      },
      {
        id: 'schematic',
        name: 'Schematic',
        description: 'Analyze electronic schematics and symbols',
        supportedFormats: ['jpg', 'png', 'svg', 'pdf'],
        example: 'Upload a professional schematic diagram'
      },
      {
        id: 'hand_drawn',
        name: 'Hand-Drawn Circuit',
        description: 'Interpret hand-drawn or sketched circuits',
        supportedFormats: ['jpg', 'png', 'gif'],
        example: 'Upload a sketch of your circuit idea'
      },
      {
        id: 'pcb_layout',
        name: 'PCB Layout',
        description: 'Analyze printed circuit board layouts',
        supportedFormats: ['jpg', 'png', 'svg'],
        example: 'Upload a photo of your PCB design'
      },
      {
        id: 'code_image',
        name: 'Code Image',
        description: 'Extract and analyze code from images',
        supportedFormats: ['jpg', 'png', 'gif'],
        example: 'Upload a screenshot of your code'
      }
    ];

    res.json({
      success: true,
      count: modalities.length,
      data: modalities
    });

  } catch (error) {
    console.error('Get modalities failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modalities'
    });
  }
});

/**
 * @desc    Get processing history
 * @route   GET /api/multimodal/history
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    // In a real implementation, this would fetch from database
    // For now, return mock data
    const history = [
      {
        id: 'processing-1',
        modality: 'circuit_diagram',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
        input: 'LED blinking circuit',
        output: 'Generated Arduino code and circuit diagram'
      },
      {
        id: 'processing-2',
        modality: 'schematic',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'completed',
        input: 'Temperature sensor schematic',
        output: 'Generated netlist and SPICE model'
      }
    ];

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Get history failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing history'
    });
  }
});

/**
 * @desc    Get processing result by ID
 * @route   GET /api/multimodal/result/:id
 * @access  Private
 */
router.get('/result/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would fetch from database/cache
    // For now, return mock data
    const mockResult = {
      id,
      modality: 'circuit_diagram',
      timestamp: new Date().toISOString(),
      status: 'completed',
      input: {
        text: 'Create a blinking LED circuit',
        images: []
      },
      output: {
        circuit: {
          components: [
            { id: 'arduino-1', type: 'arduino-uno', name: 'Arduino Uno' },
            { id: 'led-1', type: 'led', name: 'LED' },
            { id: 'resistor-1', type: 'resistor', name: '220Ω Resistor' }
          ],
          connections: [
            { from: 'arduino-1', to: 'led-1', type: 'wire' },
            { from: 'led-1', to: 'resistor-1', type: 'wire' },
            { from: 'resistor-1', to: 'arduino-1', type: 'wire' }
          ]
        },
        code: `#include <Arduino.h>

void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`,
        instructions: 'Connect LED to pin 13 with 220Ω resistor to ground'
      }
    };

    res.json({
      success: true,
      data: mockResult
    });

  } catch (error) {
    console.error('Get result failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing result'
    });
  }
});

/**
 * @desc    Analyze image quality for processing
 * @route   POST /api/multimodal/analyze-image
 * @access  Private
 */
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded'
      });
    }

    // Analyze image quality and preprocessing needs
    const analysis = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      dimensions: await this.getImageDimensions(req.file.buffer),
      quality: this.assessImageQuality(req.file),
      preprocessing: this.recommendPreprocessing(req.file),
      confidence: this.calculateProcessingConfidence(req.file)
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Image analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Image analysis failed',
      details: error.message
    });
  }
});

/**
 * @desc    Batch process multiple modalities
 * @route   POST /api/multimodal/batch
 * @access  Private
 */
router.post('/batch', [
  body('requests')
    .isArray({ min: 1, max: 10 })
    .withMessage('Requests must be an array of 1-10 items'),
  body('requests.*.text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Text cannot exceed 2000 characters per request'),
  body('requests.*.modality')
    .optional()
    .isIn(['circuit_diagram', 'schematic', 'hand_drawn', 'pcb_layout', 'code_image'])
    .withMessage('Invalid modality type')
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

    const { requests } = req.body;

    // Process multiple requests in parallel
    const results = await Promise.allSettled(
      requests.map(request =>
        MultiModalAIService.processMultiModal(request)
      )
    );

    const processedResults = results.map((result, index) => ({
      requestIndex: index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    res.json({
      success: true,
      total: requests.length,
      successful: processedResults.filter(r => r.success).length,
      failed: processedResults.filter(r => !r.success).length,
      data: processedResults
    });

  } catch (error) {
    console.error('Batch processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch processing failed',
      details: error.message
    });
  }
});

// Helper methods (would be moved to a separate utility file in production)
async function getImageDimensions(buffer) {
  // Mock implementation - in real app, use sharp or similar
  return { width: 800, height: 600 };
}

function assessImageQuality(file) {
  const quality = {
    resolution: file.size > 100000 ? 'good' : 'low',
    format: file.mimetype.split('/')[1],
    size: file.size,
    score: file.size > 50000 ? 0.8 : 0.5
  };
  return quality;
}

function recommendPreprocessing(file) {
  const recommendations = [];

  if (file.size < 50000) {
    recommendations.push('Increase image resolution for better analysis');
  }

  if (file.mimetype === 'image/jpeg') {
    recommendations.push('Consider PNG format for better quality');
  }

  return recommendations;
}

function calculateProcessingConfidence(file) {
  let confidence = 0.5;

  if (file.size > 100000) confidence += 0.2;
  if (['image/png', 'image/jpeg'].includes(file.mimetype)) confidence += 0.2;
  if (file.originalname.toLowerCase().includes('circuit')) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

module.exports = router;