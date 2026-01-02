import { Router } from 'express';
import { subscriptionController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public endpoint - get free tier limits
router.get('/limits', subscriptionController.getFreeTierLimits);

// All other subscription routes require authentication
router.use(authenticate);

// Get subscription status
router.get('/status', subscriptionController.getStatus);

// Check if user can scan
router.get('/can-scan', subscriptionController.canScan);

// Record a scan
router.post('/scan', subscriptionController.recordScan);

// Get today's scans
router.get('/scans/today', subscriptionController.getTodayScans);

// Upgrade to premium (simplified for demo - production would use Stripe)
router.post('/upgrade', subscriptionController.upgradeToPremium);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

export default router;
