import { Router } from 'express';
import { attractionController } from '../controllers/index.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = Router();

// All attraction routes use optional auth (to populate isFavorited)
router.get('/search', optionalAuth, attractionController.searchAttractions);
router.get('/nearby', optionalAuth, attractionController.getNearbyAttractions);
router.get('/nearby-unvisited', authenticate, attractionController.getNearbyUnvisitedAttractions);
router.get('/popular', optionalAuth, attractionController.getPopularAttractions);
router.get('/category/:category', optionalAuth, attractionController.getAttractionsByCategory);
router.get('/:id', optionalAuth, attractionController.getAttractionById);

export default router;
