import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type PurchaseError,
  type ProductSubscription,
  type EventSubscription,
  ErrorCode,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { subscriptionApi } from '../api';

// Product IDs - must match App Store Connect
export const PRODUCT_IDS = {
  MONTHLY: 'wandr_premium_monthly',
  ANNUAL: 'wandr_premium_annual',
};

const SUBSCRIPTION_SKUS = [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL];

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

class IAPService {
  private isConnected = false;
  private products: IAPProduct[] = [];
  private purchaseUpdateSubscription: EventSubscription | null = null;
  private purchaseErrorSubscription: EventSubscription | null = null;
  private onPurchaseSuccess: (() => void) | null = null;
  private onPurchaseError: ((error: string) => void) | null = null;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const result = await initConnection();
      console.log('IAP Connection result:', result);
      this.isConnected = true;

      // Set up purchase listeners
      this.setupListeners();
    } catch (error) {
      console.error('Failed to connect to IAP:', error);
      throw error;
    }
  }

  private setupListeners(): void {
    // Remove existing listeners if any
    this.removeListeners();

    // Listen for successful purchases
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('Purchase updated:', purchase);

        const receipt = purchase.purchaseToken;
        if (receipt) {
          try {
            // Validate receipt with backend
            await this.validatePurchase(purchase);

            // Finish the transaction
            await finishTransaction({ purchase, isConsumable: false });
            console.log('Transaction finished successfully');

            // Notify success callback
            if (this.onPurchaseSuccess) {
              this.onPurchaseSuccess();
            }
          } catch (error) {
            console.error('Error processing purchase:', error);
            if (this.onPurchaseError) {
              this.onPurchaseError('Failed to process purchase. Please contact support.');
            }
          }
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.log('Purchase error:', error);

        if (error.code === ErrorCode.UserCancelled) {
          // User cancelled - not an error
          if (this.onPurchaseError) {
            this.onPurchaseError('Purchase was cancelled.');
          }
        } else {
          if (this.onPurchaseError) {
            this.onPurchaseError(error.message || 'Purchase failed. Please try again.');
          }
        }
      }
    );
  }

  private removeListeners(): void {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      this.removeListeners();
      await endConnection();
      this.isConnected = false;
    } catch (error) {
      console.error('Failed to disconnect from IAP:', error);
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log('Fetching subscriptions for SKUs:', SUBSCRIPTION_SKUS);
      const subscriptions = await fetchProducts({
        skus: SUBSCRIPTION_SKUS,
        type: 'subs',
      });
      console.log('Received subscriptions:', subscriptions);

      if (!subscriptions || subscriptions.length === 0) {
        console.warn('No subscriptions returned from App Store');
        return [];
      }

      this.products = subscriptions.map((sub) => {
        const productSub = sub as ProductSubscription;
        return {
          productId: productSub.id,
          title: productSub.title || productSub.id,
          description: productSub.description || '',
          price: productSub.displayPrice || '',
          priceAmountMicros: (productSub.price || 0) * 1000000,
          priceCurrencyCode: productSub.currency || 'USD',
        };
      });

      return this.products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(
    productId: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.connect();
      } catch (connectError) {
        console.error('IAP connect failed:', connectError);
        throw new Error('Unable to connect to the App Store. Please try again.');
      }
    }

    // Store callbacks for listener
    this.onPurchaseSuccess = onSuccess || null;
    this.onPurchaseError = onError || null;

    try {
      console.log('Requesting subscription for:', productId);

      // Use the new requestPurchase API with platform-specific config
      if (Platform.OS === 'ios') {
        await requestPurchase({
          request: {
            apple: { sku: productId },
          },
          type: 'subs',
        });
      } else {
        await requestPurchase({
          request: {
            google: { skus: [productId] },
          },
          type: 'subs',
        });
      }

      console.log('Purchase request initiated');
      // The actual result will come through the purchaseUpdatedListener
    } catch (error: any) {
      console.error('Purchase request failed:', error);

      // Clear callbacks
      this.onPurchaseSuccess = null;
      this.onPurchaseError = null;

      if (error?.code === ErrorCode.UserCancelled) {
        throw new Error('Purchase was cancelled.');
      }
      throw new Error(error?.message || 'Purchase failed. Please try again.');
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log('Restoring purchases...');
      const purchases = await getAvailablePurchases();
      console.log('Available purchases:', purchases);

      if (purchases && purchases.length > 0) {
        // Find active subscription
        for (const purchase of purchases) {
          const isValid = await this.validatePurchase(purchase);
          if (isValid) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return false;
    }
  }

  private async validatePurchase(purchase: Purchase): Promise<boolean> {
    try {
      const receipt = purchase.purchaseToken;
      if (!receipt) {
        console.warn('No receipt found on purchase');
        return false;
      }

      // Send receipt to backend for validation
      const response = await subscriptionApi.validateAppleReceipt(
        receipt,
        purchase.productId
      );

      return response.valid;
    } catch (error) {
      console.error('Receipt validation failed:', error);
      return false;
    }
  }
}

export const iapService = new IAPService();
