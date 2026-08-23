// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Integration tests for product CRUD endpoints.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

let mongoServer, app, server, Product;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  delete mongoose.connection.models['Product'];
  Product = require('../../models/Product');

  app = express();
  app.use(express.json());

  // Auth middleware (simplified)
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

  // GET /api/products — public listing
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search, sort, page = 1, limit = 12 } = req.query;
      const filter = { isActive: true };
      if (category && category !== 'all') filter.category = category;
      if (search) filter.name = { $regex: search, $options: 'i' };

      let query = Product.find(filter);
      if (sort === 'price_asc') query = query.sort({ price: 1 });
      else if (sort === 'price_desc') query = query.sort({ price: -1 });
      else if (sort === 'newest') query = query.sort({ createdAt: -1 });

      const total = await Product.countDocuments(filter);
      const products = await query.skip((page - 1) * limit).limit(Number(limit));
      res.json({ products, total, pages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/products/:id
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: 'Invalid ID format' });
    }
  });

  // POST /api/products — admin only
  app.post('/api/products', auth, async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // PUT /api/products/:id — admin only
  app.put('/api/products/:id', auth, async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE /api/products/:id — admin only
  app.delete('/api/products/:id', auth, async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json({ message: 'Deleted' });
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
  await Product.deleteMany({});
});

const request = require('supertest');

const adminToken = jwt.sign(
  { id: 'admin1', email: 'admin@test.com', role: 'SUPER_ADMIN' },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
);

const sampleProduct = {
  name: 'Test Widget',
  category: 'electronics',
  description: 'A test widget for integration testing.',
  price: 1500,
  stock: 50,
};

describe('GET /api/products', () => {
  test('returns empty array when no products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('returns products with pagination metadata', async () => {
    await Product.create(sampleProduct);
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.total).toBe(1);
    expect(res.body.pages).toBe(1);
  });

  test('filters by category', async () => {
    await Product.create(sampleProduct);
    await Product.create({ ...sampleProduct, name: 'Accessory', category: 'accessories' });
    const res = await request(app).get('/api/products?category=electronics');
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].category).toBe('electronics');
  });

  test('searches by name', async () => {
    await Product.create(sampleProduct);
    await Product.create({ ...sampleProduct, name: 'Other Gadget' });
    const res = await request(app).get('/api/products?search=Widget');
    expect(res.body.products.length).toBe(1);
  });
});

describe('GET /api/products/:id', () => {
  test('returns product by ID', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Widget');
  });

  test('returns 404 for non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('returns 400 for invalid ID format', async () => {
    const res = await request(app).get('/api/products/invalid-id');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/products', () => {
  test('creates product with valid token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleProduct);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Widget');
    expect(res.body.slug).toBe('test-widget');
  });

  test('rejects without auth token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send(sampleProduct);

    expect(res.status).toBe(401);
  });

  test('rejects with invalid token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer bad-token')
      .send(sampleProduct);

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/products/:id', () => {
  test('updates product fields', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(2000);
  });

  test('returns 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 2000 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  test('deletes product', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = await Product.findById(product._id);
    expect(found).toBeNull();
  });

  test('returns 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
