import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============ DASHBOARD ============
router.get('/dashboard', adminController.getDashboardStats.bind(adminController));
router.get('/locations/stats', adminController.getLocationStats.bind(adminController));

// ============ USER MANAGEMENT ============
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserById.bind(adminController));
router.patch('/users/:userId/subscription', adminController.updateUserSubscription.bind(adminController));
router.patch('/users/:userId/role', adminController.updateUserRole.bind(adminController));
router.delete('/users/:userId', adminController.deleteUser.bind(adminController));

// ============ ATTRACTION MANAGEMENT ============
router.get('/attractions', adminController.getAllAttractions.bind(adminController));
router.get('/attractions/:attractionId', adminController.getAttractionById.bind(adminController));
router.post('/attractions', adminController.createAttraction.bind(adminController));
router.put('/attractions/:attractionId', adminController.updateAttraction.bind(adminController));
router.delete('/attractions/:attractionId', adminController.deleteAttraction.bind(adminController));

export default router;
