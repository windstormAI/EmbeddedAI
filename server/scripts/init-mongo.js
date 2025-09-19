// MongoDB initialization script for production
db = db.getSiblingDB('embedded');

// Create collections with indexes
db.createCollection('users');
db.createCollection('projects');
db.createCollection('components');
db.createCollection('subscriptions');
db.createCollection('invoices');
db.createCollection('ai_requests');
db.createCollection('simulations');

// User collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "stats.lastActivity": -1 });
db.users.createIndex({ "isActive": 1 });

// Project collection indexes
db.projects.createIndex({ "userId": 1 });
db.projects.createIndex({ "createdAt": -1 });
db.projects.createIndex({ "updatedAt": -1 });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "isPublic": 1 });
db.projects.createIndex({ "collaborators.user": 1 });

// Component collection indexes
db.components.createIndex({ "category": 1 });
db.components.createIndex({ "type": 1 });
db.components.createIndex({ "usageCount": -1 });
db.components.createIndex({ "isBuiltIn": 1 });
db.components.createIndex({ "status": 1 });

// Subscription collection indexes
db.subscriptions.createIndex({ "userId": 1 });
db.subscriptions.createIndex({ "status": 1 });
db.subscriptions.createIndex({ "currentPeriodEnd": 1 });
db.subscriptions.createIndex({ "createdAt": -1 });

// Invoice collection indexes
db.invoices.createIndex({ "userId": 1 });
db.invoices.createIndex({ "subscriptionId": 1 });
db.invoices.createIndex({ "status": 1 });
db.invoices.createIndex({ "createdAt": -1 });

// AI requests collection indexes
db.ai_requests.createIndex({ "userId": 1 });
db.ai_requests.createIndex({ "createdAt": -1 });
db.ai_requests.createIndex({ "model": 1 });
db.ai_requests.createIndex({ "tokensUsed": -1 });

// Simulation collection indexes
db.simulations.createIndex({ "userId": 1 });
db.simulations.createIndex({ "projectId": 1 });
db.simulations.createIndex({ "createdAt": -1 });
db.simulations.createIndex({ "status": 1 });

// Create admin user (only if it doesn't exist)
if (db.users.findOne({ role: "admin" }) === null) {
  db.users.insertOne({
    username: "admin",
    email: "admin@embedded-platform.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fYzYXxGK", // password: admin123!
    name: "Platform Admin",
    role: "admin",
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      projectsCreated: 0,
      projectsCompleted: 0,
      totalLogins: 0,
      lastActivity: new Date()
    },
    preferences: {
      theme: "dark",
      language: "en",
      notifications: {
        email: true,
        browser: true,
        aiSuggestions: true
      }
    }
  });

  print("Admin user created successfully");
}

// Create default components
const defaultComponents = [
  {
    name: "Arduino Uno",
    type: "arduino-uno",
    category: "board",
    description: "ATmega328P microcontroller board",
    pins: 20,
    voltage: 5.0,
    price: 23.00,
    inStock: true,
    isBuiltIn: true,
    status: "approved",
    specifications: {
      microcontroller: "ATmega328P",
      clockSpeed: 16,
      flashMemory: 32,
      sram: 2,
      eeprom: 1,
      digitalPins: 14,
      analogPins: 6,
      pwmPins: [3, 5, 6, 9, 10, 11]
    },
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ESP32 Dev Board",
    type: "esp32",
    category: "board",
    description: "WiFi & Bluetooth enabled microcontroller",
    pins: 38,
    voltage: 3.3,
    price: 15.00,
    inStock: true,
    isBuiltIn: true,
    status: "approved",
    specifications: {
      microcontroller: "ESP32",
      clockSpeed: 240,
      flashMemory: 512,
      sram: 520,
      wifi: true,
      bluetooth: true,
      digitalPins: 34,
      analogPins: 18
    },
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "LED (5mm)",
    type: "led",
    category: "output",
    description: "Standard 5mm LED",
    pins: 2,
    voltage: 3.0,
    currentDraw: 20,
    price: 0.50,
    inStock: true,
    isBuiltIn: true,
    status: "approved",
    specifications: {
      color: "Red",
      forwardVoltage: 2.0,
      maxCurrent: 30,
      wavelength: 625
    },
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Push Button",
    type: "push-button",
    category: "input",
    description: "Momentary push button switch",
    pins: 2,
    voltage: 5.0,
    price: 0.75,
    inStock: true,
    isBuiltIn: true,
    status: "approved",
    specifications: {
      type: "NO", // Normally Open
      rating: "50mA @ 24VDC",
      lifespan: 100000,
      operatingTemp: [-25, 70]
    },
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Temperature Sensor (DS18B20)",
    type: "temperature-sensor",
    category: "input",
    description: "Digital temperature sensor",
    pins: 3,
    voltage: 5.0,
    currentDraw: 1,
    price: 5.50,
    inStock: true,
    isBuiltIn: true,
    status: "approved",
    specifications: {
      interface: "OneWire",
      range: [-55, 125],
      accuracy: 0.5,
      resolution: 0.0625,
      responseTime: 750
    },
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert default components if they don't exist
defaultComponents.forEach(component => {
  if (db.components.findOne({ type: component.type }) === null) {
    db.components.insertOne(component);
    print(`Component ${component.name} created`);
  }
});

// Create subscription plans
const subscriptionPlans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    interval: "month",
    features: [
      "5 projects",
      "Basic AI assistance",
      "Community support",
      "Standard components"
    ],
    limits: {
      maxProjects: 5,
      maxAiRequests: 100,
      has3dVisualization: false,
      hasHardwareIntegration: false,
      hasPrioritySupport: false
    },
    stripePriceId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Pro",
    description: "For serious embedded developers",
    price: 19.99,
    interval: "month",
    features: [
      "Unlimited projects",
      "Advanced AI assistance",
      "3D circuit visualization",
      "Hardware integration",
      "Email support"
    ],
    limits: {
      maxProjects: null,
      maxAiRequests: null,
      has3dVisualization: true,
      hasHardwareIntegration: true,
      hasPrioritySupport: false
    },
    stripePriceId: "price_pro_monthly",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    price: 49.99,
    interval: "month",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced analytics",
      "Priority support",
      "Custom integrations"
    ],
    limits: {
      maxProjects: null,
      maxAiRequests: null,
      has3dVisualization: true,
      hasHardwareIntegration: true,
      hasPrioritySupport: true,
      maxTeamMembers: 10
    },
    stripePriceId: "price_enterprise_monthly",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert subscription plans if they don't exist
subscriptionPlans.forEach(plan => {
  if (db.subscriptions.findOne({ name: plan.name }) === null) {
    db.subscriptions.insertOne(plan);
    print(`Subscription plan ${plan.name} created`);
  }
});

print("Database initialization completed successfully!");