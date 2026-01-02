import { Request, Response } from 'express';
import { z } from 'zod';
import { badgeService } from '../services/badge.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { LocationType, BadgeTier } from '@prisma/client';

const locationTypeSchema = z.enum(['city', 'country', 'continent']);
const badgeTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum']);

const getBadgesQuerySchema = z.object({
  locationType: locationTypeSchema.optional(),
  tier: badgeTierSchema.optional(),
});

const progressParamsSchema = z.object({
  locationType: locationTypeSchema,
  locationId: z.string().uuid(),
});

const timelineQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Get all badges for the authenticated user
 * GET /badges
 */
export const getUserBadges = asyncHandler(async (req: Request, res: Response) => {
  const filters = getBadgesQuerySchema.parse(req.query);
  const badges = await badgeService.getUserBadges(req.user!.id, {
    locationType: filters.locationType as LocationType | undefined,
    tier: filters.tier as BadgeTier | undefined,
  });

  const summary = await badgeService.getBadgeSummary(req.user!.id);

  sendSuccess(res, { badges, summary });
});

/**
 * Get badge progress for all visited locations
 * GET /badges/progress
 */
export const getAllProgress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await badgeService.getAllProgress(req.user!.id);
  sendSuccess(res, progress);
});

/**
 * Get badge progress for a specific location
 * GET /badges/progress/:locationType/:locationId
 */
export const getLocationProgress = asyncHandler(async (req: Request, res: Response) => {
  const { locationType, locationId } = progressParamsSchema.parse(req.params);
  const progress = await badgeService.getBadgeProgress(
    req.user!.id,
    locationType as LocationType,
    locationId
  );
  sendSuccess(res, progress);
});

/**
 * Get badge earning timeline
 * GET /badges/timeline
 */
export const getBadgeTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = timelineQuerySchema.parse(req.query);
  const timeline = await badgeService.getBadgeTimeline(req.user!.id, limit);
  sendSuccess(res, { items: timeline, total: timeline.length });
});

/**
 * Get badge summary (counts by tier and type)
 * GET /badges/summary
 */
export const getBadgeSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await badgeService.getBadgeSummary(req.user!.id);
  sendSuccess(res, summary);
});
