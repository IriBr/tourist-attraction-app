import { apiClient } from './config';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  scansUsedToday: number;
  scansRemaining: number;
  canScan: boolean;
  subscriptionEndDate: string | null;
  isPremium: boolean;
}

export interface CanScanResult {
  canScan: boolean;
  scansRemaining: number;
  reason?: string;
}

export interface ScanResult {
  success: boolean;
  scanId: string;
  scansRemaining: number;
}

export interface DailyScan {
  id: string;
  scanDate: string;
  photoUrl: string | null;
  result: string | null;
  createdAt: string;
}

export interface FreeTierLimits {
  dailyScanLimit: number;
  attractionsLimit: number;
}

export const subscriptionApi = {
  /**
   * Get current subscription status
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get('/subscription/status');
    return response.data.data;
  },

  /**
   * Check if user can perform a scan
   */
  async canScan(): Promise<CanScanResult> {
    const response = await apiClient.get('/subscription/can-scan');
    return response.data.data;
  },

  /**
   * Record a scan (decrements daily limit for free users)
   */
  async recordScan(photoUrl?: string, result?: string): Promise<ScanResult> {
    const response = await apiClient.post('/subscription/scan', { photoUrl, result });
    return response.data.data;
  },

  /**
   * Get today's scans
   */
  async getTodayScans(): Promise<{ scans: DailyScan[] }> {
    const response = await apiClient.get('/subscription/scans/today');
    return response.data.data;
  },

  /**
   * Upgrade to premium
   */
  async upgradeToPremium(durationDays: number = 30): Promise<{
    message: string;
    subscription: SubscriptionStatus;
  }> {
    const response = await apiClient.post('/subscription/upgrade', { durationDays });
    return response.data.data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<{
    message: string;
    subscription: SubscriptionStatus;
  }> {
    const response = await apiClient.post('/subscription/cancel');
    return response.data.data;
  },

  /**
   * Get free tier limits (public endpoint)
   */
  async getFreeTierLimits(): Promise<FreeTierLimits> {
    const response = await apiClient.get('/subscription/limits');
    return response.data.data;
  },

  // ============ STRIPE ENDPOINTS ============

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(plan: 'monthly' | 'annual', successUrl: string, cancelUrl: string): Promise<{ url: string }> {
    const response = await apiClient.post('/subscription/stripe/checkout', {
      plan,
      successUrl,
      cancelUrl,
    });
    return response.data.data;
  },

  /**
   * Create billing portal session
   */
  async createBillingPortal(returnUrl: string): Promise<{ url: string }> {
    const response = await apiClient.post('/subscription/stripe/portal', { returnUrl });
    return response.data.data;
  },

  /**
   * Get Stripe subscription status
   */
  async getStripeStatus(): Promise<{
    isActive: boolean;
    plan: 'monthly' | 'annual' | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }> {
    const response = await apiClient.get('/subscription/stripe/status');
    return response.data.data;
  },

  /**
   * Cancel Stripe subscription at period end
   */
  async cancelStripeSubscription(): Promise<{
    message: string;
    subscription: any;
  }> {
    const response = await apiClient.post('/subscription/stripe/cancel');
    return response.data.data;
  },

  /**
   * Resume cancelled subscription
   */
  async resumeStripeSubscription(): Promise<{
    message: string;
    subscription: any;
  }> {
    const response = await apiClient.post('/subscription/stripe/resume');
    return response.data.data;
  },

  /**
   * Get pricing info (public endpoint)
   */
  async getPricing(): Promise<{
    monthly: { price: number; priceFormatted: string; period: string };
    annual: { price: number; priceFormatted: string; period: string; savings: string; monthlyEquivalent: string };
  }> {
    const response = await apiClient.get('/subscription/pricing');
    return response.data.data;
  },

  // ============ APPLE IAP ENDPOINTS ============

  /**
   * Validate Apple receipt and activate subscription
   */
  async validateAppleReceipt(receipt: string, productId: string): Promise<{
    valid: boolean;
    subscription?: {
      tier: string;
      expiresAt: string;
    };
  }> {
    const response = await apiClient.post('/subscription/apple/validate', {
      receipt,
      productId,
    });
    return response.data.data;
  },

  /**
   * Restore Apple purchases
   */
  async restoreApplePurchases(receipt: string): Promise<{
    restored: boolean;
    subscription?: {
      tier: string;
      expiresAt: string;
    };
  }> {
    const response = await apiClient.post('/subscription/apple/restore', {
      receipt,
    });
    return response.data.data;
  },
};
