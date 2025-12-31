import { Router } from 'express';
import { reviewController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public/Optional auth routes
router.get('/', optionalAuth, reviewController.getReviewsForAttraction);
router.get('/stats', reviewController.getReviewStats);
router.get('/:id', optionalAuth, reviewController.getReviewById);

// Protected routes
router.post('/', authenticate, reviewController.createReview);
router.patch('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);
router.post('/:id/helpful', authenticate, reviewController.markReviewHelpful);
router.get('/user/me', authenticate, reviewController.getUserReviews);

export default router;
