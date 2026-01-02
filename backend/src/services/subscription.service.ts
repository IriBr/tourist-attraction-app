import { prisma } from '../config/database.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

// Constants
const FREE_TIER_DAILY_SCAN_LIMIT = 3;
const FREE_TIER_ATTRACTIONS_LIMIT = 10; // Free users can only see 10 attractions per location

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  scansUsedToday: number;
  scansRemaining: number;
  canScan: boolean;
  subscriptionEndDate: string | null;
  isPremium: boolean;
}

export interface ScanResult {
  success: boolean;
  scanId: string;
  scansRemaining: number;
}

// Get start of day in UTC
function getStartOfDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Get end of day in UTC
function getEndOfDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
}

export const subscriptionService = {
  /**
   * Get user's subscription status including scan limits
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

    // Count today's scans for free users
    let scansUsedToday = 0;
    if (!isPremium) {
      scansUsedToday = await prisma.dailyScan.count({
        where: {
          userId,
          scanDate: {
            gte: getStartOfDay(),
            lte: getEndOfDay(),
          },
        },
      });
    }

    const scansRemaining = isPremium ? -1 : Math.max(0, FREE_TIER_DAILY_SCAN_LIMIT - scansUsedToday);

    return {
      tier: user.subscriptionTier as 'free' | 'premium',
      status: user.subscriptionStatus as 'active' | 'cancelled' | 'expired',
      scansUsedToday,
      scansRemaining,
      canScan: isPremium || scansRemaining > 0,
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
      isPremium,
    };
  },

  /**
   * Check if user can perform a scan
   */
  async canUserScan(userId: string): Promise<{ canScan: boolean; scansRemaining: number; reason?: string }> {
    const status = await this.getSubscriptionStatus(userId);

    if (status.isPremium) {
      return { canScan: true, scansRemaining: -1 };
    }

    if (status.scansRemaining <= 0) {
      return {
        canScan: false,
        scansRemaining: 0,
        reason: 'Daily scan limit reached. Upgrade to Premium for unlimited scans.',
      };
    }

    return { canScan: true, scansRemaining: status.scansRemaining };
  },

  /**
   * Record a scan and check limits
   */
  async recordScan(userId: string, photoUrl?: string, result?: string): Promise<ScanResult> {
    const canScanResult = await this.canUserScan(userId);

    if (!canScanResult.canScan) {
      throw new BadRequestError(canScanResult.reason || 'Cannot perform scan');
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

    // Get updated remaining scans
    const status = await this.getSubscriptionStatus(userId);

    return {
      success: true,
      scanId: scan.id,
      scansRemaining: status.scansRemaining,
    };
  },

  /**
   * Get today's scan history for user
   */
  async getTodayScans(userId: string) {
    return prisma.dailyScan.findMany({
      where: {
        userId,
        scanDate: {
          gte: getStartOfDay(),
          lte: getEndOfDay(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
   * Get attraction limit for user
   */
  async getAttractionLimit(userId: string): Promise<number | null> {
    const isPremium = await this.isPremiumUser(userId);
    return isPremium ? null : FREE_TIER_ATTRACTIONS_LIMIT;
  },

  /**
   * Get the free tier limits configuration
   */
  getFreeTierLimits() {
    return {
      dailyScanLimit: FREE_TIER_DAILY_SCAN_LIMIT,
      attractionsLimit: FREE_TIER_ATTRACTIONS_LIMIT,
    };
  },
};
