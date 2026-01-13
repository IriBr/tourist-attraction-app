import { Request, Response } from 'express';
import { z } from 'zod';
import * as suggestionService from '../services/suggestion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  calculatePagination,
} from '../utils/response.js';
import {
  VALIDATION,
  SuggestionType,
  SuggestionStatus,
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
  SuggestionSearchParams,
} from '@tourist-app/shared';

const createSuggestionSchema = z
  .object({
    attractionId: z.string().uuid(),
    type: z.enum(['suggest_remove', 'suggest_verify', 'comment']),
    comment: z
      .string()
      .min(VALIDATION.SUGGESTION_COMMENT_MIN_LENGTH)
      .max(VALIDATION.SUGGESTION_COMMENT_MAX_LENGTH)
      .optional(),
  })
  .refine(
    (data) => data.type !== 'comment' || (data.comment && data.comment.length > 0),
    { message: 'Comment is required for comment type suggestions', path: ['comment'] }
  );

const suggestionSearchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'resolved']).optional(),
  type: z.enum(['suggest_remove', 'suggest_verify', 'comment']).optional(),
  attractionId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const updateSuggestionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'resolved']),
  adminNotes: z.string().max(1000).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const attractionIdParamSchema = z.object({
  attractionId: z.string().uuid(),
});

// User endpoints
export const createSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const data = createSuggestionSchema.parse(req.body);
  const request: CreateSuggestionRequest = {
    attractionId: data.attractionId,
    type: data.type as SuggestionType,
    comment: data.comment,
  };
  const suggestion = await suggestionService.createSuggestion(req.user!.id, request);
  sendCreated(res, suggestion);
});

export const getUserSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = calculatePagination(
    req.query.page ? Number(req.query.page) : undefined,
    req.query.limit ? Number(req.query.limit) : undefined
  );

  const { items, total } = await suggestionService.getUserSuggestions(
    req.user!.id,
    page,
    limit
  );

  sendPaginated(res, items, page, limit, total);
});

export const getSuggestionsByAttraction = asyncHandler(
  async (req: Request, res: Response) => {
    const { attractionId } = attractionIdParamSchema.parse(req.params);
    const suggestions = await suggestionService.getSuggestionsByAttraction(attractionId);
    sendSuccess(res, suggestions);
  }
);

// Admin endpoints
export const getAllSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const params = suggestionSearchSchema.parse(req.query);
  const { page, limit } = calculatePagination(params.page, params.limit);

  const searchParams: SuggestionSearchParams = {
    status: params.status as SuggestionStatus | undefined,
    type: params.type as SuggestionType | undefined,
    attractionId: params.attractionId,
    page,
    limit,
  };

  const { items, total } = await suggestionService.getAllSuggestions(searchParams);

  sendPaginated(res, items, page, limit, total);
});

export const getSuggestionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const suggestion = await suggestionService.getSuggestionById(id);
  sendSuccess(res, suggestion);
});

export const updateSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateSuggestionSchema.parse(req.body);
  const request: UpdateSuggestionRequest = {
    status: data.status as SuggestionStatus,
    adminNotes: data.adminNotes,
  };
  const suggestion = await suggestionService.updateSuggestion(id, req.user!.id, request);
  sendSuccess(res, suggestion);
});

export const deleteSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await suggestionService.deleteSuggestion(id);
  sendNoContent(res);
});

export const getSuggestionStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await suggestionService.getSuggestionStats();
  sendSuccess(res, stats);
});

// Attraction verification
export const setAttractionVerified = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { isVerified } = z.object({ isVerified: z.boolean() }).parse(req.body);
  const result = await suggestionService.setAttractionVerified(id, isVerified);
  sendSuccess(res, result);
});
