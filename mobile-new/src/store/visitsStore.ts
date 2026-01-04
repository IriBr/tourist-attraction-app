import { create } from 'zustand';
import { visitsApi } from '../api';

interface VisitsState {
  visitedIds: Set<string>;
  isLoading: boolean;
  lastUpdated: number;
  fetchVisits: () => Promise<void>;
  refreshVisits: () => Promise<void>;
  addVisit: (attractionId: string) => void;
  removeVisit: (attractionId: string) => void;
  isVisited: (attractionId: string) => boolean;
}

export const useVisitsStore = create<VisitsState>((set, get) => ({
  visitedIds: new Set<string>(),
  isLoading: false,
  lastUpdated: 0,

  fetchVisits: async () => {
    // Avoid fetching if recently updated (within 10 seconds)
    const now = Date.now();
    if (now - get().lastUpdated < 10000 && get().visitedIds.size > 0) {
      return;
    }

    set({ isLoading: true });
    try {
      const visitsData = await visitsApi.getUserVisits({ limit: 500 });
      const visited = new Set<string>();
      (visitsData.items || []).forEach((visit: any) => {
        if (visit.attractionId) {
          visited.add(visit.attractionId);
        }
      });
      set({ visitedIds: visited, lastUpdated: now });
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Force refresh regardless of cache
  refreshVisits: async () => {
    set({ isLoading: true });
    try {
      const visitsData = await visitsApi.getUserVisits({ limit: 500 });
      const visited = new Set<string>();
      (visitsData.items || []).forEach((visit: any) => {
        if (visit.attractionId) {
          visited.add(visit.attractionId);
        }
      });
      set({ visitedIds: visited, lastUpdated: Date.now() });
    } catch (error) {
      console.error('Failed to refresh visits:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Optimistically add a visit to local state
  addVisit: (attractionId: string) => {
    set((state) => {
      const newSet = new Set(state.visitedIds);
      newSet.add(attractionId);
      return { visitedIds: newSet };
    });
  },

  // Optimistically remove a visit from local state
  removeVisit: (attractionId: string) => {
    set((state) => {
      const newSet = new Set(state.visitedIds);
      newSet.delete(attractionId);
      return { visitedIds: newSet };
    });
  },

  // Check if an attraction is visited
  isVisited: (attractionId: string) => {
    return get().visitedIds.has(attractionId);
  },
}));
