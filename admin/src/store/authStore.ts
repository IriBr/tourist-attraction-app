import { create } from 'zustand';
import { authApi } from '../api/auth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });

      // Check if user is admin
      if (response.user.role !== 'admin') {
        set({ isLoading: false, error: 'Admin access required' });
        return false;
      }

      localStorage.setItem('adminToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Login failed',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authApi.getMe();
      if (user.role !== 'admin') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('refreshToken');
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('refreshToken');
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
