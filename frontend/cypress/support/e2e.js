// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Cypress E2E support file — global setup, custom commands, API intercepts.

import '@testing-library/cypress/add-commands';

// ── Skip boot screen on every visit ──────────────────────────────────────────
// The BootScreen is gated by sessionStorage('pcl_booted'). Setting it before
// each test means we land directly on the app content.
Cypress.on('window:before:load', (win) => {
  win.sessionStorage.setItem('pcl_booted', '1');
});

// ── Custom command: seed mock products via intercept ──────────────────────────
Cypress.Commands.add('mockProducts', (products) => {
  cy.intercept('GET', '/api/products*', {
    statusCode: 200,
    body: { products, total: products.length, pages: 1 },
  }).as('getProducts');
});

// ── Custom command: mock auth endpoints ──────────────────────────────────────
Cypress.Commands.add('mockAuth', (user = null) => {
  if (user) {
    cy.intercept('GET', '/api/auth/me', { statusCode: 200, body: user }).as('getMe');
  } else {
    cy.intercept('GET', '/api/auth/me', { statusCode: 401, body: { message: 'Invalid token' } }).as('getMe');
  }
});

// ── Custom command: mock order creation ──────────────────────────────────────
Cypress.Commands.add('mockOrderCreation', (orderId = 'order-123') => {
  cy.intercept('POST', '/api/orders', {
    statusCode: 201,
    body: {
      _id: orderId,
      orderNumber: 'RTS-2026-00001',
      customer: { name: 'Test User', phone: '+254700000000' },
      items: [],
      subtotal: 0,
      total: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'mpesa',
    },
  }).as('createOrder');
});

// ── Custom command: mock order status poll (for M-Pesa) ──────────────────────
Cypress.Commands.add('mockOrderPoll', (orderId = 'order-123', times = 1) => {
  // First poll(s): still unpaid, final poll: paid
  const responses = [];
  for (let i = 0; i < times - 1; i++) {
    responses.push({ statusCode: 200, body: { paymentStatus: 'unpaid' } });
  }
  responses.push({ statusCode: 200, body: { paymentStatus: 'paid' } });

  cy.intercept('GET', `/api/orders/${orderId}`, (req) => {
    const callCount = req.alias ? 0 : responses.length;
    req.reply(responses.shift() || responses[responses.length - 1]);
  }).as('pollOrder');
});

// ── Custom command: mock DB status ───────────────────────────────────────────
Cypress.Commands.add('mockDbStatus', (connected = true) => {
  cy.intercept('GET', '/api/health', {
    statusCode: connected ? 200 : 503,
    body: { status: connected ? 'ok' : 'degraded', db: connected ? 'connected' : 'disconnected' },
  }).as('healthCheck');
});
