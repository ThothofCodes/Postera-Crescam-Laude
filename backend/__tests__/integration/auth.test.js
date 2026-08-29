// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Integration tests for auth endpoints using Supertest + MongoDB Memory Server.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

let mongoServer; let app; let server; let
  User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Clear and reimport model
  delete mongoose.connection.models.User;
  User = require('../../models/User');

  // Build minimal Express app with auth routes
  app = express();
  app.use(express.json());

  // POST /api/auth/register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        name, email, password, role,
      } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields required' });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const user = await User.create({
        name, email, password, role: role || 'STAFF',
      });
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
      res.status(201).json({
        token,
        user: {
          id: user._id, name: user.name, email: user.email, role: user.role,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account deactivated' });
      }
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret', { algorithms: ['HS256'] });
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'User not found' });
      res.json({
        id: user._id, name: user.name, email: user.email, role: user.role,
      });
    } catch {
      res.status(401).json({ message: 'Invalid token' });
    }
  });

  server = app.listen(0);
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

const request = require('supertest');

describe('POST /api/auth/register', () => {
  test('registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.role).toBe('STAFF');
  });

  test('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'dup@test.com', password: 'pass123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'dup@test.com', password: 'pass456' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice' });

    expect(res.status).toBe(400);
  });

  test('accepts custom role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin', email: 'admin@test.com', password: 'pass123', role: 'SUPER_ADMIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Test', email: 'login@test.com', password: 'pass123', role: 'STAFF',
    });
  });

  test('returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
  });

  test('rejects deactivated account', async () => {
    await User.findOneAndUpdate({ email: 'login@test.com' }, { isActive: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Me', email: 'me@test.com', password: 'pass123', role: 'STAFF',
    });
    token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  test('returns user data for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@test.com');
    expect(res.body.name).toBe('Me');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
