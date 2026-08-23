// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws on render
function ThrowingComponent() {
  throw new Error('Test error');
}

// Component that renders normally
function SafeComponent() {
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  test('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('shows Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('shows Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  test('shows brand footer text', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/POSTERA CRESCAM LAUDE/)).toBeInTheDocument();
  });

  test('Try Again button resets error state and re-renders children', () => {
    let shouldThrow = true;
    function ToggleableComponent() {
      if (shouldThrow) throw new Error('Toggle error');
      return <div>Recovered content</div>;
    }

    render(
      <ErrorBoundary>
        <ToggleableComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop the child from throwing, then click Try Again
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
