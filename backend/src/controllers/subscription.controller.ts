import { Request, Response } from 'express';
import { z } from 'zod';
import { subscriptionService } from '../services/subscription.service.js';
import { stripeService } from '../services/stripe.service.js';
import { appleIapService } from '../services/apple-iap.service.js';
import { googleIapService } from '../services/google-iap.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { config } from '../config/index.js';

const recordScanSchema = z.object({
  photoUrl: z.string().url().optional(),
  result: z.string().optional(),
});

const upgradeSchema = z.object({
  durationDays: z.number().int().positive().optional().default(30),
  // In production, these would come from Stripe webhook
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

/**
 * Get current user's subscription status
 */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await subscriptionService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, status);
});

/**
 * Check if user can use camera scanning (premium feature)
 */
export const canScan = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.canUseFeature(req.user!.id, 'camera_scanning');
  sendSuccess(res, {
    canScan: result.allowed,
    reason: result.reason,
  });
});

/**
 * Record a scan (premium users only)
 */
export const recordScan = asyncHandler(async (req: Request, res: Response) => {
  const data = recordScanSchema.parse(req.body);
  const result = await subscriptionService.recordScan(
    req.user!.id,
    data.photoUrl,
    data.result
  );
  sendCreated(res, result);
});

/**
 * Get today's scans (kept for backwards compatibility)
 */
export const getTodayScans = asyncHandler(async (req: Request, res: Response) => {
  // This endpoint now just returns the premium status
  const status = await subscriptionService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, {
    canUseCameraScanning: status.features.canUseCameraScanning,
    isPremium: status.isPremium,
  });
});

/**
 * Upgrade to premium (simplified - in production use Stripe webhook)
 */
export const upgradeToPremium = asyncHandler(async (req: Request, res: Response) => {
  const data = upgradeSchema.parse(req.body);
  const user = await subscriptionService.upgradeToPremium(
    req.user!.id,
    data.stripeCustomerId,
    data.stripeSubscriptionId,
    data.durationDays
  );

  const status = await subscriptionService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, {
    message: 'Successfully upgraded to Premium!',
    subscription: status,
  });
});

/**
 * Downgrade to free / cancel subscription
 */
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  await subscriptionService.downgradeToFree(req.user!.id);
  const status = await subscriptionService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, {
    message: 'Subscription cancelled. You are now on the free tier.',
    subscription: status,
  });
});

/**
 * Get premium features info (public endpoint)
 */
export const getFreeTierLimits = asyncHandler(async (_req: Request, res: Response) => {
  const features = subscriptionService.getPremiumFeatures();
  sendSuccess(res, {
    freeFeatures: {
      viewAllAttractions: true,
      searchAttractions: true,
      markVisited: true,
      trackProgress: true,
    },
    premiumFeatures: features,
  });
});

// ============ STRIPE INTEGRATION ============

const createCheckoutSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const data = createCheckoutSchema.parse(req.body);

  const checkoutUrl = await stripeService.createCheckoutSession({
    userId: req.user!.id,
    email: req.user!.email,
    plan: data.plan,
    successUrl: data.successUrl,
    cancelUrl: data.cancelUrl,
  });

  sendSuccess(res, { url: checkoutUrl });
});

const billingPortalSchema = z.object({
  returnUrl: z.string().url(),
});

/**
 * Create a Stripe billing portal session
 */
export const createBillingPortal = asyncHandler(async (req: Request, res: Response) => {
  const data = billingPortalSchema.parse(req.body);

  const portalUrl = await stripeService.createBillingPortalSession(
    req.user!.id,
    data.returnUrl
  );

  sendSuccess(res, { url: portalUrl });
});

/**
 * Get Stripe subscription status
 */
export const getStripeStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await stripeService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, status);
});

/**
 * Cancel Stripe subscription at period end
 */
export const cancelStripeSubscription = asyncHandler(async (req: Request, res: Response) => {
  await stripeService.cancelSubscription(req.user!.id);
  const status = await stripeService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, {
    message: 'Subscription will cancel at the end of the current billing period.',
    subscription: status,
  });
});

/**
 * Resume a cancelled Stripe subscription
 */
export const resumeStripeSubscription = asyncHandler(async (req: Request, res: Response) => {
  await stripeService.resumeSubscription(req.user!.id);
  const status = await stripeService.getSubscriptionStatus(req.user!.id);
  sendSuccess(res, {
    message: 'Subscription resumed successfully.',
    subscription: status,
  });
});

/**
 * Handle Stripe webhooks
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' },
    });
  }

  try {
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      success: false,
      error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' },
    });
  }
};

/**
 * Get subscription pricing info (public endpoint)
 */
export const getPricing = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    monthly: {
      price: config.stripe.prices.monthly,
      priceFormatted: '$4.99',
      period: 'month',
    },
    annual: {
      price: config.stripe.prices.annual,
      priceFormatted: '$47.90',
      period: 'year',
      savings: '20%',
      monthlyEquivalent: '$3.99',
    },
  });
});

// ============ APPLE IN-APP PURCHASE INTEGRATION ============

const validateAppleReceiptSchema = z.object({
  receipt: z.string().min(1),
  productId: z.string().min(1),
});

/**
 * Validate Apple receipt and activate subscription
 */
export const validateAppleReceipt = asyncHandler(async (req: Request, res: Response) => {
  const data = validateAppleReceiptSchema.parse(req.body);

  const result = await appleIapService.validateReceipt(
    req.user!.id,
    data.receipt,
    data.productId
  );

  sendSuccess(res, result);
});

const restoreApplePurchasesSchema = z.object({
  receipt: z.string().min(1),
});

/**
 * Restore Apple purchases for user
 */
export const restoreApplePurchases = asyncHandler(async (req: Request, res: Response) => {
  const data = restoreApplePurchasesSchema.parse(req.body);

  const result = await appleIapService.restorePurchases(
    req.user!.id,
    data.receipt
  );

  sendSuccess(res, result);
});

// ============ GOOGLE PLAY IN-APP PURCHASE ============

const validateGooglePurchaseSchema = z.object({
  purchaseToken: z.string().min(1),
  productId: z.string().min(1),
});

/**
 * Validate Google Play purchase and activate subscription
 */
export const validateGooglePurchase = asyncHandler(async (req: Request, res: Response) => {
  const data = validateGooglePurchaseSchema.parse(req.body);

  const result = await googleIapService.validatePurchase(
    req.user!.id,
    data.purchaseToken,
    data.productId
  );

  sendSuccess(res, result);
});

const restoreGooglePurchasesSchema = z.object({
  purchaseToken: z.string().min(1),
  productId: z.string().min(1),
});

/**
 * Restore Google Play purchases for user
 */
export const restoreGooglePurchases = asyncHandler(async (req: Request, res: Response) => {
  const data = restoreGooglePurchasesSchema.parse(req.body);

  const result = await googleIapService.restorePurchases(
    req.user!.id,
    data.purchaseToken,
    data.productId
  );

  sendSuccess(res, result);
});
