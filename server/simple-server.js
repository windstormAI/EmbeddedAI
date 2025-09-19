/**
 * Simple Embedded Systems Design Platform Server
 * Minimal server for development and testing
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Components API
app.get('/api/components', (req, res) => {
  const mockComponents = [
    {
      id: '1',
      name: 'Arduino UNO',
      type: 'microcontroller',
      category: 'boards',
      description: 'Arduino UNO R3 microcontroller board',
      pins: 14,
      analogPins: 6,
      voltage: 5,
      price: 23.00
    },
    {
      id: '2',
      name: 'LED',
      type: 'output',
      category: 'displays',
      description: 'Red LED indicator',
      forwardVoltage: 2.0,
      current: 20,
      price: 0.50
    },
    {
      id: '3',
      name: 'Push Button',
      type: 'input',
      category: 'sensors',
      description: 'Momentary push button switch',
      price: 1.00
    },
    {
      id: '4',
      name: 'Resistor 10kΩ',
      type: 'passive',
      category: 'components',
      description: '10k ohm resistor',
      resistance: 10000,
      tolerance: 5,
      price: 0.10
    },
    {
      id: '5',
      name: 'Capacitor 10µF',
      type: 'passive',
      category: 'components',
      description: '10µF electrolytic capacitor',
      capacitance: 0.00001,
      voltage: 16,
      price: 0.20
    }
  ];

  res.json({
    success: true,
    count: mockComponents.length,
    data: mockComponents
  });
});

// Users API
app.get('/api/users', (req, res) => {
  const mockUsers = [
    {
      id: '1',
      username: 'developer1',
      name: 'John Developer',
      avatar: null,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      username: 'maker2',
      name: 'Jane Maker',
      avatar: null,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    count: mockUsers.length,
    data: mockUsers
  });
});

// Projects API
app.get('/api/projects', (req, res) => {
  const mockProjects = [
    {
      id: '1',
      name: 'LED Blinker',
      description: 'Simple LED blinking circuit',
      user: '1',
      boardType: 'arduino-uno',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Temperature Sensor',
      description: 'Temperature monitoring with LCD display',
      user: '2',
      boardType: 'arduino-nano',
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    count: mockProjects.length,
    data: mockProjects
  });
});

// AI API (mock)
app.post('/api/ai/generate-code', (req, res) => {
  const { description, boardType } = req.body;

  const mockCode = `// Generated code for: ${description}
// Board: ${boardType}

void setup() {
  // Initialize pins
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // Main program logic
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);

  Serial.println("LED is blinking!");
}`;

  res.json({
    success: true,
    code: mockCode,
    explanation: 'This code creates a simple LED blinking pattern on pin 13.'
  });
});

// Authentication API (mock)
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Mock authentication - accept any email/password combination
  if (email && password) {
    const mockUser = {
      id: '1',
      email: email,
      name: 'Test User',
      avatar: null,
      role: 'developer',
      createdAt: new Date().toISOString()
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      user: mockUser,
      token: mockToken,
      message: 'Login successful'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Email and password are required'
    });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (email && password && name) {
    const mockUser = {
      id: Date.now().toString(),
      email: email,
      name: name,
      avatar: null,
      role: 'developer',
      createdAt: new Date().toISOString()
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      user: mockUser,
      token: mockToken,
      message: 'Registration successful'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid data',
      message: 'Email, password, and name are required'
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Simulation API (mock)
app.post('/api/simulation/run', (req, res) => {
  const { circuit, parameters } = req.body;

  // Mock simulation results
  const results = {
    voltage: 5.0,
    current: 0.02,
    power: 0.1,
    frequency: 1,
    dutyCycle: 50
  };

  res.json({
    success: true,
    results,
    message: 'Simulation completed successfully'
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Embedded Platform Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Ready to serve the client application`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});