import { google } from 'googleapis';
import { prisma } from '../config/database.js';
import { BadRequestError } from '../utils/errors.js';

// Product IDs - must match Google Play Console and mobile app
const PRODUCT_IDS = {
  MONTHLY: 'wandr_premium_monthly',
  ANNUAL: 'wandr_premium_annual',
};

interface ValidationResult {
  valid: boolean;
  subscription?: {
    tier: string;
    expiresAt: string;
    productId: string;
    orderId: string;
    isTrialPeriod: boolean;
  };
  error?: string;
}

// Initialize Google Play API client
function getPlayClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new BadRequestError('Google Play service account not configured');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch {
    throw new BadRequestError('Invalid Google service account key format');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return google.androidpublisher({ version: 'v3', auth });
}

export const googleIapService = {
  /**
   * Validate a Google Play purchase token and activate subscription
   */
  async validatePurchase(
    userId: string,
    purchaseToken: string,
    productId: string
  ): Promise<ValidationResult> {
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;

    if (!packageName) {
      return {
        valid: false,
        error: 'Google Play package name not configured',
      };
    }

    // Validate product ID
    if (!Object.values(PRODUCT_IDS).includes(productId)) {
      return {
        valid: false,
        error: 'Invalid product ID',
      };
    }

    try {
      const playClient = getPlayClient();

      // Verify subscription with Google Play
      const response = await playClient.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const subscription = response.data;

      // Check if subscription is valid
      // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred
      const isPaymentReceived = subscription.paymentState === 1 || subscription.paymentState === 2;

      // Check expiry
      const expiryTimeMillis = parseInt(subscription.expiryTimeMillis || '0', 10);
      const expiresAt = new Date(expiryTimeMillis);
      const isExpired = expiresAt < new Date();

      // Check cancellation
      const isCancelled = !!subscription.cancelReason;

      if (!isPaymentReceived) {
        return {
          valid: false,
          error: 'Payment not received',
        };
      }

      if (isExpired) {
        return {
          valid: false,
          error: 'Subscription has expired',
        };
      }

      // Activate the subscription in database
      const orderId = subscription.orderId || purchaseToken.substring(0, 50);
      await this.activateSubscription(userId, orderId, expiresAt);

      return {
        valid: true,
        subscription: {
          tier: 'premium',
          expiresAt: expiresAt.toISOString(),
          productId,
          orderId,
          isTrialPeriod: subscription.paymentState === 2,
        },
      };
    } catch (error: any) {
      console.error('Google Play validation error:', error);

      // Handle specific Google API errors
      if (error.code === 404) {
        return {
          valid: false,
          error: 'Purchase not found',
        };
      }

      if (error.code === 401 || error.code === 403) {
        return {
          valid: false,
          error: 'Google Play API authentication failed',
        };
      }

      return {
        valid: false,
        error: error.message || 'Failed to validate purchase',
      };
    }
  },

  /**
   * Restore purchases for a user
   */
  async restorePurchases(
    userId: string,
    purchaseToken: string,
    productId: string
  ): Promise<{ restored: boolean; subscription?: ValidationResult['subscription'] }> {
    const result = await this.validatePurchase(userId, purchaseToken, productId);

    if (result.valid && result.subscription) {
      return {
        restored: true,
        subscription: result.subscription,
      };
    }

    return { restored: false };
  },

  /**
   * Activate subscription in database
   */
  async activateSubscription(
    userId: string,
    orderId: string,
    expiresAt: Date
  ): Promise<void> {
    // Check if this order is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        googleOrderId: orderId,
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new BadRequestError('This subscription is already linked to another account');
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: expiresAt,
        googleOrderId: orderId,
      },
    });
  },
};
