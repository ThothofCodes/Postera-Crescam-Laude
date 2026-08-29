// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for the unified error handler middleware.

const errorHandler = require('../../middleware/errorHandler');
const {
  AppError, ValidationError, NotFoundError,
} = require('../../utils/errors');

function mockReqRes(overrides = {}) {
  return {
    req: {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      id: 'req-123',
      ...overrides,
    },
    res: {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    },
  };
}

describe('errorHandler — unified response format', () => {
  test('returns standardized response for AppError', () => {
    const { req, res } = mockReqRes();
    const err = new AppError('Something failed', 422, 'CUSTOM_ERROR', [{ field: 'x' }]);
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(422);
    expect(res.body).toMatchObject({
      status: 422,
      code: 'CUSTOM_ERROR',
      message: 'Something failed',
      details: [{ field: 'x' }],
      requestId: 'req-123',
      path: '/api/test',
    });
    expect(res.body.timestamp).toBeDefined();
  });

  test('returns standardized response for ValidationError', () => {
    const { req, res } = mockReqRes();
    const err = new ValidationError('Bad input', [{ field: 'name', message: 'required' }]);
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 for NotFoundError', () => {
    const { req, res } = mockReqRes();
    const err = new NotFoundError('User');
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  test('returns 409 for duplicate key (MongoDB error code 11000)', () => {
    const { req, res } = mockReqRes();
    const err = new Error('duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'dup@test.com' };
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
    expect(res.body.message).toBe('email already exists');
  });

  test('returns 400 for CastError (invalid ObjectId)', () => {
    const { req, res } = mockReqRes();
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    err.path = '_id';
    err.value = 'bad-id';
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns 401 for JsonWebTokenError', () => {
    const { req, res } = mockReqRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 for TokenExpiredError', () => {
    const { req, res } = mockReqRes();
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  test('returns 400 for LIMIT_FILE_SIZE', () => {
    const { req, res } = mockReqRes();
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('FILE_TOO_LARGE');
  });

  test('returns 403 for CORS error', () => {
    const { req, res } = mockReqRes();
    const err = new Error('CORS: origin not allowed');
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CORS_VIOLATION');
  });

  test('returns 500 for generic error in production (hides message)', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { req, res } = mockReqRes();
    const err = new Error('secret internal detail');
    err.statusCode = 500;
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('An error occurred. Please try again.');
    expect(res.body.stack).toBeUndefined();
    process.env.NODE_ENV = original;
  });

  test('returns 500 for generic error in development (shows message + stack)', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const { req, res } = mockReqRes();
    const err = new Error('debug detail');
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('debug detail');
    expect(res.body.stack).toBeDefined();
    process.env.NODE_ENV = original;
  });

  test('returns 503 for Mongoose buffering timeout', () => {
    const { req, res } = mockReqRes();
    const err = new Error('buffering timed out after 10000ms');
    err.name = 'MongooseError';
    errorHandler(err, req, res, jest.fn());
    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
  });
});
