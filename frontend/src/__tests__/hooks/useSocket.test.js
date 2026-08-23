// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    id: 'mock-socket-id',
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    emit: vi.fn(),
    connected: true,
  };
  return {
    default: vi.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

import io from 'socket.io-client';
import { useSocket } from '../../hooks/useSocket';

describe('useSocket', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset the module-level singleton
    vi.resetModules();
  });

  test('exports useSocket as a function', () => {
    expect(typeof useSocket).toBe('function');
  });

  test('socket.io-client is mocked', () => {
    expect(typeof io).toBe('function');
  });
});
