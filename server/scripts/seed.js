/**
 * Database Seeding Script
 * Populates the database with initial data for development and testing
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Component = require('../models/Component');
require('dotenv').config();

const seedData = {
  users: [
    {
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
      role: 'user',
      bio: 'Demo account for testing the platform',
      isActive: true,
      emailVerified: true
    },
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      bio: 'Administrator account',
      isActive: true,
      emailVerified: true
    }
  ],

  components: [
    {
      name: 'Arduino Uno',
      type: 'microcontroller',
      category: 'board',
      description: 'Classic Arduino board with ATmega328P microcontroller',
      properties: {
        pins: 14,
        analogPins: 6,
        flashMemory: '32KB',
        sram: '2KB',
        eeprom: '1KB',
        clockSpeed: '16MHz'
      },
      pinout: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
        power: ['5V', '3.3V', 'GND', 'VIN'],
        special: ['RESET', 'AREF']
      },
      library: 'arduino'
    },
    {
      name: 'LED',
      type: 'output',
      category: 'actuator',
      description: 'Light Emitting Diode for visual output',
      properties: {
        forwardVoltage: '2.2V',
        forwardCurrent: '20mA',
        wavelength: '630nm',
        viewingAngle: '30°'
      },
      pinout: {
        anode: '+',
        cathode: '-'
      },
      library: 'basic'
    },
    {
      name: 'Push Button',
      type: 'input',
      category: 'sensor',
      description: 'Momentary push button switch',
      properties: {
        contactRating: '50mA @ 24VDC',
        operatingForce: '1.6N',
        travel: '0.3mm',
        lifespan: '100,000 cycles'
      },
      pinout: {
        common: 'C',
        normallyOpen: 'NO',
        normallyClosed: 'NC'
      },
      library: 'basic'
    },
    {
      name: 'DHT11 Sensor',
      type: 'sensor',
      category: 'environmental',
      description: 'Temperature and humidity sensor',
      properties: {
        temperatureRange: '-40°C to 80°C',
        humidityRange: '0-100% RH',
        accuracy: '±2°C, ±5% RH',
        samplingRate: '1Hz'
      },
      pinout: {
        vcc: '+5V',
        gnd: 'GND',
        data: 'Digital Pin'
      },
      library: 'sensors'
    },
    {
      name: 'Servo Motor',
      type: 'actuator',
      category: 'motor',
      description: 'RC servo motor for precise angular control',
      properties: {
        torque: '2.5kg/cm',
        speed: '0.1s/60°',
        voltage: '4.8-6V',
        angle: '180°'
      },
      pinout: {
        signal: 'PWM Pin',
        vcc: '+5V',
        gnd: 'GND'
      },
      library: 'motors'
    }
  ],

  projects: [
    {
      name: 'LED Blinker',
      description: 'Simple LED blinking project to get started with Arduino',
      boardType: 'arduino-uno',
      codeLanguage: 'cpp',
      code: `const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
}`,
      circuitData: {
        components: [
          {
            id: 'arduino-1',
            type: 'arduino-uno',
            name: 'Arduino Uno',
            x: 100,
            y: 100,
            rotation: 0
          },
          {
            id: 'led-1',
            type: 'led',
            name: 'LED',
            x: 300,
            y: 150,
            rotation: 0
          }
        ],
        connections: [
          {
            id: 'conn-1',
            from: { componentId: 'arduino-1', pin: '13' },
            to: { componentId: 'led-1', pin: 'anode' }
          },
          {
            id: 'conn-2',
            from: { componentId: 'arduino-1', pin: 'GND' },
            to: { componentId: 'led-1', pin: 'cathode' }
          }
        ]
      },
      status: 'completed',
      tags: ['beginner', 'led', 'blink']
    },
    {
      name: 'Button Controlled LED',
      description: 'Control an LED with a push button',
      boardType: 'arduino-uno',
      codeLanguage: 'cpp',
      code: `const int buttonPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(buttonPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(buttonPin);

  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`,
      circuitData: {
        components: [
          {
            id: 'arduino-1',
            type: 'arduino-uno',
            name: 'Arduino Uno',
            x: 100,
            y: 100,
            rotation: 0
          },
          {
            id: 'button-1',
            type: 'push-button',
            name: 'Push Button',
            x: 200,
            y: 50,
            rotation: 0
          },
          {
            id: 'led-1',
            type: 'led',
            name: 'LED',
            x: 350,
            y: 150,
            rotation: 0
          }
        ],
        connections: [
          {
            id: 'conn-1',
            from: { componentId: 'arduino-1', pin: '2' },
            to: { componentId: 'button-1', pin: 'NO' }
          },
          {
            id: 'conn-2',
            from: { componentId: 'arduino-1', pin: '13' },
            to: { componentId: 'led-1', pin: 'anode' }
          },
          {
            id: 'conn-3',
            from: { componentId: 'arduino-1', pin: 'GND' },
            to: { componentId: 'button-1', pin: 'C' }
          },
          {
            id: 'conn-4',
            from: { componentId: 'arduino-1', pin: 'GND' },
            to: { componentId: 'led-1', pin: 'cathode' }
          }
        ]
      },
      status: 'completed',
      tags: ['intermediate', 'button', 'input', 'led']
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/embedded';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Component.deleteMany({});

    // Seed users
    console.log('👥 Seeding users...');
    const createdUsers = [];
    for (const userData of seedData.users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`  ✓ Created user: ${user.username}`);
    }

    // Seed components
    console.log('🔧 Seeding components...');
    for (const componentData of seedData.components) {
      const component = new Component(componentData);
      await component.save();
      console.log(`  ✓ Created component: ${component.name}`);
    }

    // Seed projects (assign to first user)
    console.log('📁 Seeding projects...');
    const demoUser = createdUsers[0];
    for (const projectData of seedData.projects) {
      const project = new Project({
        ...projectData,
        user: demoUser._id
      });
      await project.save();
      console.log(`  ✓ Created project: ${project.name}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Seeding Summary:');
    console.log(`  👥 Users: ${seedData.users.length}`);
    console.log(`  🔧 Components: ${seedData.components.length}`);
    console.log(`  📁 Projects: ${seedData.projects.length}`);
    console.log('');
    console.log('🚀 You can now start the application and login with:');
    console.log('  📧 Email: demo@example.com');
    console.log('  🔑 Password: demo123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedData };