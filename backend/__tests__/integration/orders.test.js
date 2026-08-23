// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Integration tests for order endpoints.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

let mongoServer, app, server, Order;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  delete mongoose.connection.models['Order'];
  Order = require('../../models/Order');

  app = express();
  app.use(express.json());

  const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret', { algorithms: ['HS256'] });
      next();
    } catch {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  // POST /api/orders — create order
  app.post('/api/orders', async (req, res) => {
    try {
      const order = await Order.create(req.body);
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // GET /api/orders/:id
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: 'Invalid ID format' });
    }
  });

  // GET /api/orders — list orders (admin)
  app.get('/api/orders', auth, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      const total = await Order.countDocuments(filter);
      const orders = await Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
      res.json({ orders, total });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // PUT /api/orders/:id/status — update order status
  app.put('/api/orders/:id/status', auth, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
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
  await Order.deleteMany({});
});

const request = require('supertest');

const adminToken = jwt.sign(
  { id: 'admin1', email: 'admin@test.com', role: 'SUPER_ADMIN' },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
);

const sampleOrder = {
  customer: { name: 'John Doe', phone: '+254700000000', email: 'john@test.com' },
  items: [{ name: 'Laptop', price: 45000, quantity: 1, subtotal: 45000 }],
  subtotal: 45000,
  total: 45000,
};

describe('POST /api/orders', () => {
  test('creates an order and auto-generates orderNumber', async () => {
    const res = await request(app).post('/api/orders').send(sampleOrder);
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^RTS-\d{4}-\d{5}$/);
    expect(res.body.status).toBe('pending');
    expect(res.body.paymentStatus).toBe('unpaid');
  });

  test('rejects order without customer', async () => {
    const res = await request(app).post('/api/orders').send({ subtotal: 0, total: 0, items: [] });
    expect(res.status).toBe(400);
  });

  test('accepts order with empty items (schema allows it)', async () => {
    const res = await request(app).post('/api/orders').send({
      customer: { name: 'X', phone: '123' },
      items: [],
      subtotal: 0,
      total: 0,
    });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/orders/:id', () => {
  test('returns order by ID', async () => {
    const order = await Order.create(sampleOrder);
    const res = await request(app).get(`/api/orders/${order._id}`);
    expect(res.status).toBe(200);
    expect(res.body.customer.name).toBe('John Doe');
  });

  test('returns 404 for non-existent order', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/orders/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders (admin list)', () => {
  test('returns paginated orders with auth', async () => {
    await Order.create(sampleOrder);
    await Order.create({ ...sampleOrder, customer: { name: 'Jane', phone: '+254711111111' } });
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBe(2);
    expect(res.body.total).toBe(2);
  });

  test('rejects without auth', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  test('filters by status', async () => {
    await Order.create(sampleOrder);
    await Order.create({ ...sampleOrder, status: 'delivered' });
    const res = await request(app)
      .get('/api/orders?status=delivered')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.orders.length).toBe(1);
    expect(res.body.orders[0].status).toBe('delivered');
  });
});

describe('PUT /api/orders/:id/status', () => {
  test('updates order status', async () => {
    const order = await Order.create(sampleOrder);
    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  test('rejects invalid status', async () => {
    const order = await Order.create(sampleOrder);
    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent order', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/orders/${fakeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
  });
});
