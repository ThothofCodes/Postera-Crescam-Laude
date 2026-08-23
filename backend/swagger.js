// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Swagger/OpenAPI configuration for interactive API documentation.

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PCL — Postera Crescam Laude API',
      version: '1.0.0',
      description: `
## Overview
Backend API for the PCL (Postera Crescam Laude) integrated platform — internet distribution, web development, PlayStation arena, hardware repair, cybersecurity, and government admin assistance.

## Authentication
All protected endpoints require a JWT Bearer token in the Authorization header.
Obtain a token via \`POST /api/auth/login\`.

## Rate Limits
- Global: 100 requests / 15 min per IP
- Auth endpoints: 10 attempts / 15 min
- Chat: 20 requests / 1 hour
      `.trim(),
      contact: {
        name: 'PCL Tech Support',
        email: 'support@pcl.co.ke',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from POST /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'admin', 'staff'] },
            department: { type: 'string', nullable: true },
            departmentSlug: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', maxLength: 120 },
            slug: { type: 'string' },
            category: { type: 'string', enum: ['electronics', 'accessories', 'software', 'services'] },
            description: { type: 'string', maxLength: 2000 },
            price: { type: 'number', minimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string', example: 'RTS-2026-00001' },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
              },
            },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            total: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'integer', minimum: 1 },
            subtotal: { type: 'number' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ticketId: { type: 'string', example: 'RTS-REP-TKT-0001' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'AWAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED'] },
            departmentSlug: { type: 'string' },
            slaDeadline: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './swagger.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
