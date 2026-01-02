import { create } from 'zustand';
import { subscriptionApi, SubscriptionStatus, FreeTierLimits } from '../api';

interface SubscriptionState {
  // Subscription status
  status: SubscriptionStatus | null;
  limits: FreeTierLimits | null;
  isLoading: boolean;
  error: string | null;

  // Computed values
  isPremium: boolean;
  canScan: boolean;
  scansRemaining: number;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchLimits: () => Promise<void>;
  recordScan: (photoUrl?: string, result?: string) => Promise<{ success: boolean; scansRemaining: number }>;
  upgradeToPremium: () => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  status: null,
  limits: null,
  isLoading: false,
  error: null,
  isPremium: false,
  canScan: true,
  scansRemaining: 3, // Default for free tier
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initialState,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await subscriptionApi.getStatus();
      set({
        status,
        isPremium: status.isPremium,
        canScan: status.canScan,
        scansRemaining: status.scansRemaining,
        isLoading: false,
      });
    } catch (error: any) {
      console.log('Failed to fetch subscription status:', error);
      set({
        error: error.message || 'Failed to fetch subscription status',
        isLoading: false,
      });
    }
  },

  fetchLimits: async () => {
    try {
      const limits = await subscriptionApi.getFreeTierLimits();
      set({ limits });
    } catch (error: any) {
      console.log('Failed to fetch limits:', error);
    }
  },

  recordScan: async (photoUrl?: string, result?: string) => {
    const { isPremium } = get();

    try {
      // Check if can scan first
      const canScanResult = await subscriptionApi.canScan();

      if (!canScanResult.canScan) {
        set({ canScan: false, scansRemaining: 0 });
        throw new Error(canScanResult.reason || 'Cannot perform scan');
      }

      // Record the scan
      const scanResult = await subscriptionApi.recordScan(photoUrl, result);

      // Update state with new remaining scans
      const scansRemaining = isPremium ? -1 : scanResult.scansRemaining;
      set({
        scansRemaining,
        canScan: isPremium || scansRemaining > 0,
      });

      return { success: true, scansRemaining };
    } catch (error: any) {
      console.log('Failed to record scan:', error);
      throw error;
    }
  },

  upgradeToPremium: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionApi.upgradeToPremium();
      set({
        status: result.subscription,
        isPremium: result.subscription.isPremium,
        canScan: result.subscription.canScan,
        scansRemaining: result.subscription.scansRemaining,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to upgrade',
        isLoading: false,
      });
      return false;
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionApi.cancelSubscription();
      set({
        status: result.subscription,
        isPremium: result.subscription.isPremium,
        canScan: result.subscription.canScan,
        scansRemaining: result.subscription.scansRemaining,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to cancel subscription',
        isLoading: false,
      });
      return false;
    }
  },

  reset: () => {
    set(initialState);
  },
}));
