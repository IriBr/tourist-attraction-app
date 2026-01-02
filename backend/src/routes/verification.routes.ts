import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  verifyAttraction,
  confirmSuggestion,
  getVerificationStatus,
} from '../controllers/verification.controller.js';

const router = Router();

// All verification routes require authentication
router.use(authenticate);

// Verify an attraction from an image
router.post('/verify', verifyAttraction);

// Confirm a suggested match
router.post('/confirm', confirmSuggestion);

// Get verification status (scans remaining)
router.get('/status', getVerificationStatus);

export default router;
