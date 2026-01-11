import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { BadRequestError } from '../utils/errors.js';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

class NotificationController {
  /**
   * Register a push token for the authenticated user
   * POST /notifications/register-token
   */
  async registerToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { token, platform } = req.body;

      if (!token || typeof token !== 'string') {
        throw new BadRequestError('Push token is required');
      }

      if (!platform || !['ios', 'android'].includes(platform)) {
        throw new BadRequestError('Platform must be "ios" or "android"');
      }

      await notificationService.registerPushToken(userId, token, platform);

      res.json({
        success: true,
        message: 'Push token registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unregister a push token for the authenticated user
   * DELETE /notifications/unregister-token
   */
  async unregisterToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { token } = req.body;

      if (token) {
        // Unregister specific token
        await notificationService.unregisterPushToken(userId, token);
      } else {
        // Unregister all tokens for user (logout scenario)
        await notificationService.unregisterAllTokens(userId);
      }

      res.json({
        success: true,
        message: 'Push token(s) unregistered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send notification to users (admin only)
   * POST /admin/notifications/send
   */
  async sendNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, body, target, userId } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new BadRequestError('Title is required');
      }

      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        throw new BadRequestError('Body is required');
      }

      if (!target || !['all', 'premium', 'free', 'user'].includes(target)) {
        throw new BadRequestError('Target must be "all", "premium", "free", or "user"');
      }

      if (target === 'user' && !userId) {
        throw new BadRequestError('userId is required when target is "user"');
      }

      const result = await notificationService.sendToUsers(
        { title: title.trim(), body: body.trim() },
        { target, userId }
      );

      res.json({
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed,
          message: `Notification sent to ${result.sent} device(s)`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification token statistics (admin only)
   * GET /admin/notifications/stats
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await notificationService.getTokenStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
