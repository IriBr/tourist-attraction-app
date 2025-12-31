import { Request, Response } from 'express';
import { z } from 'zod';
import { reviewService } from '../services/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  calculatePagination,
} from '../utils/response.js';
import { VALIDATION } from '@tourist-app/shared';

const reviewSearchSchema = z.object({
  attractionId: z.string().uuid(),
  sortBy: z.enum(['recent', 'rating', 'helpful']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const createReviewSchema = z.object({
  attractionId: z.string().uuid(),
  rating: z.number().int().min(VALIDATION.RATING_MIN).max(VALIDATION.RATING_MAX),
  title: z
    .string()
    .min(VALIDATION.REVIEW_TITLE_MIN_LENGTH)
    .max(VALIDATION.REVIEW_TITLE_MAX_LENGTH),
  content: z
    .string()
    .min(VALIDATION.REVIEW_CONTENT_MIN_LENGTH)
    .max(VALIDATION.REVIEW_CONTENT_MAX_LENGTH),
  images: z.array(z.string().url()).max(VALIDATION.MAX_REVIEW_IMAGES).optional(),
  visitDate: z.string().datetime().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(VALIDATION.RATING_MIN).max(VALIDATION.RATING_MAX).optional(),
  title: z
    .string()
    .min(VALIDATION.REVIEW_TITLE_MIN_LENGTH)
    .max(VALIDATION.REVIEW_TITLE_MAX_LENGTH)
    .optional(),
  content: z
    .string()
    .min(VALIDATION.REVIEW_CONTENT_MIN_LENGTH)
    .max(VALIDATION.REVIEW_CONTENT_MAX_LENGTH)
    .optional(),
  images: z.array(z.string().url()).max(VALIDATION.MAX_REVIEW_IMAGES).optional(),
  visitDate: z.string().datetime().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const getReviewsForAttraction = asyncHandler(
  async (req: Request, res: Response) => {
    const params = reviewSearchSchema.parse(req.query);
    const { page, limit } = calculatePagination(params.page, params.limit);

    const { items, total } = await reviewService.getReviewsForAttraction(
      { ...params, page, limit },
      req.user?.id
    );

    sendPaginated(res, items, page, limit, total);
  }
);

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const review = await reviewService.getReviewById(id, req.user?.id);
  sendSuccess(res, review);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const data = createReviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user!.id, data);
  sendCreated(res, review);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateReviewSchema.parse(req.body);
  const review = await reviewService.updateReview(id, req.user!.id, data);
  sendSuccess(res, review);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await reviewService.deleteReview(id, req.user!.id);
  sendNoContent(res);
});

export const markReviewHelpful = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    await reviewService.markReviewHelpful(id, req.user!.id);
    sendSuccess(res, { message: 'Review helpful status toggled' });
  }
);

export const getReviewStats = asyncHandler(async (req: Request, res: Response) => {
  const attractionId = z.string().uuid().parse(req.query.attractionId);
  const stats = await reviewService.getReviewStats(attractionId);
  sendSuccess(res, stats);
});

export const getUserReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = calculatePagination(
    req.query.page ? Number(req.query.page) : undefined,
    req.query.limit ? Number(req.query.limit) : undefined
  );

  const { items, total } = await reviewService.getUserReviews(
    req.user!.id,
    page,
    limit
  );

  sendPaginated(res, items, page, limit, total);
});
