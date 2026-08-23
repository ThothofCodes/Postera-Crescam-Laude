// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for standardized error classes.

const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} = require('../../utils/errors');

describe('AppError', () => {
  test('creates error with correct defaults', () => {
    const err = new AppError('fail');
    expect(err.message).toBe('fail');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.details).toEqual([]);
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('AppError');
  });

  test('accepts custom statusCode, code, and details', () => {
    const err = new AppError('custom', 422, 'CUSTOM_CODE', [{ field: 'x' }]);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('CUSTOM_CODE');
    expect(err.details).toEqual([{ field: 'x' }]);
  });
});

describe('ValidationError', () => {
  test('returns 400 with VALIDATION_ERROR code', () => {
    const err = new ValidationError('bad input', [{ field: 'name' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('bad input');
    expect(err.details).toEqual([{ field: 'name' }]);
  });

  test('has default message', () => {
    const err = new ValidationError();
    expect(err.message).toBe('Validation failed');
  });
});

describe('UnauthorizedError', () => {
  test('returns 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});

describe('ForbiddenError', () => {
  test('returns 403', () => {
    const err = new ForbiddenError('custom msg');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('custom msg');
  });
});

describe('NotFoundError', () => {
  test('returns 404 with resource name', () => {
    const err = new NotFoundError('Product');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Product not found');
  });

  test('defaults to "Resource"', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });
});

describe('ConflictError', () => {
  test('returns 409', () => {
    const err = new ConflictError('email exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});

describe('RateLimitError', () => {
  test('returns 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

describe('Error inheritance', () => {
  test('all error classes are instances of AppError and Error', () => {
    const errors = [
      new ValidationError(),
      new UnauthorizedError(),
      new ForbiddenError(),
      new NotFoundError(),
      new ConflictError(),
      new RateLimitError(),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
      expect(err.isOperational).toBe(true);
    }
  });

  test('captures stack trace', () => {
    const err = new AppError('test');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });
});
