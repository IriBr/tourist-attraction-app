import { Request, Response } from 'express';
import { z } from 'zod';
import * as attractionService from '../services/attraction.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { calculatePagination } from '../utils/response.js';
import { AttractionCategory } from '@tourist-app/shared';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Check if request uses filter parameters (premium feature)
 */
function hasFilterParams(params: any): boolean {
  return !!(params.category || params.minRating !== undefined || params.isFree !== undefined);
}

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.nativeEnum(AttractionCategory).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().max(50000).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  isFree: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.enum(['distance', 'rating', 'reviews', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const nearbySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive().max(50000).optional(),
  category: z.nativeEnum(AttractionCategory).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

const categorySchema = z.object({
  category: z.nativeEnum(AttractionCategory),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const searchAttractions = asyncHandler(
  async (req: Request, res: Response) => {
    const params = searchSchema.parse(req.query);
    const { page, limit } = calculatePagination(params.page, params.limit);

    // Check if filters are being used (premium feature)
    if (hasFilterParams(params) && req.user?.id) {
      const canFilter = await subscriptionService.canUseFeature(req.user.id, 'filters');
      if (!canFilter.allowed) {
        throw new ForbiddenError(canFilter.reason || 'Filters require Premium subscription');
      }
    } else if (hasFilterParams(params) && !req.user?.id) {
      throw new ForbiddenError('Filters require Premium subscription. Please sign in and upgrade.');
    }

    const { items, total } = await attractionService.searchAttractions(
      { ...params, page, limit },
      req.user?.id
    );

    sendPaginated(res, items, page, limit, total);
  }
);

export const getAttractionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const attraction = await attractionService.getAttractionById(id, req.user?.id);
    sendSuccess(res, attraction);
  }
);

export const getNearbyAttractions = asyncHandler(
  async (req: Request, res: Response) => {
    const params = nearbySchema.parse(req.query);

    // Check if category filter is being used (premium feature)
    if (params.category && req.user?.id) {
      const canFilter = await subscriptionService.canUseFeature(req.user.id, 'filters');
      if (!canFilter.allowed) {
        throw new ForbiddenError(canFilter.reason || 'Filters require Premium subscription');
      }
    } else if (params.category && !req.user?.id) {
      throw new ForbiddenError('Filters require Premium subscription. Please sign in and upgrade.');
    }

    const attractions = await attractionService.getNearbyAttractions(
      params.latitude,
      params.longitude,
      params.radiusMeters,
      params.category,
      params.limit,
      req.user?.id
    );

    sendSuccess(res, { items: attractions });
  }
);

export const getAttractionsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = categorySchema.parse(req.params);

    // Category filtering is a premium feature
    if (req.user?.id) {
      const canFilter = await subscriptionService.canUseFeature(req.user.id, 'filters');
      if (!canFilter.allowed) {
        throw new ForbiddenError(canFilter.reason || 'Browsing by category requires Premium subscription');
      }
    } else {
      throw new ForbiddenError('Browsing by category requires Premium subscription. Please sign in and upgrade.');
    }

    const { page, limit } = calculatePagination(
      req.query.page ? Number(req.query.page) : undefined,
      req.query.limit ? Number(req.query.limit) : undefined
    );

    const { items, total } = await attractionService.getAttractionsByCategory(
      category,
      page,
      limit,
      req.user?.id
    );

    sendPaginated(res, items, page, limit, total);
  }
);

export const getPopularAttractions = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10;
    const attractions = await attractionService.getPopularAttractions(
      limit,
      req.user?.id
    );

    sendSuccess(res, { items: attractions });
  }
);

const nearbyUnvisitedSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive().max(1000).optional(),
  limit: z.coerce.number().int().positive().max(10).optional(),
});

export const getNearbyUnvisitedAttractions = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return sendSuccess(res, { items: [], isPremiumFeature: true });
    }

    // Proximity notifications are a premium feature
    const canReceive = await subscriptionService.canUseFeature(req.user.id, 'proximity_notifications');
    if (!canReceive.allowed) {
      return sendSuccess(res, {
        items: [],
        isPremiumFeature: true,
        message: canReceive.reason,
      });
    }

    const params = nearbyUnvisitedSchema.parse(req.query);

    const attractions = await attractionService.getNearbyUnvisitedAttractions(
      params.latitude,
      params.longitude,
      params.radiusMeters || 50,
      req.user.id,
      params.limit || 5
    );

    sendSuccess(res, { items: attractions });
  }
);
