import { Router } from 'express';
import { visitController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All visit routes require authentication
router.use(authenticate);

router.get('/', visitController.getUserVisits);
router.get('/stats', visitController.getUserStats);
router.get('/stats/continent/:continent', visitController.getContinentStats);
router.get('/stats/country/:country', visitController.getCountryStats);
router.get('/stats/city/:city', visitController.getCityStats);
router.get('/check/:attractionId', visitController.checkVisit);
router.post('/', visitController.markVisited);
router.delete('/:attractionId', visitController.removeVisit);

export default router;
