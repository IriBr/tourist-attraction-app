import { Request, Response } from 'express';
import { z } from 'zod';
import { favoriteService } from '../services/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  calculatePagination,
} from '../utils/response.js';

const addFavoriteSchema = z.object({
  attractionId: z.string().uuid(),
});

const listFavoritesSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['recent', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const attractionIdSchema = z.object({
  attractionId: z.string().uuid(),
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const data = addFavoriteSchema.parse(req.body);
  const favorite = await favoriteService.addFavorite(req.user!.id, data.attractionId);
  sendCreated(res, favorite);
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { attractionId } = attractionIdSchema.parse(req.params);
  await favoriteService.removeFavorite(req.user!.id, attractionId);
  sendNoContent(res);
});

export const getUserFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const params = listFavoritesSchema.parse(req.query);
    const { page, limit } = calculatePagination(params.page, params.limit);

    const { items, total } = await favoriteService.getUserFavorites(req.user!.id, {
      ...params,
      page,
      limit,
    });

    sendPaginated(res, items, page, limit, total);
  }
);

export const checkFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { attractionId } = attractionIdSchema.parse(req.params);
  const isFavorited = await favoriteService.isFavorited(req.user!.id, attractionId);
  sendSuccess(res, { isFavorited });
});

export const getFavoritesCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await favoriteService.getFavoritesCount(req.user!.id);
    sendSuccess(res, { count });
  }
);
