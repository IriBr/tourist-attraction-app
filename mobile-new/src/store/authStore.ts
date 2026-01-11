import { create } from 'zustand';
import { User, AuthProvider } from '../types';
import { authApi, tokenStorage } from '../api';
import { unregisterPushNotifications } from '../services/pushNotifications';

// Dev mode - set to true to bypass authentication
const DEV_MODE = false;
const DEV_USER: User = {
  id: 'dev-user-1',
  email: 'explorer@world.com',
  name: 'World Explorer',
  avatarUrl: null,
  authProvider: AuthProvider.EMAIL,
  emailVerified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  appleLogin: (idToken: string, name?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

/**
 * Helper to wrap async actions with loading state management.
 * Reduces boilerplate in store actions.
 */
const withLoading = <TArgs extends unknown[]>(
  set: (partial: Partial<AuthState>) => void,
  action: (...args: TArgs) => Promise<Partial<AuthState> | void>,
  options?: { rethrow?: boolean }
) => {
  return async (...args: TArgs): Promise<void> => {
    set({ isLoading: true });
    try {
      const result = await action(...args);
      set({ ...(result || {}), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (options?.rethrow !== false) throw error;
    }
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: withLoading(set, async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    return { user: response.user, isAuthenticated: true };
  }),

  register: withLoading(set, async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name });
    return { user: response.user, isAuthenticated: true };
  }),

  googleLogin: withLoading(set, async (idToken: string) => {
    const response = await authApi.googleLogin({ idToken });
    return { user: response.user, isAuthenticated: true };
  }),

  appleLogin: withLoading(set, async (idToken: string, name?: string, email?: string) => {
    const response = await authApi.appleLogin({ idToken, name, email });
    return { user: response.user, isAuthenticated: true };
  }),

  logout: async () => {
    set({ isLoading: true });
    try {
      // Unregister push notifications before logout
      await unregisterPushNotifications();
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    // Dev mode bypass
    if (DEV_MODE) {
      set({ user: DEV_USER, isAuthenticated: true, isLoading: false });
      return;
    }

    try {
      const hasToken = await tokenStorage.getAccessToken();
      if (!hasToken) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await authApi.checkAuthStatus();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: User) => set({ user }),
}));
