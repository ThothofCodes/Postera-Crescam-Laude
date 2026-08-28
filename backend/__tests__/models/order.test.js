// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for Order model — validation, auto-orderNumber, status transitions.

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

let Order;
beforeAll(() => {
  delete mongoose.connection.models.Order;
  Order = require('../../models/Order');
});

afterEach(async () => {
  await Order.deleteMany({});
});

describe('Order model', () => {
  const validOrder = {
    customer: { name: 'John Doe', phone: '+254700000000' },
    items: [
      {
        name: 'Laptop', price: 45000, quantity: 1, subtotal: 45000,
      },
    ],
    subtotal: 45000,
    total: 45000,
  };

  test('creates a valid order', async () => {
    const order = await Order.create(validOrder);
    expect(order._id).toBeDefined();
    expect(order.customer.name).toBe('John Doe');
    expect(order.total).toBe(45000);
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('unpaid');
  });

  test('auto-generates orderNumber with RTS prefix', async () => {
    const order = await Order.create(validOrder);
    expect(order.orderNumber).toMatch(/^RTS-\d{4}-\d{5}$/);
  });

  test('orderNumber increments across orders', async () => {
    const order1 = await Order.create(validOrder);
    const order2 = await Order.create({ ...validOrder, customer: { name: 'Jane', phone: '+254711111111' } });
    expect(order2.orderNumber).not.toBe(order1.orderNumber);
  });

  test('requires customer.name', async () => {
    await expect(Order.create({ ...validOrder, customer: { phone: '+254700000000' } }))
      .rejects.toThrow();
  });

  test('requires customer.phone', async () => {
    await expect(Order.create({ ...validOrder, customer: { name: 'John' } }))
      .rejects.toThrow();
  });

  test('allows empty items array (schema does not enforce min items)', async () => {
    const order = await Order.create({ ...validOrder, items: [] });
    expect(order.items).toEqual([]);
  });

  test('requires subtotal and total', async () => {
    await expect(Order.create({ ...validOrder, subtotal: undefined, total: undefined }))
      .rejects.toThrow();
  });

  test('rejects invalid status', async () => {
    await expect(Order.create({ ...validOrder, status: 'invalid_status' }))
      .rejects.toThrow();
  });

  test('accepts all valid statuses', async () => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const order = await Order.create({ ...validOrder, status });
      expect(order.status).toBe(status);
    }
  });

  test('rejects invalid paymentStatus', async () => {
    await expect(Order.create({ ...validOrder, paymentStatus: 'invalid' }))
      .rejects.toThrow();
  });

  test('accepts all valid payment statuses', async () => {
    const statuses = ['unpaid', 'paid', 'refunded'];
    for (const ps of statuses) {
      const order = await Order.create({ ...validOrder, paymentStatus: ps });
      expect(order.paymentStatus).toBe(ps);
    }
  });

  test('sets default values', async () => {
    const order = await Order.create(validOrder);
    expect(order.deliveryFee).toBe(0);
    expect(order.deliveryType).toBe('pickup');
    expect(order.department).toBeNull();
  });

  test('has timestamps', async () => {
    const order = await Order.create(validOrder);
    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
  });
});
