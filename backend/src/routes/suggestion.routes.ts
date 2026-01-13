import { Router } from 'express';
import { suggestionController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', suggestionController.createSuggestion);
router.get('/me', suggestionController.getUserSuggestions);
router.get('/attraction/:attractionId', suggestionController.getSuggestionsByAttraction);

export default router;
