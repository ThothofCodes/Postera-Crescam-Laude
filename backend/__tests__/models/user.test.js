// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for User model — field validation, password hashing, role enum.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// We need to import the model after connection is established
let User;
beforeAll(() => {
  // Clear any cached model to avoid OverwriteModelError
  delete mongoose.connection.models.User;
  User = require('../../models/User');
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('User model', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'STAFF',
  };

  test('creates a valid user', async () => {
    const user = await User.create(validUser);
    expect(user._id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('STAFF');
    expect(user.isActive).toBe(true);
  });

  test('lowercases email on save', async () => {
    const user = await User.create({ ...validUser, email: 'UPPER@TEST.COM' });
    expect(user.email).toBe('upper@test.com');
  });

  test('requires name field', async () => {
    await expect(User.create({ email: 'x@x.com', password: 'pass123' }))
      .rejects.toThrow(/name.*required/i);
  });

  test('requires email field', async () => {
    await expect(User.create({ name: 'No Email', password: 'pass123' }))
      .rejects.toThrow(/email.*required/i);
  });

  test('requires password field', async () => {
    await expect(User.create({ name: 'No Pass', email: 'nopass@test.com' }))
      .rejects.toThrow(/password.*required/i);
  });

  test('enforces unique email', async () => {
    await User.create(validUser);
    await expect(User.create({ ...validUser, name: 'Duplicate' }))
      .rejects.toThrow();
  });

  test('rejects invalid role enum', async () => {
    await expect(User.create({ ...validUser, role: 'INVALID_ROLE' }))
      .rejects.toThrow();
  });

  test('accepts all valid roles', async () => {
    const roles = ['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'admin', 'staff'];
    for (let i = 0; i < roles.length; i++) {
      const user = await User.create({ ...validUser, email: `role${i}@test.com`, role: roles[i] });
      expect(user.role).toBe(roles[i]);
    }
  });

  test('hashes password on save (pre-save hook)', async () => {
    const user = await User.create(validUser);
    // password should not be plain text
    expect(user.password).not.toBe('password123');
    expect(user.password.length).toBeGreaterThan(20); // bcrypt hash is 60 chars
  });

  test('does not re-hash password if not modified', async () => {
    const user = await User.create(validUser);
    const hashedPw = user.password;
    user.name = 'Updated Name';
    await user.save();
    expect(user.password).toBe(hashedPw); // unchanged
  });

  test('matchPassword returns true for correct password', async () => {
    const user = await User.create(validUser);
    const match = await user.matchPassword('password123');
    expect(match).toBe(true);
  });

  test('matchPassword returns false for incorrect password', async () => {
    const user = await User.create(validUser);
    const match = await user.matchPassword('wrongpassword');
    expect(match).toBe(false);
  });

  test('password is excluded by default (select: false)', async () => {
    await User.create(validUser);
    const found = await User.findOne({ email: validUser.email });
    expect(found.password).toBeUndefined();
  });

  test('password can be explicitly selected', async () => {
    await User.create(validUser);
    const found = await User.findOne({ email: validUser.email }).select('+password');
    expect(found.password).toBeDefined();
  });

  test('sets default values correctly', async () => {
    const user = await User.create(validUser);
    expect(user.department).toBeNull();
    expect(user.departmentSlug).toBeNull();
    expect(user.isOwner).toBe(false);
    expect(user.superAdminLocked).toBe(false);
    expect(user.isActive).toBe(true);
    expect(user.isEmailVerified).toBe(false);
  });

  test('has timestamps (createdAt, updatedAt)', async () => {
    const user = await User.create(validUser);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });
});
