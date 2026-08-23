// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  test('renders status text', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  test('renders confirmed status', () => {
    render(<StatusBadge status="confirmed" />);
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  test('renders delivered status', () => {
    render(<StatusBadge status="delivered" />);
    expect(screen.getByText('delivered')).toBeInTheDocument();
  });

  test('renders cancelled status', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  test('renders unknown status with default gray color', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  test('applies capitalize text transform', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('pending');
    expect(badge).toHaveStyle({ textTransform: 'capitalize' });
  });

  test('renders as a span element', () => {
    render(<StatusBadge status="paid" />);
    const badge = screen.getByText('paid');
    expect(badge.tagName).toBe('SPAN');
  });
});
