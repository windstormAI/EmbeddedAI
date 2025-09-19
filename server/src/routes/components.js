/**
 * Components Routes
 * Component library management and retrieval
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock components storage (replace with database later)
let mockComponents = [
  {
    id: 'arduino-uno',
    name: 'Arduino Uno',
    type: 'board',
    category: 'microcontroller',
    description: 'ATmega328P-based microcontroller board',
    pins: 14,
    analogPins: 6,
    digitalPins: 14,
    properties: {
      voltage: '5V',
      clockSpeed: '16MHz',
      flashMemory: '32KB',
      sram: '2KB',
      eeprom: '1KB'
    },
    pinout: {
      digital: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
      analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
      power: ['5V', '3.3V', 'GND', 'VIN'],
      other: ['RESET', 'AREF']
    },
    color: '#00979C',
    size: { width: 120, height: 80 },
    image: '/images/components/arduino-uno.png',
    datasheet: 'https://www.arduino.cc/en/uploads/Main/Arduino_Uno_Rev3-schematic.pdf',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'esp32',
    name: 'ESP32',
    type: 'board',
    category: 'microcontroller',
    description: 'WiFi & Bluetooth enabled microcontroller',
    pins: 38,
    analogPins: 18,
    digitalPins: 34,
    properties: {
      voltage: '3.3V',
      wifi: true,
      bluetooth: true,
      flashMemory: '4MB+',
      sram: '520KB'
    },
    pinout: {
      digital: Array.from({length: 34}, (_, i) => `GPIO${i}`),
      analog: Array.from({length: 18}, (_, i) => `ADC${i}`),
      power: ['3.3V', 'GND', 'EN', 'VIN'],
      other: ['RESET', 'BOOT']
    },
    color: '#E7352C',
    size: { width: 100, height: 60 },
    image: '/images/components/esp32.png',
    datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'led',
    name: 'LED',
    type: 'output',
    category: 'display',
    description: 'Light Emitting Diode for visual output',
    pins: 2,
    properties: {
      forwardVoltage: '2.0-3.0V',
      current: '20mA',
      wavelength: '630nm',
      color: 'Red'
    },
    pinout: {
      pins: ['Anode (+)', 'Cathode (-)']
    },
    color: '#FFD700',
    size: { width: 40, height: 40 },
    image: '/images/components/led.png',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'push-button',
    name: 'Push Button',
    type: 'input',
    category: 'switch',
    description: 'Momentary push button switch',
    pins: 2,
    properties: {
      type: 'Normally Open',
      rating: '50mA @ 24VDC',
      lifespan: '100,000 cycles'
    },
    pinout: {
      pins: ['Pin 1', 'Pin 2']
    },
    color: '#4A90E2',
    size: { width: 50, height: 50 },
    image: '/images/components/push-button.png',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'potentiometer',
    name: 'Potentiometer',
    type: 'input',
    category: 'sensor',
    description: 'Variable resistor for analog input',
    pins: 3,
    properties: {
      resistance: '10KΩ',
      tolerance: '±20%',
      powerRating: '0.25W'
    },
    pinout: {
      pins: ['Pin 1 (GND)', 'Pin 2 (Signal)', 'Pin 3 (VCC)']
    },
    color: '#7ED321',
    size: { width: 60, height: 40 },
    image: '/images/components/potentiometer.png',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'buzzer',
    name: 'Buzzer',
    type: 'output',
    category: 'audio',
    description: 'Piezoelectric buzzer for audio output',
    pins: 2,
    properties: {
      voltage: '3-24V',
      frequency: '2-4KHz',
      soundPressure: '85dB'
    },
    pinout: {
      pins: ['Positive (+)', 'Negative (-)']
    },
    color: '#F5A623',
    size: { width: 45, height: 45 },
    image: '/images/components/buzzer.png',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'temperature-sensor',
    name: 'DS18B20 Temp Sensor',
    type: 'input',
    category: 'sensor',
    description: 'Digital temperature sensor with 1-wire interface',
    pins: 3,
    properties: {
      range: '-55°C to +125°C',
      accuracy: '±0.5°C',
      resolution: '9-12 bits',
      interface: '1-Wire'
    },
    pinout: {
      pins: ['GND', 'Data', 'VDD']
    },
    color: '#D0021B',
    size: { width: 55, height: 35 },
    image: '/images/components/ds18b20.png',
    datasheet: 'https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'photoresistor',
    name: 'Photoresistor',
    type: 'input',
    category: 'sensor',
    description: 'Light-dependent resistor for light sensing',
    pins: 2,
    properties: {
      darkResistance: '1MΩ',
      lightResistance: '10KΩ',
      responseTime: '20-30ms'
    },
    pinout: {
      pins: ['Pin 1', 'Pin 2']
    },
    color: '#BD10E0',
    size: { width: 50, height: 30 },
    image: '/images/components/photoresistor.png',
    isActive: true,
    createdAt: new Date()
  }
];

// @route   GET /api/v1/components
// @desc    Get all components
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, type, search, limit = 50, offset = 0 } = req.query;

    let filteredComponents = [...mockComponents];

    // Apply filters
    if (category) {
      filteredComponents = filteredComponents.filter(comp => comp.category === category);
    }

    if (type) {
      filteredComponents = filteredComponents.filter(comp => comp.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredComponents = filteredComponents.filter(comp =>
        comp.name.toLowerCase().includes(searchLower) ||
        comp.description.toLowerCase().includes(searchLower) ||
        comp.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComponents = filteredComponents.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        components: paginatedComponents,
        total: filteredComponents.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Get components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/v1/components/categories
// @desc    Get component categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [...new Set(mockComponents.map(comp => comp.category))];
    const types = [...new Set(mockComponents.map(comp => comp.type))];

    res.json({
      success: true,
      data: {
        categories,
        types
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/v1/components/:id
// @desc    Get component by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const componentId = req.params.id;
    const component = mockComponents.find(comp => comp.id === componentId);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    res.json({
      success: true,
      data: {
        component
      }
    });

  } catch (error) {
    logger.error('Get component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/v1/components
// @desc    Create new component (admin only)
// @access  Private/Admin
router.post('/', [
  body('id')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-z0-9-]+$/),
  body('name')
    .isLength({ min: 1, max: 100 }),
  body('type')
    .isIn(['board', 'input', 'output', 'sensor', 'actuator']),
  body('category')
    .isLength({ min: 1, max: 50 }),
  body('description')
    .isLength({ min: 1, max: 500 }),
  body('pins')
    .isInt({ min: 1, max: 100 }),
  body('properties')
    .optional()
    .isObject(),
  body('pinout')
    .optional()
    .isObject(),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i),
  body('size')
    .optional()
    .isObject()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userRole = req.user?.role || 'user'; // Mock user role

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id, name, type, category, description, pins, properties, pinout, color, size, image, datasheet } = req.body;

    // Check if component ID already exists
    const existingComponent = mockComponents.find(comp => comp.id === id);
    if (existingComponent) {
      return res.status(400).json({
        success: false,
        message: 'Component with this ID already exists'
      });
    }

    const newComponent = {
      id,
      name,
      type,
      category,
      description,
      pins,
      properties: properties || {},
      pinout: pinout || {},
      color: color || '#6b7280',
      size: size || { width: 50, height: 50 },
      image: image || `/images/components/${id}.png`,
      datasheet,
      isActive: true,
      createdAt: new Date()
    };

    mockComponents.push(newComponent);

    logger.info(`New component created: ${name} (${id})`);

    res.status(201).json({
      success: true,
      message: 'Component created successfully',
      data: {
        component: newComponent
      }
    });

  } catch (error) {
    logger.error('Create component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/v1/components/:id
// @desc    Update component (admin only)
// @access  Private/Admin
router.put('/:id', async (req, res) => {
  try {
    const userRole = req.user?.role || 'user'; // Mock user role

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const componentId = req.params.id;
    const updates = req.body;

    const componentIndex = mockComponents.findIndex(comp => comp.id === componentId);

    if (componentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Update component
    mockComponents[componentIndex] = {
      ...mockComponents[componentIndex],
      ...updates
    };

    const updatedComponent = mockComponents[componentIndex];

    logger.info(`Component updated: ${updatedComponent.name} (${componentId})`);

    res.json({
      success: true,
      message: 'Component updated successfully',
      data: {
        component: updatedComponent
      }
    });

  } catch (error) {
    logger.error('Update component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/v1/components/:id
// @desc    Delete component (admin only)
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const userRole = req.user?.role || 'user'; // Mock user role

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const componentId = req.params.id;
    const componentIndex = mockComponents.findIndex(comp => comp.id === componentId);

    if (componentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    const deletedComponent = mockComponents.splice(componentIndex, 1)[0];

    logger.info(`Component deleted: ${deletedComponent.name} (${componentId})`);

    res.json({
      success: true,
      message: 'Component deleted successfully'
    });

  } catch (error) {
    logger.error('Delete component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/v1/components/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const query = q.toLowerCase();
    const suggestions = mockComponents
      .filter(comp =>
        comp.name.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.category.toLowerCase().includes(query)
      )
      .slice(0, 10)
      .map(comp => ({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        category: comp.category
      }));

    res.json({
      success: true,
      data: {
        suggestions
      }
    });

  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;