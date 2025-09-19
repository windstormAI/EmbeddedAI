/**
 * Project Model Tests
 * Unit tests for Project model functionality
 */

const Project = require('../../models/Project');
const User = require('../../models/User');

describe('Project Model', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for project ownership
    testUser = await global.testUtils.createTestUser();
  });

  describe('Project Creation', () => {
    it('should create a project with valid data', async () => {
      const projectData = {
        user: testUser._id,
        name: 'Test Project',
        description: 'A test project description',
        boardType: 'arduino-uno',
        codeLanguage: 'cpp',
        code: 'void setup() {} void loop() {}',
        tags: ['arduino', 'led'],
        category: 'basic',
        difficulty: 'beginner'
      };

      const project = new Project(projectData);
      await project.save();

      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.boardType).toBe(projectData.boardType);
      expect(project.codeLanguage).toBe(projectData.codeLanguage);
      expect(project.code).toBe(projectData.code);
      expect(project.tags).toEqual(projectData.tags);
      expect(project.category).toBe(projectData.category);
      expect(project.difficulty).toBe(projectData.difficulty);
      expect(project.version).toBe(1);
      expect(project.status).toBe('draft');
      expect(project.isPublic).toBe(false);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should set default values correctly', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'Test Project'
      });
      await project.save();

      expect(project.description).toBe('');
      expect(project.boardType).toBe('arduino-uno');
      expect(project.codeLanguage).toBe('cpp');
      expect(project.code).toBe('');
      expect(project.tags).toEqual([]);
      expect(project.category).toBe('basic');
      expect(project.difficulty).toBe('beginner');
      expect(project.version).toBe(1);
      expect(project.status).toBe('draft');
      expect(project.isPublic).toBe(false);
    });

    it('should fail with invalid board type', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'Test Project',
        boardType: 'invalid-board'
      });

      await expect(project.save()).rejects.toThrow();
    });

    it('should fail without required user field', async () => {
      const project = new Project({
        name: 'Test Project'
      });

      await expect(project.save()).rejects.toThrow();
    });

    it('should fail with name too long', async () => {
      const longName = 'a'.repeat(101);
      const project = new Project({
        user: testUser._id,
        name: longName
      });

      await expect(project.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    it('should generate correct slug', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'My Awesome Project!'
      });
      await project.save();

      expect(project.slug).toBe('my-awesome-project');
    });

    it('should calculate completion percentage', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'Test Project'
      });
      await project.save();

      // Base completion (name field)
      expect(project.completionPercentage).toBe(20);

      // Update with more fields
      project.description = 'Test description';
      project.code = 'void setup() {} void loop() {}';
      project.circuitData = { components: [{ id: 'comp1', type: 'led' }] };
      project.status = 'completed';
      await project.save();

      expect(project.completionPercentage).toBe(100);
    });

    it('should calculate estimated completion time', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'Test Project',
        code: 'a'.repeat(2000), // Long code
        circuitData: {
          components: [
            { id: '1', type: 'led' },
            { id: '2', type: 'button' },
            { id: '3', type: 'arduino-uno' }
          ]
        }
      });
      await project.save();

      const estimatedTime = project.estimatedCompletionTime;
      expect(estimatedTime).toBeGreaterThan(30); // Base time
      expect(typeof estimatedTime).toBe('number');
    });
  });

  describe('Instance Methods', () => {
    let project;

    beforeEach(async () => {
      project = await global.testUtils.createTestProject(testUser._id);
    });

    it('should fork project correctly', async () => {
      const newUser = await global.testUtils.createTestUser({
        username: 'newuser',
        email: 'new@example.com'
      });

      const forkedProject = project.fork(newUser._id);

      expect(forkedProject.user.toString()).toBe(newUser._id.toString());
      expect(forkedProject.name).toBe(`${project.name} (Fork)`);
      expect(forkedProject.description).toBe(project.description);
      expect(forkedProject.forkedFrom.toString()).toBe(project._id.toString());
    });

    it('should add collaborator correctly', async () => {
      const collaborator = await global.testUtils.createTestUser({
        username: 'collaborator',
        email: 'collab@example.com'
      });

      await project.addCollaborator(collaborator._id, 'editor');

      expect(project.collaborators).toHaveLength(1);
      expect(project.collaborators[0].user.toString()).toBe(collaborator._id.toString());
      expect(project.collaborators[0].role).toBe('editor');
    });

    it('should update existing collaborator role', async () => {
      const collaborator = await global.testUtils.createTestUser({
        username: 'collaborator',
        email: 'collab@example.com'
      });

      await project.addCollaborator(collaborator._id, 'viewer');
      await project.addCollaborator(collaborator._id, 'admin');

      expect(project.collaborators).toHaveLength(1);
      expect(project.collaborators[0].role).toBe('admin');
    });

    it('should remove collaborator correctly', async () => {
      const collaborator = await global.testUtils.createTestUser({
        username: 'collaborator',
        email: 'collab@example.com'
      });

      await project.addCollaborator(collaborator._id, 'editor');
      expect(project.collaborators).toHaveLength(1);

      await project.removeCollaborator(collaborator._id);
      expect(project.collaborators).toHaveLength(0);
    });

    it('should check user edit permissions correctly', async () => {
      const collaborator = await global.testUtils.createTestUser({
        username: 'collaborator',
        email: 'collab@example.com'
      });

      // Owner should always have edit access
      expect(project.canUserEdit(testUser._id)).toBe(true);

      // Non-collaborator should not have edit access
      expect(project.canUserEdit(collaborator._id)).toBe(false);

      // Add as editor
      await project.addCollaborator(collaborator._id, 'editor');
      expect(project.canUserEdit(collaborator._id)).toBe(true);

      // Add as admin
      await project.addCollaborator(collaborator._id, 'admin');
      expect(project.canUserEdit(collaborator._id)).toBe(true);

      // Viewer should not have edit access
      await project.addCollaborator(collaborator._id, 'viewer');
      expect(project.canUserEdit(collaborator._id)).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test projects
      await global.testUtils.createTestProject(testUser._id, {
        name: 'Public Project 1',
        isPublic: true,
        status: 'completed'
      });

      await global.testUtils.createTestProject(testUser._id, {
        name: 'Public Project 2',
        isPublic: true,
        status: 'in-progress'
      });

      await global.testUtils.createTestProject(testUser._id, {
        name: 'Private Project',
        isPublic: false,
        status: 'draft'
      });
    });

    it('should get public projects correctly', async () => {
      const publicProjects = await Project.getPublicProjects();

      expect(publicProjects).toHaveLength(2);
      expect(publicProjects[0].name).toMatch(/Public Project/);
      expect(publicProjects[0].isPublic).toBe(true);
    });

    it('should get project statistics correctly', async () => {
      const stats = await Project.getProjectStats();

      expect(stats.totalProjects).toBe(3);
      expect(stats.publicProjects).toBe(2);
      expect(stats.completedProjects).toBe(1);
      expect(typeof stats.totalViews).toBe('number');
      expect(typeof stats.totalLikes).toBe('number');
      expect(typeof stats.totalForks).toBe('number');
    });
  });

  describe('Version Control', () => {
    it('should increment version on updates', async () => {
      const project = await global.testUtils.createTestProject(testUser._id);
      expect(project.version).toBe(1);

      project.name = 'Updated Name';
      await project.save();
      expect(project.version).toBe(2);

      project.description = 'Updated description';
      await project.save();
      expect(project.version).toBe(3);
    });

    it('should not increment version for new documents', async () => {
      const project = new Project({
        user: testUser._id,
        name: 'New Project'
      });

      expect(project.version).toBe(1);
      await project.save();
      expect(project.version).toBe(1);
    });
  });

  describe('Circuit Data Validation', () => {
    it('should validate circuit data structure', async () => {
      const validCircuitData = {
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

      const project = new Project({
        user: testUser._id,
        name: 'Circuit Project',
        circuitData: validCircuitData
      });

      await project.save();
      expect(project.circuitData.components).toHaveLength(1);
      expect(project.circuitData.components[0].id).toBe('led1');
    });
  });
});