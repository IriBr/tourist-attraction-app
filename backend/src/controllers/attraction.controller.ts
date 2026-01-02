import { Request, Response } from 'express';
import { z } from 'zod';
import * as attractionService from '../services/attraction.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { calculatePagination } from '../utils/response.js';
import { AttractionCategory } from '@tourist-app/shared';

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

    const { items, total } = await attractionService.searchAttractions(
      { ...params, page, limit },
      req.user?.id
    );

    // Apply subscription-based limits
    const limitedResults = await attractionService.applySubscriptionLimit(
      items,
      total,
      req.user?.id
    );

    sendPaginated(res, limitedResults.items, page, limit, limitedResults.total, {
      isLimited: limitedResults.isLimited,
      subscriptionLimit: limitedResults.limit,
    });
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

    const attractions = await attractionService.getNearbyAttractions(
      params.latitude,
      params.longitude,
      params.radiusMeters,
      params.category,
      params.limit,
      req.user?.id
    );

    // Apply subscription-based limits
    const limitedResults = await attractionService.applySubscriptionLimit(
      attractions,
      attractions.length,
      req.user?.id
    );

    sendSuccess(res, {
      items: limitedResults.items,
      isLimited: limitedResults.isLimited,
      subscriptionLimit: limitedResults.limit,
    });
  }
);

export const getAttractionsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = categorySchema.parse(req.params);
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

    // Apply subscription-based limits
    const limitedResults = await attractionService.applySubscriptionLimit(
      items,
      total,
      req.user?.id
    );

    sendPaginated(res, limitedResults.items, page, limit, limitedResults.total, {
      isLimited: limitedResults.isLimited,
      subscriptionLimit: limitedResults.limit,
    });
  }
);

export const getPopularAttractions = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10;
    const attractions = await attractionService.getPopularAttractions(
      limit,
      req.user?.id
    );

    // Apply subscription-based limits
    const limitedResults = await attractionService.applySubscriptionLimit(
      attractions,
      attractions.length,
      req.user?.id
    );

    sendSuccess(res, {
      items: limitedResults.items,
      isLimited: limitedResults.isLimited,
      subscriptionLimit: limitedResults.limit,
    });
  }
);
