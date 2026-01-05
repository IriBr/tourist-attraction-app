import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import { subscriptionApi } from '../api';

// Product IDs - must match App Store Connect
export const PRODUCT_IDS = {
  MONTHLY: 'wandr_premium_monthly',
  ANNUAL: 'wandr_premium_annual',
};

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

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await InAppPurchases.connectAsync();
      this.isConnected = true;

      // Set up purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach(async (purchase) => {
            if (!purchase.acknowledged) {
              // Validate receipt with backend
              await this.validatePurchase(purchase);

              // Finish the transaction
              await InAppPurchases.finishTransactionAsync(purchase, true);
            }
          });
        } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          console.log('User cancelled the purchase');
        } else {
          console.error('Purchase error:', errorCode);
        }
      });
    } catch (error) {
      console.error('Failed to connect to IAP:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await InAppPurchases.disconnectAsync();
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
      const { responseCode, results } = await InAppPurchases.getProductsAsync([
        PRODUCT_IDS.MONTHLY,
        PRODUCT_IDS.ANNUAL,
      ]);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        this.products = results.map((product) => ({
          productId: product.productId,
          title: product.title,
          description: product.description,
          price: product.price,
          priceAmountMicros: product.priceAmountMicros,
          priceCurrencyCode: product.priceCurrencyCode,
        }));
        return this.products;
      }

      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      await InAppPurchases.purchaseItemAsync(productId);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        // Find active subscription
        for (const purchase of results) {
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

  private async validatePurchase(purchase: InAppPurchases.InAppPurchase): Promise<boolean> {
    try {
      // Send receipt to backend for validation
      const response = await subscriptionApi.validateAppleReceipt(
        purchase.transactionReceipt || '',
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
