import { create } from 'zustand';
import { visitsApi, locationsApi, UserStats, GlobalStats } from '../api';

interface StatsState {
  userStats: UserStats | null;
  globalStats: GlobalStats | null;
  isLoading: boolean;
  lastUpdated: number;
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  userStats: null,
  globalStats: null,
  isLoading: false,
  lastUpdated: 0,

  fetchStats: async () => {
    // Avoid fetching if recently updated (within 5 seconds)
    const now = Date.now();
    if (now - get().lastUpdated < 5000 && get().userStats) {
      console.log('[StatsStore] Using cached stats');
      return;
    }

    console.log('[StatsStore] Fetching stats...');
    set({ isLoading: true });
    try {
      const [userStats, globalStats] = await Promise.all([
        visitsApi.getUserStats(),
        locationsApi.getStats(),
      ]);
      console.log('[StatsStore] userStats:', JSON.stringify(userStats));
      console.log('[StatsStore] globalStats:', JSON.stringify(globalStats));
      set({ userStats, globalStats, lastUpdated: now });
    } catch (error) {
      console.error('[StatsStore] Failed to fetch stats:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Force refresh regardless of cache
  refreshStats: async () => {
    set({ isLoading: true });
    try {
      const [userStats, globalStats] = await Promise.all([
        visitsApi.getUserStats(),
        locationsApi.getStats(),
      ]);
      set({ userStats, globalStats, lastUpdated: Date.now() });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
