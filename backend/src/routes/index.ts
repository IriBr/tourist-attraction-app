import { Router } from 'express';
import authRoutes from './auth.routes.js';
import attractionRoutes from './attraction.routes.js';
import reviewRoutes from './review.routes.js';
import favoriteRoutes from './favorite.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/attractions', attractionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);

export default router;
