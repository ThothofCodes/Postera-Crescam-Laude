import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => sessionStorageMock.store[key] ?? null),
  setItem: vi.fn((key, value) => { sessionStorageMock.store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete sessionStorageMock.store[key]; }),
  clear: vi.fn(() => { sessionStorageMock.store = {}; }),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView (commonly used in React apps)
Element.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));