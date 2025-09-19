/**
 * Projects Routes Integration Tests
 * Tests for project CRUD operations
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import routes and middleware
const projectRoutes = require('../../routes/projects');
const { protect } = require('../../middleware/auth');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware for tests
app.use((req, res, next) => {
  // Create a mock user for testing
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser',
    email: 'test@example.com',
    role: 'user'
  };
  next();
});

app.use('/api/projects', projectRoutes);

describe('Projects Routes', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user and get auth token
    testUser = await global.testUtils.createTestUser();
    authToken = global.testUtils.generateTestToken(testUser._id);
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create some test projects
      await global.testUtils.createTestProject(testUser._id, {
        name: 'Project 1',
        description: 'First test project'
      });
      await global.testUtils.createTestProject(testUser._id, {
        name: 'Project 2',
        description: 'Second test project'
      });
    });

    it('should get all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.projects[0]).toHaveProperty('name');
      expect(response.body.data.projects[0]).toHaveProperty('description');
      expect(response.body.data.projects[0]).toHaveProperty('createdAt');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.total).toBe(2);
    });

    it('should return empty array when no projects exist', async () => {
      // Clear all projects
      await mongoose.connection.db.collection('projects').deleteMany({});

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'New Test Project',
        description: 'A new project for testing',
        boardType: 'arduino-uno',
        tags: ['arduino', 'test'],
        category: 'basic',
        difficulty: 'beginner'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(projectData.name);
      expect(response.body.data.project.description).toBe(projectData.description);
      expect(response.body.data.project.boardType).toBe(projectData.boardType);
      expect(response.body.data.project.tags).toEqual(projectData.tags);
      expect(response.body.data.project.version).toBe(1);
      expect(response.body.data.project.status).toBe('draft');
      expect(response.body.data.project.isPublic).toBe(false);
    });

    it('should create project with default values', async () => {
      const projectData = {
        name: 'Minimal Project'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(projectData.name);
      expect(response.body.data.project.description).toBe('');
      expect(response.body.data.project.boardType).toBe('arduino-uno');
      expect(response.body.data.project.codeLanguage).toBe('cpp');
      expect(response.body.data.project.tags).toEqual([]);
    });

    it('should fail with invalid board type', async () => {
      const projectData = {
        name: 'Invalid Project',
        boardType: 'invalid-board'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with missing name', async () => {
      const projectData = {
        description: 'Project without name'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with name too long', async () => {
      const projectData = {
        name: 'a'.repeat(101), // Exceeds 100 character limit
        description: 'Project with too long name'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await global.testUtils.createTestProject(testUser._id, {
        name: 'Test Project Details',
        description: 'Project for detail testing'
      });
    });

    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(testProject.name);
      expect(response.body.data.project.description).toBe(testProject.description);
      expect(response.body.data.project._id).toBe(testProject._id.toString());
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });

    it('should fail with non-existent project ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await global.testUtils.createTestProject(testUser._id);
    });

    it('should update project successfully', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
        tags: ['updated', 'test'],
        isPublic: true
      };

      const response = await request(app)
        .put(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(updateData.name);
      expect(response.body.data.project.description).toBe(updateData.description);
      expect(response.body.data.project.tags).toEqual(updateData.tags);
      expect(response.body.data.project.isPublic).toBe(updateData.isPublic);
      expect(response.body.data.project.version).toBe(2); // Version incremented
    });

    it('should update circuit data', async () => {
      const circuitData = {
        components: [
          {
            id: 'led1',
            type: 'led',
            name: 'LED',
            x: 100,
            y: 100,
            rotation: 0,
            properties: {},
            connections: []
          }
        ],
        connections: [],
        metadata: {
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
          backgroundColor: '#ffffff'
        }
      };

      const response = await request(app)
        .put(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ circuitData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.circuitData.components).toHaveLength(1);
      expect(response.body.data.project.circuitData.components[0].id).toBe('led1');
    });

    it('should update code', async () => {
      const newCode = `// Updated Arduino code
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

      const response = await request(app)
        .put(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: newCode })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.code).toBe(newCode);
      expect(response.body.data.project.version).toBe(2);
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .put('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await global.testUtils.createTestProject(testUser._id);
    });

    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      const deletedProject = await mongoose.connection.db
        .collection('projects')
        .findOne({ _id: testProject._id });

      expect(deletedProject).toBeNull();
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .delete('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });

    it('should fail with non-existent project ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('POST /api/projects/:id/duplicate', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await global.testUtils.createTestProject(testUser._id, {
        name: 'Original Project',
        description: 'Project to be duplicated'
      });
    });

    it('should duplicate project successfully', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(`${testProject.name} (Copy)`);
      expect(response.body.data.project.description).toBe(testProject.description);
      expect(response.body.data.project.version).toBe(1); // Reset version for copy
      expect(response.body.data.project._id).not.toBe(testProject._id.toString());
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .post('/api/projects/invalid-id/duplicate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('POST /api/projects/:id/share', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await global.testUtils.createTestProject(testUser._id, {
        name: 'Shareable Project',
        isPublic: false
      });
    });

    it('should share project publicly', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.isPublic).toBe(true);
      expect(response.body.data.shareUrl).toContain(testProject._id.toString());
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .post('/api/projects/invalid-id/share')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('GET /api/projects/public/:id', () => {
    let publicProject;
    let privateProject;

    beforeEach(async () => {
      publicProject = await global.testUtils.createTestProject(testUser._id, {
        name: 'Public Project',
        isPublic: true
      });

      privateProject = await global.testUtils.createTestProject(testUser._id, {
        name: 'Private Project',
        isPublic: false
      });
    });

    it('should get public project without authentication', async () => {
      const response = await request(app)
        .get(`/api/projects/public/${publicProject._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(publicProject.name);
      expect(response.body.data.project.isPublic).toBe(true);
    });

    it('should fail to get private project', async () => {
      const response = await request(app)
        .get(`/api/projects/public/${privateProject._id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Public project not found');
    });

    it('should fail with invalid project ID', async () => {
      const response = await request(app)
        .get('/api/projects/public/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });
});