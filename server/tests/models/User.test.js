/**
 * User Model Tests
 * Unit tests for User model functionality
 */

const User = require('../../models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const user = new User(userData);
      await user.save();

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const password = 'password123';
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password,
        name: 'Test User'
      });

      await user.save();

      // Password should be hashed
      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await new User(userData).save();

      await expect(new User(userData).save()).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User 1'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password456',
        name: 'Test User 2'
      };

      await new User(userData1).save();

      await expect(new User(userData2).save()).rejects.toThrow();
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      await expect(new User(userData).save()).rejects.toThrow();
    });

    it('should fail with short username', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await expect(new User(userData).save()).rejects.toThrow();
    });

    it('should fail with invalid username characters', async () => {
      const userData = {
        username: 'test@user',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await expect(new User(userData).save()).rejects.toThrow();
    });
  });

  describe('Password Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await user.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should generate password reset token', async () => {
      const resetToken = user.getResetPasswordToken();

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(resetToken.length).toBe(40); // 20 bytes * 2 hex chars
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
      expect(user.passwordResetExpires).toBeInstanceOf(Date);
    });

    it('should generate email verification token', async () => {
      const verificationToken = user.getEmailVerificationToken();

      expect(verificationToken).toBeDefined();
      expect(typeof verificationToken).toBe('string');
      expect(verificationToken.length).toBe(40);
      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationExpires).toBeDefined();
      expect(user.emailVerificationExpires).toBeInstanceOf(Date);
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate profile completion percentage', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      await user.save();

      // Base completion (name field)
      expect(user.profileCompletion).toBe(20);

      // Update user with more fields
      user.bio = 'Test bio';
      user.website = 'https://example.com';
      user.location = 'Test City';
      user.avatar = 'avatar.jpg';
      await user.save();

      expect(user.profileCompletion).toBe(100);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      await new User({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1',
        role: 'user',
        isActive: true,
        emailVerified: true
      }).save();

      await new User({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
        role: 'admin',
        isActive: true,
        emailVerified: false
      }).save();

      await new User({
        username: 'user3',
        email: 'user3@example.com',
        password: 'password123',
        name: 'User 3',
        role: 'user',
        isActive: false,
        emailVerified: true
      }).save();
    });

    it('should find user by email or username', async () => {
      const userByEmail = await User.findByEmailOrUsername('user1@example.com');
      const userByUsername = await User.findByEmailOrUsername('user1');

      expect(userByEmail.username).toBe('user1');
      expect(userByUsername.email).toBe('user1@example.com');
    });

    it('should get user statistics', async () => {
      const stats = await User.getUserStats();

      expect(stats.totalUsers).toBe(3);
      expect(stats.activeUsers).toBe(2);
      expect(stats.verifiedUsers).toBe(2);
      expect(stats.adminUsers).toBe(1);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      await user.save();
    });

    it('should update timestamps on save', async () => {
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      user.name = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});