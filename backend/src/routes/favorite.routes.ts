import { Router } from 'express';
import { favoriteController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All favorite routes require authentication
router.use(authenticate);

router.get('/', favoriteController.getUserFavorites);
router.get('/count', favoriteController.getFavoritesCount);
router.get('/check/:attractionId', favoriteController.checkFavorite);
router.post('/', favoriteController.addFavorite);
router.delete('/:attractionId', favoriteController.removeFavorite);

export default router;
