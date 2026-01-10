import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public endpoints (with optional auth to include current user's position)
router.get('/', optionalAuth, leaderboardController.getLeaderboard);
router.get('/top', leaderboardController.getTopUsers);
router.get('/badges', leaderboardController.getBadgeInfo);

// Authenticated endpoints
router.get('/me', authenticate, leaderboardController.getMyStats);

export default router;
