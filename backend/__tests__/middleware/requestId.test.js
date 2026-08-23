// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for requestId middleware.

const requestId = require('../../middleware/requestId');

function mockReqRes(overrides = {}) {
  return {
    req: {
      headers: {},
      ...overrides,
    },
    res: {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
    },
    next: jest.fn(),
  };
}

describe('requestId middleware', () => {
  test('generates a UUID when no X-Request-Id header present', () => {
    const { req, res, next } = mockReqRes();
    requestId(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.id).toBeDefined();
    expect(typeof req.id).toBe('string');
    expect(req.id.length).toBe(36); // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(res.headers['X-Request-Id']).toBe(req.id);
  });

  test('preserves existing X-Request-Id header', () => {
    const existingId = 'custom-request-id-123';
    const { req, res, next } = mockReqRes({ headers: { 'x-request-id': existingId } });
    requestId(req, res, next);
    expect(req.id).toBe(existingId);
    expect(res.headers['X-Request-Id']).toBe(existingId);
  });

  test('sets X-Request-Id response header', () => {
    const { req, res, next } = mockReqRes();
    requestId(req, res, next);
    expect(res.headers['X-Request-Id']).toBeDefined();
  });
});
