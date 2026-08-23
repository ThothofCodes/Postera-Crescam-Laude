// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Backward-compatible re-exports from Zustand auth store.
// All components that import useAuth from this file will continue to work.

export { useAuth, useAuthStore } from '../store/authStore';

// AuthProvider is no longer needed (Zustand doesn't require a provider),
// but we export a no-op component so existing JSX that renders <AuthProvider> doesn't break.
export const AuthProvider = ({ children }) => children;
