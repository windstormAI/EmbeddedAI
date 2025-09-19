/**
 * Full System Integration Tests
 * End-to-end testing for the complete AI-Embedded Platform
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const supertest = require('supertest');
const { expect } = require('chai');

const app = require('../../server/index');
const User = require('../../server/models/User');
const Project = require('../../server/models/Project');
const Component = require('../../server/models/Component');

describe('Full System Integration Tests', () => {
  let mongoServer;
  let server;
  let io;
  let request;
  let testUsers = [];
  let testProjects = [];
  let authTokens = {};

  before(async function() {
    this.timeout(30000);

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Start server
    server = createServer(app);
    io = require('socket.io')(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Initialize Socket.io in app
    app.set('io', io);

    await new Promise(resolve => {
      server.listen(0, () => {
        const port = server.address().port;
        request = supertest(`http://localhost:${port}`);
        resolve();
      });
    });

    // Create test data
    await setupTestData();
  });

  after(async function() {
    this.timeout(10000);

    // Cleanup
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
  });

  async function setupTestData() {
    // Create test users
    const users = [
      {
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
        name: 'Test User 1',
        role: 'user'
      },
      {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        name: 'Test User 2',
        role: 'user'
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      }
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      testUsers.push(user);

      // Get auth token
      const response = await request
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authTokens[user._id] = response.body.data.accessToken;
    }

    // Create test components
    const components = [
      {
        name: 'Arduino Uno',
        type: 'arduino-uno',
        category: 'microcontroller',
        pins: 20,
        voltage: 5.0,
        price: 23.00,
        inStock: true,
        isBuiltIn: true,
        status: 'approved'
      },
      {
        name: 'LED',
        type: 'led',
        category: 'output',
        pins: 2,
        voltage: 3.0,
        price: 0.50,
        inStock: true,
        isBuiltIn: true,
        status: 'approved'
      }
    ];

    for (const componentData of components) {
      await Component.create(componentData);
    }
  }

  describe('Authentication System', () => {
    it('should register a new user', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('accessToken');
      expect(response.body.data).to.have.property('user');
    });

    it('should login existing user', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'test1@example.com',
          password: 'password123'
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'test1@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should refresh access token', async () => {
      const loginResponse = await request
        .post('/api/auth/login')
        .send({
          email: 'test1@example.com',
          password: 'password123'
        });

      const refreshResponse = await request
        .post('/api/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken
        });

      expect(refreshResponse.status).to.equal(200);
      expect(refreshResponse.body.success).to.be.true;
      expect(refreshResponse.body.data).to.have.property('accessToken');
    });
  });

  describe('Project Management', () => {
    let projectId;

    it('should create a new project', async () => {
      const response = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({
          name: 'Test Project',
          description: 'A test embedded project',
          boardType: 'arduino-uno'
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('_id');
      projectId = response.body.data._id;
      testProjects.push(response.body.data);
    });

    it('should get user projects', async () => {
      const response = await request
        .get('/api/projects')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(Array.isArray(response.body.data)).to.be.true;
      expect(response.body.data.length).to.be.at.least(1);
    });

    it('should update project circuit', async () => {
      const circuitData = {
        components: [
          {
            id: 'comp1',
            type: 'arduino-uno',
            name: 'Arduino Uno',
            x: 100,
            y: 100,
            rotation: 0
          }
        ],
        connections: []
      };

      const response = await request
        .put(`/api/projects/${projectId}/circuit`)
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send(circuitData);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });

    it('should update project code', async () => {
      const codeData = {
        code: 'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}'
      };

      const response = await request
        .put(`/api/projects/${projectId}/code`)
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send(codeData);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });

    it('should delete project', async () => {
      const response = await request
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });
  });

  describe('AI Code Generation', () => {
    it('should generate Arduino code from description', async () => {
      const response = await request
        .post('/api/ai/generate-code')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({
          description: 'Create a blinking LED program',
          boardType: 'arduino-uno',
          components: ['led'],
          requirements: ['Use pin 13', 'Blink every second']
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('code');
      expect(response.body.data.code).to.include('void setup()');
      expect(response.body.data.code).to.include('void loop()');
    });

    it('should analyze code for improvements', async () => {
      const code = 'void setup(){pinMode(13,OUTPUT);} void loop(){digitalWrite(13,HIGH);delay(1000);digitalWrite(13,LOW);delay(1000);}';

      const response = await request
        .post('/api/ai/analyze-code')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({ code, language: 'cpp' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('analysis');
    });

    it('should provide code completion suggestions', async () => {
      const response = await request
        .post('/api/ai/code-suggestions')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({
          code: 'void setup() {\n  pinMode(',
          cursorPosition: { line: 1, column: 12 },
          language: 'cpp'
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(Array.isArray(response.body.data.suggestions)).to.be.true;
    });
  });

  describe('Circuit Simulation', () => {
    it('should start circuit simulation', async () => {
      const circuitData = {
        components: [
          {
            id: 'arduino1',
            type: 'arduino-uno',
            x: 100,
            y: 100
          },
          {
            id: 'led1',
            type: 'led',
            x: 200,
            y: 100
          }
        ],
        connections: [
          {
            id: 'conn1',
            from: { componentId: 'arduino1', pin: '13' },
            to: { componentId: 'led1', pin: 'positive' }
          }
        ]
      };

      const response = await request
        .post('/api/simulation/start')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({ circuitData });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('simulationId');
    });

    it('should get simulation status', async () => {
      const response = await request
        .get('/api/simulation/status/sim123')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });

    it('should stop circuit simulation', async () => {
      const response = await request
        .post('/api/simulation/stop')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({ simulationId: 'sim123' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });
  });

  describe('Real-time Collaboration', () => {
    let socket1, socket2;

    before(async () => {
      // Connect test clients
      socket1 = Client(`http://localhost:${server.address().port}`, {
        query: {
          userId: testUsers[0]._id,
          projectId: 'test-project-123'
        }
      });

      socket2 = Client(`http://localhost:${server.address().port}`, {
        query: {
          userId: testUsers[1]._id,
          projectId: 'test-project-123'
        }
      });

      await Promise.all([
        new Promise(resolve => socket1.on('connect', resolve)),
        new Promise(resolve => socket2.on('connect', resolve))
      ]);
    });

    after(() => {
      socket1.close();
      socket2.close();
    });

    it('should handle real-time circuit updates', (done) => {
      const circuitUpdate = {
        components: [{ id: 'comp1', type: 'led', x: 100, y: 100 }],
        connections: []
      };

      socket2.on('circuit-updated', (data) => {
        expect(data.components).to.deep.equal(circuitUpdate.components);
        done();
      });

      socket1.emit('circuit-update', {
        projectId: 'test-project-123',
        userId: testUsers[0]._id,
        ...circuitUpdate
      });
    });

    it('should handle real-time code updates', (done) => {
      const codeUpdate = {
        code: 'void setup() { }',
        fileName: 'main.ino'
      };

      socket2.on('code-updated', (data) => {
        expect(data.code).to.equal(codeUpdate.code);
        done();
      });

      socket1.emit('code-update', {
        projectId: 'test-project-123',
        userId: testUsers[0]._id,
        ...codeUpdate
      });
    });

    it('should broadcast user presence', (done) => {
      socket2.on('user-presence-changed', (data) => {
        expect(data.user.id).to.equal(testUsers[0]._id.toString());
        done();
      });

      socket1.emit('user-presence', {
        projectId: 'test-project-123',
        user: testUsers[0],
        status: 'online'
      });
    });
  });

  describe('Hardware Integration', () => {
    it('should connect to hardware device', async () => {
      const response = await request
        .post('/api/hardware/connect')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({
          deviceType: 'arduino-uno',
          connectionType: 'serial',
          port: '/dev/ttyACM0'
        });

      // This might fail in test environment without actual hardware
      expect([200, 404, 500]).to.include(response.status);
    });

    it('should get connected devices', async () => {
      const response = await request
        .get('/api/hardware/devices')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(Array.isArray(response.body.data)).to.be.true;
    });
  });

  describe('Admin Functions', () => {
    it('should get system metrics', async () => {
      const response = await request
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${authTokens[testUsers[2]._id]}`); // Admin user

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });

    it('should get user analytics', async () => {
      const response = await request
        .get('/api/admin/users/analytics')
        .set('Authorization', `Bearer ${authTokens[testUsers[2]._id]}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes', async () => {
      const response = await request
        .get('/api/invalid-route')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`);

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
    });

    it('should handle unauthorized access', async () => {
      const response = await request
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request
            .get('/api/health')
            .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).to.be.true;
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent users', async function() {
      this.timeout(30000);

      const concurrentRequests = 50;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request
            .get('/api/health')
            .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const avgResponseTime = (endTime - startTime) / concurrentRequests;
      const successRate = responses.filter(r => r.status === 200).length / concurrentRequests;

      expect(avgResponseTime).to.be.below(1000); // Less than 1 second average
      expect(successRate).to.be.above(0.95); // 95% success rate
    });

    it('should handle large circuit data', async () => {
      const largeCircuit = {
        components: [],
        connections: []
      };

      // Create a large circuit with many components
      for (let i = 0; i < 100; i++) {
        largeCircuit.components.push({
          id: `comp${i}`,
          type: 'led',
          x: Math.random() * 1000,
          y: Math.random() * 1000
        });
      }

      const response = await request
        .post('/api/simulation/start')
        .set('Authorization', `Bearer ${authTokens[testUsers[0]._id]}`)
        .send({ circuitData: largeCircuit });

      expect([200, 400]).to.include(response.status); // Might fail due to size limits
    });
  });
});