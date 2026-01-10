import { Request, Response } from 'express';
import { z } from 'zod';
import { visitService } from '../services/index.js';
import { leaderboardService } from '../services/leaderboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  calculatePagination,
} from '../utils/response.js';

const markVisitedSchema = z.object({
  attractionId: z.string().uuid(),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  visitDate: z.string().datetime().optional(),
});

const listVisitsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['recent', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const attractionIdSchema = z.object({
  attractionId: z.string().uuid(),
});

const continentSchema = z.object({
  continent: z.string(),
});

const countrySchema = z.object({
  country: z.string(),
});

const citySchema = z.object({
  city: z.string(),
});

export const markVisited = asyncHandler(async (req: Request, res: Response) => {
  const data = markVisitedSchema.parse(req.body);
  const result = await visitService.markVisited(req.user!.id, data);
  sendCreated(res, result);
});

export const removeVisit = asyncHandler(async (req: Request, res: Response) => {
  const { attractionId } = attractionIdSchema.parse(req.params);
  await visitService.removeVisit(req.user!.id, attractionId);
  sendNoContent(res);
});

export const getUserVisits = asyncHandler(
  async (req: Request, res: Response) => {
    const params = listVisitsSchema.parse(req.query);
    const { page, limit } = calculatePagination(params.page, params.limit);

    const { items, total } = await visitService.getUserVisits(req.user!.id, {
      ...params,
      page,
      limit,
    });

    sendPaginated(res, items, page, limit, total);
  }
);

export const checkVisit = asyncHandler(async (req: Request, res: Response) => {
  const { attractionId } = attractionIdSchema.parse(req.params);
  const isVisited = await visitService.isVisited(req.user!.id, attractionId);
  sendSuccess(res, { isVisited });
});

export const getUserStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [stats, leaderboardStats] = await Promise.all([
      visitService.getUserStats(req.user!.id),
      leaderboardService.getUserStats(req.user!.id),
    ]);

    sendSuccess(res, {
      ...stats,
      leaderboard: {
        rank: leaderboardStats.rank,
        badge: leaderboardStats.badge,
        isEligible: leaderboardStats.isEligible,
      },
    });
  }
);

export const getContinentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { continent } = continentSchema.parse(req.params);
    const stats = await visitService.getContinentStats(req.user!.id, continent);
    sendSuccess(res, stats);
  }
);

export const getCountryStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { country } = countrySchema.parse(req.params);
    const stats = await visitService.getCountryStats(req.user!.id, country);
    sendSuccess(res, stats);
  }
);

export const getCityStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { city } = citySchema.parse(req.params);
    const stats = await visitService.getCityStats(req.user!.id, city);
    sendSuccess(res, stats);
  }
);
