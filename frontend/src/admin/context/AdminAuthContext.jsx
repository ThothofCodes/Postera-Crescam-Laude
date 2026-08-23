// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Backward-compatible re-exports from Zustand admin store.

export { useAdminAuth, useAdminStore, getPermissions } from '../../store/adminStore';

// AdminAuthProvider is no longer needed, but export a no-op for backward compatibility.
export const AdminAuthProvider = ({ children }) => children;
