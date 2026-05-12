import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../services/authApi';
import type { User } from '@/types';
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await authApi.login(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await authApi.register(username, email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore errors on logout
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      loadUser: async () => {
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'tera-story-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
