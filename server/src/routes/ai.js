/**
 * AI Routes
 * AI-powered code generation and analysis
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock AI responses (replace with actual OpenAI integration later)
const mockAIResponses = {
  led: {
    code: `// LED Control Example
#define LED_PIN 13

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("LED Control Ready");
}

void loop() {
  // Turn LED on
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED: ON");
  delay(1000);

  // Turn LED off
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED: OFF");
  delay(1000);
}`,
    explanation: "This code creates a simple LED blinking circuit. The LED is connected to pin 13 and blinks on/off every second."
  },

  sensor: {
    code: `// Temperature Sensor Reading
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  Serial.println("Temperature Sensor Initialized");
}

void loop() {
  sensors.requestTemperatures();
  float temperatureC = sensors.getTempCByIndex(0);

  if (temperatureC != DEVICE_DISCONNECTED_C) {
    Serial.print("Temperature: ");
    Serial.print(temperatureC);
    Serial.println(" °C");
  } else {
    Serial.println("Error: Sensor not found");
  }

  delay(2000);
}`,
    explanation: "This code reads temperature from a DS18B20 sensor connected to pin 2 and displays it on the serial monitor."
  },

  motor: {
    code: `// DC Motor Control with L298N
#define IN1 8
#define IN2 9
#define ENA 10

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENA, OUTPUT);
  Serial.begin(9600);
  Serial.println("Motor Control Ready");
}

void loop() {
  // Forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 200); // Speed control
  Serial.println("Motor: FORWARD");
  delay(2000);

  // Stop
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  Serial.println("Motor: STOP");
  delay(1000);

  // Backward
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  analogWrite(ENA, 200);
  Serial.println("Motor: BACKWARD");
  delay(2000);

  // Stop
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  Serial.println("Motor: STOP");
  delay(1000);
}`,
    explanation: "This code controls a DC motor using an L298N motor driver. It demonstrates forward, backward, and stop operations with speed control."
  }
};

// @route   POST /api/v1/ai/generate
// @desc    Generate code from natural language prompt
// @access  Private
router.post('/generate', [
  body('prompt')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Prompt must be between 10 and 1000 characters'),
  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi'])
    .withMessage('Invalid board type'),
  body('components')
    .optional()
    .isArray()
    .withMessage('Components must be an array'),
  body('model')
    .optional()
    .isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-2'])
    .withMessage('Invalid AI model')
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

    const { prompt, boardType, components, model = 'gpt-4' } = req.body;
    const userId = req.user?.id || '1'; // Mock user ID

    logger.info(`AI code generation requested by user ${userId}`, {
      prompt: prompt.substring(0, 100) + '...',
      boardType,
      model
    });

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Generate mock response based on prompt content
    let response;

    if (prompt.toLowerCase().includes('led') || prompt.toLowerCase().includes('blink')) {
      response = mockAIResponses.led;
    } else if (prompt.toLowerCase().includes('temperature') || prompt.toLowerCase().includes('sensor')) {
      response = mockAIResponses.sensor;
    } else if (prompt.toLowerCase().includes('motor') || prompt.toLowerCase().includes('dc')) {
      response = mockAIResponses.motor;
    } else {
      // Generic response
      response = {
        code: `// Generated Arduino Code
void setup() {
  Serial.begin(9600);
  Serial.println("Device initialized");
}

void loop() {
  // Your code logic here
  Serial.println("Running...");
  delay(1000);
}`,
        explanation: "This is a basic Arduino template. Please provide more specific requirements for better code generation."
      };
    }

    // Analyze code quality
    const codeQuality = analyzeCodeQuality(response.code);

    // Generate suggestions
    const suggestions = generateSuggestions(response.code, boardType);

    // Calculate mock costs
    const tokensUsed = Math.floor(response.code.length / 4) + 100;
    const cost = calculateCost(tokensUsed, model);

    logger.info(`AI code generation completed for user ${userId}`, {
      tokensUsed,
      cost,
      codeLength: response.code.length
    });

    res.json({
      success: true,
      data: {
        code: response.code,
        explanation: response.explanation,
        quality: codeQuality,
        suggestions,
        metadata: {
          model,
          tokensUsed,
          cost,
          processingTime: 2000 + Math.random() * 1000,
          boardType: boardType || 'arduino-uno'
        }
      }
    });

  } catch (error) {
    logger.error('AI code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'AI code generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/v1/ai/analyze
// @desc    Analyze existing code for improvements
// @access  Private
router.post('/analyze', [
  body('code')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Code must be between 10 and 10,000 characters'),
  body('boardType')
    .optional()
    .isIn(['arduino-uno', 'esp32', 'raspberry-pi'])
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

    const { code, boardType } = req.body;
    const userId = req.user?.id || '1'; // Mock user ID

    logger.info(`Code analysis requested by user ${userId}`, {
      codeLength: code.length,
      boardType
    });

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    // Analyze code
    const analysis = analyzeCode(code, boardType);

    res.json({
      success: true,
      data: {
        analysis,
        suggestions: generateSuggestions(code, boardType),
        quality: analyzeCodeQuality(code)
      }
    });

  } catch (error) {
    logger.error('Code analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Code analysis failed'
    });
  }
});

// @route   POST /api/v1/ai/chat
// @desc    Interactive AI chat for project guidance
// @access  Private
router.post('/chat', [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
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

    const { message, context } = req.body;
    const userId = req.user?.id || '1'; // Mock user ID

    logger.info(`AI chat message from user ${userId}`, {
      messageLength: message.length
    });

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const responses = [
      "That's a great question! Let me help you with that Arduino project.",
      "I can see you're working with sensors. Here's what you need to know...",
      "Great choice of components! Here's how to connect them properly...",
      "I notice you're using digital pins. Make sure they're configured as INPUT or OUTPUT.",
      "That's an interesting approach. Have you considered using PWM for better control?",
      "Perfect! Your circuit design looks solid. Here's the code to make it work..."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      success: true,
      data: {
        response,
        suggestions: [
          "Check your pin connections",
          "Add proper error handling",
          "Consider using interrupts for better performance",
          "Don't forget to add delays between readings"
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Chat request failed'
    });
  }
});

// @route   GET /api/v1/ai/models
// @desc    Get available AI models
// @access  Private
router.get('/models', async (req, res) => {
  try {
    const models = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model for complex code generation',
        maxTokens: 4000,
        costPerToken: 0.03,
        capabilities: ['code-generation', 'debugging', 'optimization']
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective for simpler tasks',
        maxTokens: 2000,
        costPerToken: 0.002,
        capabilities: ['code-generation', 'explanation']
      },
      {
        id: 'claude-2',
        name: 'Claude 2',
        description: 'Excellent for code analysis and documentation',
        maxTokens: 3000,
        costPerToken: 0.008,
        capabilities: ['analysis', 'documentation', 'review']
      }
    ];

    res.json({
      success: true,
      data: {
        models,
        default: 'gpt-4'
      }
    });

  } catch (error) {
    logger.error('Get models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve models'
    });
  }
});

// Helper functions
function analyzeCodeQuality(code) {
  const lines = code.split('\n');
  const metrics = {
    totalLines: lines.length,
    commentLines: lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*')).length,
    emptyLines: lines.filter(line => line.trim() === '').length,
    codeLines: 0,
    hasSetup: false,
    hasLoop: false,
    hasComments: false,
    usesBestPractices: false
  };

  metrics.codeLines = metrics.totalLines - metrics.commentLines - metrics.emptyLines;
  metrics.hasSetup = code.includes('void setup()');
  metrics.hasLoop = code.includes('void loop()');
  metrics.hasComments = metrics.commentLines > 0;
  metrics.usesBestPractices = code.includes('pinMode') && code.includes('digitalWrite');

  let score = 0;
  if (metrics.hasSetup) score += 20;
  if (metrics.hasLoop) score += 20;
  if (metrics.hasComments) score += 15;
  if (metrics.usesBestPractices) score += 20;
  if (metrics.commentLines / metrics.totalLines > 0.2) score += 15;
  if (metrics.codeLines < 50) score += 10;

  return {
    score: Math.min(score, 100),
    metrics,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  };
}

function generateSuggestions(code, boardType) {
  const suggestions = [];

  if (!code.includes('void setup()')) {
    suggestions.push('Add a setup() function to initialize pins and serial communication');
  }

  if (!code.includes('void loop()')) {
    suggestions.push('Add a loop() function for continuous execution');
  }

  if (!code.includes('pinMode')) {
    suggestions.push('Use pinMode() to configure pin directions (INPUT/OUTPUT)');
  }

  if (!code.includes('delay(')) {
    suggestions.push('Consider adding delays to prevent overwhelming the microcontroller');
  }

  if (!code.includes('Serial.begin')) {
    suggestions.push('Add Serial.begin() for debugging and monitoring');
  }

  if (boardType === 'esp32' && !code.includes('WiFi')) {
    suggestions.push('Consider adding WiFi connectivity for ESP32 capabilities');
  }

  return suggestions.slice(0, 5);
}

function analyzeCode(code, boardType) {
  return {
    complexity: 'medium',
    issues: [
      {
        type: 'info',
        message: 'Code structure looks good',
        line: 1
      }
    ],
    recommendations: [
      'Consider adding error handling',
      'Add comments for complex logic',
      'Use meaningful variable names'
    ],
    performance: {
      score: 85,
      suggestions: ['Consider using interrupts for better performance']
    }
  };
}

function calculateCost(tokens, model) {
  const rates = {
    'gpt-4': 0.03,
    'gpt-3.5-turbo': 0.002,
    'claude-2': 0.008
  };

  return (tokens / 1000) * (rates[model] || 0.002);
}

export default router;