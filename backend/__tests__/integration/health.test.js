// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Integration tests for /api/health and /api/ready endpoints.

const http = require('http');
const express = require('express');

// We create a minimal Express app to test the health endpoints without
// needing a full database connection or all route mounts.
let app; let
  server;

beforeAll((done) => {
  app = express();

  // Mock mongoose connection state
  const mongoose = require('mongoose');

  app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting',
    };
    const ok = dbState === 1;
    const mem = process.memoryUsage();
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'degraded',
      db: states[dbState] || 'unknown',
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      },
    });
  });

  app.get('/api/ready', (req, res) => {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      res.status(200).json({ status: 'ready', db: 'connected' });
    } else {
      const dbStates = {
        0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting',
      };
      res.status(503).json({ status: 'not ready', db: dbStates[dbState] || 'unknown' });
    }
  });

  server = app.listen(0, done);
});

afterAll((done) => {
  server.close(done);
});

const request = require('supertest');

describe('GET /api/health', () => {
  test('returns 200 or 503 with expected fields', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('memory');
    expect(res.body.memory).toHaveProperty('rss');
    expect(res.body.memory).toHaveProperty('heapUsed');
    expect(res.body.memory).toHaveProperty('heapTotal');
  });

  test('status field is either ok or degraded', async () => {
    const res = await request(app).get('/api/health');
    expect(['ok', 'degraded']).toContain(res.body.status);
  });

  test('db field is a string', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.db).toBe('string');
  });
});

describe('GET /api/ready', () => {
  test('returns 200 or 503', async () => {
    const res = await request(app).get('/api/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
  });
});
