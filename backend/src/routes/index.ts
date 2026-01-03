import { Router, Request, Response } from 'express';
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
import { seedDatabase } from '../services/seed.service.js';

const router = Router();

// Temporary public seed endpoint with secret key (remove after initial setup)
const SEED_SECRET = 'wandr-seed-2024-secure';
router.post('/setup-seed', async (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    if (secret !== SEED_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid secret' });
    }
    const result = await seedDatabase();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.use('/auth', authRoutes);
router.use('/attractions', attractionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/visits', visitRoutes);
router.use('/badges', badgeRoutes);
router.use('/verification', verificationRoutes);
router.use('/locations', publicLocationRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/locations', locationRoutes);

export default router;
