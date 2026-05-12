import { create } from 'zustand';
import { User } from '../types/user';
import { getCurrentUser, login as authLogin } from '../services/authService';

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
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    await authLogin(email, password);
    const user = await getCurrentUser();
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));
