import { Router } from 'express';
import * as badgeController from '../controllers/badge.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All badge routes require authentication
router.use(authenticate);

// Get all user badges with summary
router.get('/', badgeController.getUserBadges);

// Get progress for all visited locations
router.get('/progress', badgeController.getAllProgress);

// Get progress for a specific location
router.get('/progress/:locationType/:locationId', badgeController.getLocationProgress);

// Get badge earning timeline
router.get('/timeline', badgeController.getBadgeTimeline);

// Get badge summary (counts by tier and type)
router.get('/summary', badgeController.getBadgeSummary);

export default router;
