// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for Product model — field validation, slug generation, price/stock constraints.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

let Product;
beforeAll(() => {
  delete mongoose.connection.models.Product;
  Product = require('../../models/Product');
});

afterEach(async () => {
  await Product.deleteMany({});
});

describe('Product model', () => {
  const validProduct = {
    name: 'Test Laptop',
    category: 'electronics',
    description: 'A high-performance laptop for testing.',
    price: 45000,
    stock: 10,
  };

  test('creates a valid product', async () => {
    const product = await Product.create(validProduct);
    expect(product._id).toBeDefined();
    expect(product.name).toBe('Test Laptop');
    expect(product.price).toBe(45000);
    expect(product.stock).toBe(10);
    expect(product.isActive).toBe(true);
  });

  test('generates slug from name on save', async () => {
    const product = await Product.create(validProduct);
    expect(product.slug).toBe('test-laptop');
  });

  test('updates slug when name changes', async () => {
    const product = await Product.create(validProduct);
    product.name = 'Gaming Laptop Pro';
    await product.save();
    expect(product.slug).toBe('gaming-laptop-pro');
  });

  test('requires name', async () => {
    await expect(Product.create({ category: 'electronics', description: 'x', price: 100 }))
      .rejects.toThrow(/name.*required/i);
  });

  test('requires category', async () => {
    await expect(Product.create({ name: 'X', description: 'x', price: 100 }))
      .rejects.toThrow(/category.*required/i);
  });

  test('requires description', async () => {
    await expect(Product.create({ name: 'X', category: 'electronics', price: 100 }))
      .rejects.toThrow(/description.*required/i);
  });

  test('requires price', async () => {
    await expect(Product.create({ name: 'X', category: 'electronics', description: 'x' }))
      .rejects.toThrow(/price.*required/i);
  });

  test('rejects negative price', async () => {
    await expect(Product.create({ ...validProduct, price: -100 }))
      .rejects.toThrow();
  });

  test('rejects invalid category', async () => {
    await expect(Product.create({ ...validProduct, category: 'invalid' }))
      .rejects.toThrow();
  });

  test('accepts all valid categories', async () => {
    const categories = ['electronics', 'accessories', 'software', 'services'];
    for (const cat of categories) {
      const p = await Product.create({ ...validProduct, name: `${cat} item`, category: cat });
      expect(p.category).toBe(cat);
    }
  });

  test('rejects negative stock', async () => {
    await expect(Product.create({ ...validProduct, stock: -5 }))
      .rejects.toThrow();
  });

  test('sets default values', async () => {
    const product = await Product.create(validProduct);
    expect(product.isDigital).toBe(false);
    expect(product.isActive).toBe(true);
    expect(product.featured).toBe(false);
    expect(product.tags).toEqual([]);
    expect(product.images).toEqual([]);
    expect(product.rating).toBe(0);
    expect(product.reviewCount).toBe(0);
    expect(product.soldCount).toBe(0);
  });

  test('enforces name maxlength of 120', async () => {
    const longName = 'A'.repeat(121);
    await expect(Product.create({ ...validProduct, name: longName }))
      .rejects.toThrow();
  });

  test('enforces description maxlength of 2000', async () => {
    const longDesc = 'A'.repeat(2001);
    await expect(Product.create({ ...validProduct, description: longDesc }))
      .rejects.toThrow();
  });
});
