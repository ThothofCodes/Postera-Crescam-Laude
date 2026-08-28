// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Unit tests for Winston logger.

const logger = require('../../utils/logger');

describe('logger', () => {
  test('exports error, warn, info, debug methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('logger has transports configured', () => {
    expect(logger.transports).toBeDefined();
    expect(logger.transports.length).toBeGreaterThan(0);
  });

  test('logger has a console transport', () => {
    const consoleTransport = logger.transports.find(
      (t) => t.constructor.name === 'Console',
    );
    expect(consoleTransport).toBeDefined();
  });

  test('info level is set', () => {
    expect(logger.level).toBeDefined();
  });

  test('error method does not throw', () => {
    expect(() => logger.error('test error message')).not.toThrow();
  });

  test('info method does not throw', () => {
    expect(() => logger.info('test info message')).not.toThrow();
  });

  test('warn method does not throw', () => {
    expect(() => logger.warn('test warn message')).not.toThrow();
  });

  test('debug method does not throw', () => {
    expect(() => logger.debug('test debug message')).not.toThrow();
  });

  test('error method accepts data object', () => {
    expect(() => logger.error('error with data', { requestId: '123', userId: 'u1' })).not.toThrow();
  });
});
