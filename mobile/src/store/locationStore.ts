import { create } from 'zustand';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;

  // Actions
  setLocation: (latitude: number, longitude: number) => void;
  setError: (error: string) => void;
  setPermission: (hasPermission: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  isLoading: false,
  error: null,
  hasPermission: null,

  setLocation: (latitude: number, longitude: number) => {
    set({
      latitude,
      longitude,
      isLoading: false,
      error: null,
    });
  },

  setError: (error: string) => {
    set({
      error,
      isLoading: false,
    });
  },

  setPermission: (hasPermission: boolean) => {
    set({ hasPermission });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  clearLocation: () => {
    set({
      latitude: null,
      longitude: null,
      error: null,
    });
  },
}));
