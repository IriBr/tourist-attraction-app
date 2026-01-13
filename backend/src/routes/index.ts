import { Router } from 'express';
import authRoutes from './auth.routes.js';
import attractionRoutes from './attraction.routes.js';
import reviewRoutes from './review.routes.js';
import favoriteRoutes from './favorite.routes.js';
import visitRoutes from './visit.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import adminRoutes from './admin.routes.js';
import locationRoutes from './location.routes.js';
import publicLocationRoutes from './public-location.routes.js';
import badgeRoutes from './badge.routes.js';
import verificationRoutes from './verification.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import notificationRoutes from './notification.routes.js';
import suggestionRoutes from './suggestion.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/attractions', attractionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/visits', visitRoutes);
router.use('/badges', badgeRoutes);
router.use('/verification', verificationRoutes);
router.use('/locations', publicLocationRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/locations', locationRoutes);

export default router;
