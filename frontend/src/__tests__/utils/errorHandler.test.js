// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { getErrorMessage, isRetryableError, handleApiError } from '../../utils/errorHandler';

describe('getErrorMessage', () => {
  test('returns response data message', () => {
    const error = { response: { data: { message: 'Not found' } } };
    expect(getErrorMessage(error)).toBe('Not found');
  });

  test('returns response data error field', () => {
    const error = { response: { data: { error: 'Bad request' } } };
    expect(getErrorMessage(error)).toBe('Bad request');
  });

  test('returns 404 message', () => {
    const error = { response: { status: 404 } };
    expect(getErrorMessage(error)).toBe('Resource not found');
  });

  test('returns 401 message', () => {
    const error = { response: { status: 401 } };
    expect(getErrorMessage(error)).toMatch(/Session expired/i);
  });

  test('returns 403 message', () => {
    const error = { response: { status: 403 } };
    expect(getErrorMessage(error)).toMatch(/permission/i);
  });

  test('returns 429 message', () => {
    const error = { response: { status: 429 } };
    expect(getErrorMessage(error)).toMatch(/Too many/i);
  });

  test('returns 500 message', () => {
    const error = { response: { status: 500 } };
    expect(getErrorMessage(error)).toMatch(/Server error/i);
  });

  test('returns network error message', () => {
    const error = { message: 'Network Error' };
    expect(getErrorMessage(error)).toMatch(/Network error/i);
  });

  test('returns error.message for other errors', () => {
    const error = { message: 'Custom error' };
    expect(getErrorMessage(error)).toBe('Custom error');
  });

  test('returns fallback for null/undefined', () => {
    expect(getErrorMessage(null)).toMatch(/unexpected/i);
    expect(getErrorMessage(undefined)).toMatch(/unexpected/i);
  });
});

describe('isRetryableError', () => {
  test('returns true for 429', () => {
    expect(isRetryableError({ response: { status: 429 } })).toBe(true);
  });

  test('returns true for 500+', () => {
    expect(isRetryableError({ response: { status: 500 } })).toBe(true);
    expect(isRetryableError({ response: { status: 503 } })).toBe(true);
  });

  test('returns true for Network Error', () => {
    expect(isRetryableError({ message: 'Network Error' })).toBe(true);
  });

  test('returns false for 400', () => {
    expect(isRetryableError({ response: { status: 400 } })).toBe(false);
  });

  test('returns false for 401', () => {
    expect(isRetryableError({ response: { status: 401 } })).toBe(false);
  });
});

describe('handleApiError', () => {
  test('returns message without context', () => {
    const error = { response: { data: { message: 'Bad input' } } };
    expect(handleApiError(error)).toBe('Bad input');
  });

  test('prepends context when provided', () => {
    const error = { response: { data: { message: 'Bad input' } } };
    expect(handleApiError(error, 'Save failed')).toBe('Save failed: Bad input');
  });

  test('returns context-only when no error message', () => {
    expect(handleApiError({}, 'Upload')).toBe('Upload: An unexpected error occurred. Please try again.');
  });
});
