import { create } from 'zustand';
import {
  UserBadge,
  BadgeProgress,
  BadgeSummary,
  AllBadgeProgress,
  NewBadgeResult,
} from '@tourist-app/shared';
import { badgesApi } from '../api';

interface BadgeState {
  badges: UserBadge[];
  progress: AllBadgeProgress | null;
  summary: BadgeSummary | null;
  timeline: UserBadge[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBadges: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchTimeline: (limit?: number) => Promise<void>;
  addNewBadges: (badges: NewBadgeResult[]) => void;
  clearError: () => void;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  badges: [],
  progress: null,
  summary: null,
  timeline: [],
  isLoading: false,
  error: null,

  fetchBadges: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await badgesApi.getAll();
      set({
        badges: response.badges,
        summary: response.summary,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch badges',
        isLoading: false,
      });
    }
  },

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const progress = await badgesApi.getProgress();
      set({ progress, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch progress',
        isLoading: false,
      });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await badgesApi.getSummary();
      set({ summary, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch summary',
        isLoading: false,
      });
    }
  },

  fetchTimeline: async (limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await badgesApi.getTimeline(limit);
      set({ timeline: response.items, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch timeline',
        isLoading: false,
      });
    }
  },

  addNewBadges: (newBadgeResults: NewBadgeResult[]) => {
    const { badges, timeline, summary } = get();

    // Filter only truly new badges
    const trulyNewBadges = newBadgeResults
      .filter((result) => result.isNew)
      .map((result) => result.badge);

    if (trulyNewBadges.length === 0) return;

    // Add new badges to the lists
    set({
      badges: [...trulyNewBadges, ...badges],
      timeline: [...trulyNewBadges, ...timeline],
      // Update summary counts
      summary: summary
        ? {
            ...summary,
            totalBadges: summary.totalBadges + trulyNewBadges.length,
            recentBadge: trulyNewBadges[0] || summary.recentBadge,
          }
        : null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
