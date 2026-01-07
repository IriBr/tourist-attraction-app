import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { BadRequestError } from '../utils/errors.js';

// Product IDs - must match App Store Connect and mobile app
const PRODUCT_IDS = {
  MONTHLY: 'wandr_premium_monthly',
  ANNUAL: 'wandr_premium_annual',
};

// Apple receipt validation response codes
const APPLE_STATUS_CODES = {
  SUCCESS: 0,
  INVALID_JSON: 21000,
  INVALID_RECEIPT_DATA: 21002,
  AUTHENTICATION_FAILED: 21003,
  SHARED_SECRET_MISMATCH: 21004,
  SERVER_UNAVAILABLE: 21005,
  SUBSCRIPTION_EXPIRED: 21006,
  SANDBOX_RECEIPT_ON_PRODUCTION: 21007,
  PRODUCTION_RECEIPT_ON_SANDBOX: 21008,
};

interface AppleReceiptResponse {
  status: number;
  environment?: 'Sandbox' | 'Production';
  receipt?: {
    bundle_id: string;
    application_version: string;
    in_app: AppleInAppPurchase[];
  };
  latest_receipt_info?: AppleInAppPurchase[];
  pending_renewal_info?: ApplePendingRenewal[];
}

interface AppleInAppPurchase {
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date_ms: string;
  expires_date_ms?: string;
  is_trial_period?: string;
  cancellation_date_ms?: string;
}

interface ApplePendingRenewal {
  product_id: string;
  auto_renew_status: '0' | '1';
  expiration_intent?: string;
}

interface ValidationResult {
  valid: boolean;
  subscription?: {
    tier: string;
    expiresAt: string;
    productId: string;
    originalTransactionId: string;
    isTrialPeriod: boolean;
  };
  error?: string;
}

export const appleIapService = {
  /**
   * Validate an Apple receipt and activate subscription
   */
  async validateReceipt(
    userId: string,
    receiptData: string,
    productId: string
  ): Promise<ValidationResult> {
    // Verify the receipt with Apple
    const appleResponse = await this.verifyWithApple(receiptData);

    if (appleResponse.status !== APPLE_STATUS_CODES.SUCCESS) {
      return {
        valid: false,
        error: this.getStatusMessage(appleResponse.status),
      };
    }

    // Get the latest subscription info
    const subscriptionInfo = this.getActiveSubscription(
      appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || [],
      productId
    );

    if (!subscriptionInfo) {
      return {
        valid: false,
        error: 'No active subscription found for this product',
      };
    }

    // Check if subscription is still valid
    const expiresAt = new Date(parseInt(subscriptionInfo.expires_date_ms || '0', 10));
    const isExpired = expiresAt < new Date();

    if (isExpired) {
      return {
        valid: false,
        error: 'Subscription has expired',
      };
    }

    // Activate the subscription in database
    const durationDays = productId === PRODUCT_IDS.ANNUAL ? 365 : 30;
    await this.activateSubscription(
      userId,
      subscriptionInfo.original_transaction_id,
      expiresAt
    );

    return {
      valid: true,
      subscription: {
        tier: 'premium',
        expiresAt: expiresAt.toISOString(),
        productId: subscriptionInfo.product_id,
        originalTransactionId: subscriptionInfo.original_transaction_id,
        isTrialPeriod: subscriptionInfo.is_trial_period === 'true',
      },
    };
  },

  /**
   * Restore purchases for a user
   */
  async restorePurchases(
    userId: string,
    receiptData: string
  ): Promise<{ restored: boolean; subscription?: ValidationResult['subscription'] }> {
    // Verify the receipt with Apple
    const appleResponse = await this.verifyWithApple(receiptData);

    if (appleResponse.status !== APPLE_STATUS_CODES.SUCCESS) {
      return { restored: false };
    }

    // Find any active subscription
    const allPurchases = appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || [];

    // Sort by expiration date to get the most recent
    const sortedPurchases = allPurchases
      .filter(p => p.expires_date_ms && parseInt(p.expires_date_ms, 10) > Date.now())
      .sort((a, b) => parseInt(b.expires_date_ms || '0', 10) - parseInt(a.expires_date_ms || '0', 10));

    if (sortedPurchases.length === 0) {
      return { restored: false };
    }

    const latestSubscription = sortedPurchases[0];
    const expiresAt = new Date(parseInt(latestSubscription.expires_date_ms || '0', 10));

    // Activate the subscription
    await this.activateSubscription(
      userId,
      latestSubscription.original_transaction_id,
      expiresAt
    );

    return {
      restored: true,
      subscription: {
        tier: 'premium',
        expiresAt: expiresAt.toISOString(),
        productId: latestSubscription.product_id,
        originalTransactionId: latestSubscription.original_transaction_id,
        isTrialPeriod: latestSubscription.is_trial_period === 'true',
      },
    };
  },

  /**
   * Verify receipt with Apple servers
   */
  async verifyWithApple(receiptData: string): Promise<AppleReceiptResponse> {
    const requestBody = {
      'receipt-data': receiptData,
      password: config.appleIap.sharedSecret,
      'exclude-old-transactions': true,
    };

    let response = await fetch(config.appleIap.verifyReceiptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    let result = await response.json() as AppleReceiptResponse;

    // If we get sandbox receipt on production, retry with sandbox URL
    if (result.status === APPLE_STATUS_CODES.SANDBOX_RECEIPT_ON_PRODUCTION) {
      response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      result = await response.json() as AppleReceiptResponse;
    }

    return result;
  },

  /**
   * Get the active subscription from receipt info
   */
  getActiveSubscription(
    purchases: AppleInAppPurchase[],
    targetProductId?: string
  ): AppleInAppPurchase | null {
    const validProducts = Object.values(PRODUCT_IDS);

    // Filter to our subscription products
    const subscriptions = purchases.filter(p => validProducts.includes(p.product_id));

    // If looking for specific product
    if (targetProductId) {
      const matching = subscriptions.filter(p => p.product_id === targetProductId);
      if (matching.length === 0) return null;

      // Return the one with latest expiration
      return matching.reduce((latest, current) => {
        const latestExpiry = parseInt(latest.expires_date_ms || '0', 10);
        const currentExpiry = parseInt(current.expires_date_ms || '0', 10);
        return currentExpiry > latestExpiry ? current : latest;
      });
    }

    // Return any active subscription with latest expiration
    if (subscriptions.length === 0) return null;

    return subscriptions.reduce((latest, current) => {
      const latestExpiry = parseInt(latest.expires_date_ms || '0', 10);
      const currentExpiry = parseInt(current.expires_date_ms || '0', 10);
      return currentExpiry > latestExpiry ? current : latest;
    });
  },

  /**
   * Activate subscription in database
   */
  async activateSubscription(
    userId: string,
    originalTransactionId: string,
    expiresAt: Date
  ): Promise<void> {
    // Check if this transaction is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        appleOriginalTransactionId: originalTransactionId,
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
        appleOriginalTransactionId: originalTransactionId,
      },
    });
  },

  /**
   * Get human-readable status message
   */
  getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      [APPLE_STATUS_CODES.INVALID_JSON]: 'Invalid receipt data format',
      [APPLE_STATUS_CODES.INVALID_RECEIPT_DATA]: 'Receipt data is malformed',
      [APPLE_STATUS_CODES.AUTHENTICATION_FAILED]: 'Receipt authentication failed',
      [APPLE_STATUS_CODES.SHARED_SECRET_MISMATCH]: 'Shared secret mismatch',
      [APPLE_STATUS_CODES.SERVER_UNAVAILABLE]: 'Apple server temporarily unavailable',
      [APPLE_STATUS_CODES.SUBSCRIPTION_EXPIRED]: 'Subscription has expired',
    };
    return messages[status] || `Unknown error (code: ${status})`;
  },
};
