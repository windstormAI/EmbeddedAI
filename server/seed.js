/**
 * Database Seeding Script
 * Populates the database with initial component data
 */

const mongoose = require('mongoose');
const Component = require('./models/Component');
require('dotenv').config();

const components = [
  {
    name: 'Arduino Uno',
    description: 'Classic Arduino microcontroller board',
    category: 'microcontroller',
    type: 'arduino-uno',
    pins: [
      { name: 'Digital 0 (RX)', type: 'digital', number: 0, description: 'Serial RX' },
      { name: 'Digital 1 (TX)', type: 'digital', number: 1, description: 'Serial TX' },
      { name: 'Digital 2', type: 'digital', number: 2 },
      { name: 'Digital 3 (PWM)', type: 'pwm', number: 3 },
      { name: 'Digital 4', type: 'digital', number: 4 },
      { name: 'Digital 5 (PWM)', type: 'pwm', number: 5 },
      { name: 'Digital 6 (PWM)', type: 'pwm', number: 6 },
      { name: 'Digital 7', type: 'digital', number: 7 },
      { name: 'Digital 8', type: 'digital', number: 8 },
      { name: 'Digital 9 (PWM)', type: 'pwm', number: 9 },
      { name: 'Digital 10 (PWM)', type: 'pwm', number: 10 },
      { name: 'Digital 11 (PWM)', type: 'pwm', number: 11 },
      { name: 'Digital 12', type: 'digital', number: 12 },
      { name: 'Digital 13', type: 'digital', number: 13 },
      { name: 'Analog A0', type: 'analog', number: 14 },
      { name: 'Analog A1', type: 'analog', number: 15 },
      { name: 'Analog A2', type: 'analog', number: 16 },
      { name: 'Analog A3', type: 'analog', number: 17 },
      { name: 'Analog A4 (SDA)', type: 'i2c', number: 18 },
      { name: 'Analog A5 (SCL)', type: 'i2c', number: 19 }
    ],
    properties: {
      voltage: { min: 6, max: 20, nominal: 9 },
      current: { max: 1000 }
    },
    manufacturer: {
      name: 'Arduino',
      partNumber: 'A000066'
    }
  },
  {
    name: 'LED',
    description: 'Standard red LED',
    category: 'actuator',
    type: 'led',
    pins: [
      { name: 'Anode (+)', type: 'power', number: 1, description: 'Positive terminal' },
      { name: 'Cathode (-)', type: 'ground', number: 2, description: 'Negative terminal' }
    ],
    properties: {
      voltage: { min: 1.8, max: 2.4, nominal: 2.0 },
      current: { max: 20, nominal: 10 }
    }
  },
  {
    name: 'Push Button',
    description: 'Momentary push button switch',
    category: 'interface',
    type: 'button',
    pins: [
      { name: 'Pin 1', type: 'digital', number: 1 },
      { name: 'Pin 2', type: 'digital', number: 2 }
    ]
  },
  {
    name: 'Potentiometer',
    description: '10K ohm rotary potentiometer',
    category: 'interface',
    type: 'potentiometer',
    pins: [
      { name: 'Pin 1', type: 'analog', number: 1 },
      { name: 'Pin 2', type: 'analog', number: 2 },
      { name: 'Pin 3', type: 'analog', number: 3 }
    ],
    properties: {
      voltage: { max: 5 }
    }
  },
  {
    name: 'Servo Motor',
    description: 'Standard servo motor (180°)',
    category: 'actuator',
    type: 'servo',
    pins: [
      { name: 'Signal', type: 'pwm', number: 1, description: 'Control signal' },
      { name: 'VCC', type: 'power', number: 2, description: 'Power supply' },
      { name: 'GND', type: 'ground', number: 3, description: 'Ground' }
    ],
    properties: {
      voltage: { min: 4.8, max: 6.0, nominal: 5.0 },
      current: { max: 1000 }
    }
  },
  {
    name: 'Ultrasonic Sensor',
    description: 'HC-SR04 ultrasonic distance sensor',
    category: 'sensor',
    type: 'ultrasonic',
    pins: [
      { name: 'VCC', type: 'power', number: 1 },
      { name: 'Trig', type: 'digital', number: 2 },
      { name: 'Echo', type: 'digital', number: 3 },
      { name: 'GND', type: 'ground', number: 4 }
    ],
    properties: {
      voltage: { min: 3.3, max: 5.5, nominal: 5.0 },
      current: { max: 15 }
    }
  },
  {
    name: 'DHT11',
    description: 'Temperature and humidity sensor',
    category: 'sensor',
    type: 'temperature',
    pins: [
      { name: 'VCC', type: 'power', number: 1 },
      { name: 'Data', type: 'digital', number: 2 },
      { name: 'NC', type: 'digital', number: 3 },
      { name: 'GND', type: 'ground', number: 4 }
    ],
    properties: {
      voltage: { min: 3.3, max: 5.5, nominal: 5.0 }
    }
  },
  {
    name: 'LCD 16x2',
    description: '16x2 character LCD display',
    category: 'display',
    type: 'lcd',
    pins: [
      { name: 'VSS', type: 'ground', number: 1 },
      { name: 'VDD', type: 'power', number: 2 },
      { name: 'VO', type: 'analog', number: 3 },
      { name: 'RS', type: 'digital', number: 4 },
      { name: 'RW', type: 'digital', number: 5 },
      { name: 'E', type: 'digital', number: 6 },
      { name: 'D0', type: 'digital', number: 7 },
      { name: 'D1', type: 'digital', number: 8 },
      { name: 'D2', type: 'digital', number: 9 },
      { name: 'D3', type: 'digital', number: 10 },
      { name: 'D4', type: 'digital', number: 11 },
      { name: 'D5', type: 'digital', number: 12 },
      { name: 'D6', type: 'digital', number: 13 },
      { name: 'D7', type: 'digital', number: 14 },
      { name: 'A', type: 'power', number: 15 },
      { name: 'K', type: 'ground', number: 16 }
    ],
    properties: {
      voltage: { min: 4.5, max: 5.5, nominal: 5.0 }
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/embedded', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🌱 Seeding database...');

    // Clear existing components
    await Component.deleteMany({});
    console.log('🗑️  Cleared existing components');

    // Insert new components
    const insertedComponents = await Component.insertMany(components);
    console.log(`✅ Inserted ${insertedComponents.length} components`);

    // Update usage counts for popular components
    await Component.updateMany(
      { type: { $in: ['arduino-uno', 'led', 'button'] } },
      { $inc: { usageCount: Math.floor(Math.random() * 100) + 10 } }
    );

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, components };