import { Request, Response } from 'express';
import { z } from 'zod';
import { subscriptionService } from '../services/subscription.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

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
 * Check if user can scan
 */
export const canScan = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.canUserScan(req.user!.id);
  sendSuccess(res, result);
});

/**
 * Record a scan (decrements daily limit for free users)
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
 * Get today's scans
 */
export const getTodayScans = asyncHandler(async (req: Request, res: Response) => {
  const scans = await subscriptionService.getTodayScans(req.user!.id);
  sendSuccess(res, { scans });
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
 * Get free tier limits (public endpoint)
 */
export const getFreeTierLimits = asyncHandler(async (_req: Request, res: Response) => {
  const limits = subscriptionService.getFreeTierLimits();
  sendSuccess(res, limits);
});
