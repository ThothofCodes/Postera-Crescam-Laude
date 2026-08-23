// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivateRoute from '../../components/PrivateRoute';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

function Wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('PrivateRoute', () => {
  test('shows loading state when auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(<PrivateRoute><div>Protected</div></PrivateRoute>, { wrapper: Wrapper });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    render(<PrivateRoute><div>Protected</div></PrivateRoute>, { wrapper: Wrapper });
    // Navigate component renders nothing but changes URL
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    useAuth.mockReturnValue({ user: { name: 'Test', role: 'STAFF' }, loading: false });
    render(<PrivateRoute><div>Protected Content</div></PrivateRoute>, { wrapper: Wrapper });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
