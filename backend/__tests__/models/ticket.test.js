// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for Ticket model — SLA deadlines, ticketId generation, priority/status enums.

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

let Ticket;
beforeAll(() => {
  delete mongoose.connection.models.Ticket;
  Ticket = require('../../models/Ticket');
});

afterEach(async () => {
  await Ticket.deleteMany({});
});

describe('Ticket model', () => {
  const deptId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  const validTicket = {
    department: deptId,
    departmentSlug: 'repair',
    raisedBy: userId,
    raisedByRole: 'CLIENT',
    title: 'Laptop not turning on',
    description: 'My laptop screen is black and does not respond to power button.',
  };

  test('creates a valid ticket', async () => {
    const ticket = await Ticket.create(validTicket);
    expect(ticket._id).toBeDefined();
    expect(ticket.title).toBe('Laptop not turning on');
    expect(ticket.status).toBe('OPEN');
    expect(ticket.priority).toBe('MEDIUM');
  });

  test('auto-generates ticketId with department prefix', async () => {
    const ticket = await Ticket.create(validTicket);
    expect(ticket.ticketId).toMatch(/^RTS-REP-TKT-\d{4}$/);
  });

  test('uses correct department prefix in ticketId', async () => {
    const cyberTicket = await Ticket.create({ ...validTicket, departmentSlug: 'cybersecurity' });
    expect(cyberTicket.ticketId).toMatch(/^RTS-CYB-TKT-/);
  });

  test('auto-sets SLA deadline based on priority (default MEDIUM = 48h)', async () => {
    const ticket = await Ticket.create(validTicket);
    expect(ticket.slaDeadline).toBeDefined();
    const diff = ticket.slaDeadline - ticket.createdAt;
    expect(diff).toBeCloseTo(48 * 3600 * 1000, -3); // within 1 second tolerance
  });

  test('SLA deadline for CRITICAL priority is 2 hours', async () => {
    const ticket = await Ticket.create({ ...validTicket, priority: 'CRITICAL' });
    const diff = ticket.slaDeadline - ticket.createdAt;
    expect(diff).toBeCloseTo(2 * 3600 * 1000, -3);
  });

  test('SLA deadline for HIGH priority is 4 hours', async () => {
    const ticket = await Ticket.create({ ...validTicket, priority: 'HIGH' });
    const diff = ticket.slaDeadline - ticket.createdAt;
    expect(diff).toBeCloseTo(4 * 3600 * 1000, -3);
  });

  test('SLA deadline for LOW priority is 120 hours', async () => {
    const ticket = await Ticket.create({ ...validTicket, priority: 'LOW' });
    const diff = ticket.slaDeadline - ticket.createdAt;
    expect(diff).toBeCloseTo(120 * 3600 * 1000, -3);
  });

  test('rejects invalid priority', async () => {
    await expect(Ticket.create({ ...validTicket, priority: 'URGENT' }))
      .rejects.toThrow();
  });

  test('accepts all valid priorities', async () => {
    for (const priority of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
      const t = await Ticket.create({ ...validTicket, priority });
      expect(t.priority).toBe(priority);
    }
  });

  test('rejects invalid status', async () => {
    await expect(Ticket.create({ ...validTicket, status: 'PENDING' }))
      .rejects.toThrow();
  });

  test('accepts all valid statuses', async () => {
    const statuses = ['OPEN', 'IN_PROGRESS', 'AWAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED'];
    for (const status of statuses) {
      const t = await Ticket.create({ ...validTicket, status });
      expect(t.status).toBe(status);
    }
  });

  test('rejects invalid raisedByRole', async () => {
    await expect(Ticket.create({ ...validTicket, raisedByRole: 'ADMIN' }))
      .rejects.toThrow();
  });

  test('accepts CLIENT and STAFF raisedByRole', async () => {
    const c = await Ticket.create({ ...validTicket, raisedByRole: 'CLIENT' });
    expect(c.raisedByRole).toBe('CLIENT');
    const s = await Ticket.create({ ...validTicket, raisedByRole: 'STAFF' });
    expect(s.raisedByRole).toBe('STAFF');
  });

  test('sets default values', async () => {
    const ticket = await Ticket.create(validTicket);
    expect(ticket.slaBreach).toBe(false);
    expect(ticket.thread).toEqual([]);
    expect(ticket.resolvedAt).toBeUndefined();
    expect(ticket.satisfactionScore).toBeNull();
  });

  test('requires department', async () => {
    await expect(Ticket.create({ ...validTicket, department: undefined }))
      .rejects.toThrow();
  });

  test('requires departmentSlug', async () => {
    await expect(Ticket.create({ ...validTicket, departmentSlug: undefined }))
      .rejects.toThrow();
  });

  test('requires title', async () => {
    await expect(Ticket.create({ ...validTicket, title: undefined }))
      .rejects.toThrow();
  });

  test('requires description', async () => {
    await expect(Ticket.create({ ...validTicket, description: undefined }))
      .rejects.toThrow();
  });
});
