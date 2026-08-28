// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Zustand auth store — replaces AuthContext with selector-based re-renders.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

// Backward-compatible hook that matches old AuthContext API
export const useAuth = () => {
  const { user, loading, login, logout } = useAuthStore();
  return { user, loading, login, logout };
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      loading: true,
      error: null,
      _hydrated: false,

      // Actions
      setUser: (user) => set({ user, loading: false, error: null }),

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          // Get device fingerprint for auto-registration
          let deviceFingerprint = null;
          let deviceName = null;
          try {
            const { getDeviceFingerprint, getDeviceDescription } = await import('../utils/deviceFingerprint');
            deviceFingerprint = await getDeviceFingerprint();
            deviceName = getDeviceDescription();
          } catch (err) {
            console.warn('[AuthStore] Could not get device fingerprint:', err.message);
          }

          const { data } = await api.post('/auth/login', {
            email,
            password,
            ...(deviceFingerprint && { deviceFingerprint, deviceName }),
          });
          localStorage.setItem('token', data.token);

          // Clear admin auth store to prevent dual sessions
          localStorage.removeItem('adminToken');
          localStorage.removeItem('pcl-admin-auth');
          try { (await import('../store/adminStore')).useAdminAuth.setState({ user: null, adminToken: null, loading: false }); } catch {}

          // Fetch full user from DB
          const me = await api.get('/auth/me');
          set({ user: me.data, loading: false });
          return me.data;
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ loading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, loading: false, error: null });
      },

      // Initialize — called once on app mount to check existing token
      initialize: async () => {
        // Wait for persist hydration before checking localStorage
        if (!get()._hydrated) {
          await new Promise((resolve) => {
            const check = setInterval(() => {
              if (get()._hydrated) { clearInterval(check); resolve(); }
            }, 50);
            setTimeout(() => { clearInterval(check); resolve(); }, 2000);
          });
        }

        // If admin token exists, skip regular auth init entirely — prevent dual sessions
        if (localStorage.getItem('adminToken')) {
          set({ user: null, loading: false });
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          set({ loading: false });
          return;
        }
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data, loading: false });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pcl-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hydrated: true });
      },
    }
  )
);
