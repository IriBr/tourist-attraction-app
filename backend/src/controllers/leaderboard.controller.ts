import { Request, Response } from 'express';
import { z } from 'zod';
import { leaderboardService } from '../services/leaderboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const getLeaderboardSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * GET /api/v1/leaderboard
 * Get the global leaderboard with current user's position
 * Available to all users (free and premium)
 */
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = getLeaderboardSchema.parse(req.query);

  const result = await leaderboardService.getLeaderboard(limit, req.user?.id);

  sendSuccess(res, result);
});

/**
 * GET /api/v1/leaderboard/top
 * Get just the top 10 users (quick preview)
 * Available to all users
 */
export const getTopUsers = asyncHandler(async (req: Request, res: Response) => {
  const topUsers = await leaderboardService.getTopUsers(10);

  sendSuccess(res, { leaderboard: topUsers });
});

/**
 * GET /api/v1/leaderboard/me
 * Get current user's leaderboard stats
 * Requires authentication
 */
export const getMyStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await leaderboardService.getUserStats(req.user!.id);

  sendSuccess(res, stats);
});

/**
 * Badge display information for the frontend
 */
export const getBadgeInfo = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    badges: [
      {
        id: 'gold_champion',
        name: 'Gold Champion',
        emoji: '🥇',
        description: 'Ranked #1 on the global leaderboard',
        position: 1,
      },
      {
        id: 'silver_explorer',
        name: 'Silver Explorer',
        emoji: '🥈',
        description: 'Ranked #2 on the global leaderboard',
        position: 2,
      },
      {
        id: 'bronze_voyager',
        name: 'Bronze Voyager',
        emoji: '🥉',
        description: 'Ranked #3 on the global leaderboard',
        position: 3,
      },
      {
        id: 'elite_traveler',
        name: 'Elite Traveler',
        emoji: '🏆',
        description: 'Ranked in the top 10 globally',
        position: '4-10',
      },
      {
        id: 'rising_star',
        name: 'Rising Star',
        emoji: '⭐',
        description: 'Ranked in the top 100 globally',
        position: '11-100',
      },
    ],
  });
});
