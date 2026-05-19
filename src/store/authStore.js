import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.login(email, password);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return data.user.role;
        } catch (err) {
          const message = err.response?.data?.error || 'Login failed. Please try again.';
          set({ isLoading: false, error: message });
          return null;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.register(userData);
          set({ isLoading: false, error: null });
          return data.success;
        } catch (err) {
          const message = err.response?.data?.error || 'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),

      // Refresh user profile from API
      refreshProfile: async () => {
        try {
          const { data } = await authService.getMe();
          set({ user: data });
        } catch {
          // If it fails (e.g. token expired), just ignore
        }
      },
    }),
    {
      name: 'goaltrack-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
