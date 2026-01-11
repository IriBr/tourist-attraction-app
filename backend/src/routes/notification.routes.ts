import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// User endpoints (require authentication)
router.post('/register-token', authenticate, notificationController.registerToken.bind(notificationController));
router.delete('/unregister-token', authenticate, notificationController.unregisterToken.bind(notificationController));

export default router;
