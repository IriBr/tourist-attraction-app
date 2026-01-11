import { create } from 'zustand';
import { subscriptionApi, SubscriptionStatus, SubscriptionFeatures } from '../api';

interface SubscriptionState {
  // Subscription status
  status: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;

  // Computed values
  isPremium: boolean;
  features: SubscriptionFeatures;

  // Actions
  fetchStatus: () => Promise<void>;
  canUseFeature: (feature: keyof SubscriptionFeatures) => boolean;
  upgradeToPremium: () => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  reset: () => void;
}

const defaultFeatures: SubscriptionFeatures = {
  canUseCameraScanning: false,
  canUseFilters: false,
  canReceiveProximityNotifications: false,
};

const initialState = {
  status: null,
  isLoading: false,
  error: null,
  isPremium: false,
  features: defaultFeatures,
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
        features: status.features || defaultFeatures,
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

  canUseFeature: (feature: keyof SubscriptionFeatures) => {
    const { features, isPremium } = get();
    // Premium users can use all features
    if (isPremium) return true;
    return features[feature] || false;
  },

  upgradeToPremium: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionApi.upgradeToPremium();
      set({
        status: result.subscription,
        isPremium: result.subscription.isPremium,
        features: result.subscription.features || defaultFeatures,
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
        features: result.subscription.features || defaultFeatures,
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
