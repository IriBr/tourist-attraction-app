import { prisma } from '../config/database.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

// Premium-only features
export type PremiumFeature = 'camera_scanning' | 'filters' | 'proximity_notifications';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  subscriptionEndDate: string | null;
  isPremium: boolean;
  features: {
    canUseCameraScanning: boolean;
    canUseFilters: boolean;
    canReceiveProximityNotifications: boolean;
  };
}

export interface ScanResult {
  success: boolean;
  scanId: string;
}

export const subscriptionService = {
  /**
   * Get user's subscription status including feature access
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPremium = user.subscriptionTier === 'premium' && user.subscriptionStatus === 'active';

    return {
      tier: user.subscriptionTier as 'free' | 'premium',
      status: user.subscriptionStatus as 'active' | 'cancelled' | 'expired',
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
      isPremium,
      features: {
        canUseCameraScanning: isPremium,
        canUseFilters: isPremium,
        canReceiveProximityNotifications: isPremium,
      },
    };
  },

  /**
   * Check if user can use a specific premium feature
   */
  async canUseFeature(userId: string, feature: PremiumFeature): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getSubscriptionStatus(userId);

    if (status.isPremium) {
      return { allowed: true };
    }

    const featureNames: Record<PremiumFeature, string> = {
      camera_scanning: 'Camera scanning',
      filters: 'Attraction filters',
      proximity_notifications: 'Proximity notifications',
    };

    return {
      allowed: false,
      reason: `${featureNames[feature]} is a premium feature. Upgrade to Premium to unlock it.`,
    };
  },

  /**
   * Record a scan (premium users only)
   */
  async recordScan(userId: string, photoUrl?: string, result?: string): Promise<ScanResult> {
    const canUse = await this.canUseFeature(userId, 'camera_scanning');

    if (!canUse.allowed) {
      throw new BadRequestError(canUse.reason || 'Camera scanning requires Premium subscription');
    }

    // Record the scan
    const scan = await prisma.dailyScan.create({
      data: {
        userId,
        photoUrl,
        result,
        scanDate: new Date(),
      },
    });

    return {
      success: true,
      scanId: scan.id,
    };
  },

  /**
   * Check if user is premium
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) return false;

    // Check if subscription has expired
    if (user.subscriptionTier === 'premium') {
      if (user.subscriptionEndDate && new Date() > user.subscriptionEndDate) {
        // Auto-expire the subscription
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: 'free',
            subscriptionStatus: 'expired',
          },
        });
        return false;
      }
      return user.subscriptionStatus === 'active';
    }

    return false;
  },

  /**
   * Upgrade user to premium (would be called by payment webhook in production)
   */
  async upgradeToPremium(
    userId: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
    durationDays: number = 30
  ) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    return prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: endDate,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
  },

  /**
   * Downgrade user to free (cancel subscription)
   */
  async downgradeToFree(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
      },
    });
  },

  /**
   * Get premium features list
   */
  getPremiumFeatures() {
    return {
      cameraScanning: 'Scan attractions with your camera using AI',
      filters: 'Filter attractions by category, rating, and more',
      proximityNotifications: 'Get notified when near attractions',
    };
  },
};
