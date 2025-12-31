import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@tourist-app/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  totalItems: number
): void {
  const totalPages = Math.ceil(totalItems / limit);
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
  res.status(200).json(response);
}

export function calculatePagination(page?: number, limit?: number, defaultLimit = 20, maxLimit = 100) {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, limit ?? defaultLimit));
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
}
