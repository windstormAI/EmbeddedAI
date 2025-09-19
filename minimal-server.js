const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString()
  });
});

// Basic components endpoint
app.get('/api/components', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'arduino-uno',
        name: 'Arduino Uno',
        category: 'microcontroller',
        price: 23.00,
        inStock: true
      },
      {
        id: 'esp32',
        name: 'ESP32',
        category: 'microcontroller',
        price: 15.00,
        inStock: true
      }
    ]
  });
});

// Basic users endpoint
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        username: 'demo',
        name: 'Demo User',
        avatar: null
      }
    ]
  });
});

// Catch-all for other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});