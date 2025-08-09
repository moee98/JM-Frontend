import { create } from 'zustand';
import { User } from '../types/user';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    const user = await authApi.login(email, password);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
