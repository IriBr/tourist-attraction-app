import { Router } from 'express';
import { subscriptionController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public endpoints
router.get('/limits', subscriptionController.getFreeTierLimits);
router.get('/pricing', subscriptionController.getPricing);

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

// Cancel subscription (legacy)
router.post('/cancel', subscriptionController.cancelSubscription);

// ============ STRIPE ENDPOINTS ============

// Create checkout session for Stripe payment
router.post('/stripe/checkout', subscriptionController.createCheckoutSession);

// Create billing portal session
router.post('/stripe/portal', subscriptionController.createBillingPortal);

// Get Stripe subscription status
router.get('/stripe/status', subscriptionController.getStripeStatus);

// Cancel Stripe subscription at period end
router.post('/stripe/cancel', subscriptionController.cancelStripeSubscription);

// Resume cancelled subscription
router.post('/stripe/resume', subscriptionController.resumeStripeSubscription);

export default router;
