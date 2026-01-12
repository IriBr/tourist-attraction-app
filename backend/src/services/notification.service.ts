import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../config/database.js';
import { SubscriptionTier } from '@prisma/client';

const expo = new Expo();

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendNotificationOptions {
  target: 'all' | 'premium' | 'free' | 'user';
  userId?: string; // Required when target is 'user'
}

class NotificationService {
  /**
   * Register a push token for a user
   */
  async registerPushToken(userId: string, token: string, platform: string): Promise<void> {
    // Validate Expo push token format
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    // Upsert the token - update if exists, create if not
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        token,
        userId,
        platform,
        isActive: true,
      },
    });
  }

  /**
   * Unregister a push token (mark as inactive)
   */
  async unregisterPushToken(userId: string, token: string): Promise<void> {
    await prisma.pushToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }

  /**
   * Unregister all tokens for a user (on logout)
   */
  async unregisterAllTokens(userId: string): Promise<void> {
    await prisma.pushToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, notification: NotificationPayload): Promise<number> {
    const tokens = await prisma.pushToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return 0;
    }

    const messages = tokens.map((t) => this.createMessage(t.token, notification));
    await this.sendMessages(messages);
    return tokens.length;
  }

  /**
   * Send notification to multiple users based on filter
   */
  async sendToUsers(
    notification: NotificationPayload,
    options: SendNotificationOptions
  ): Promise<{ sent: number; failed: number }> {
    let userFilter: { subscriptionTier?: SubscriptionTier; id?: string } = {};

    switch (options.target) {
      case 'premium':
        userFilter = { subscriptionTier: 'premium' };
        break;
      case 'free':
        userFilter = { subscriptionTier: 'free' };
        break;
      case 'user':
        if (!options.userId) {
          throw new Error('userId is required when target is "user"');
        }
        userFilter = { id: options.userId };
        break;
      case 'all':
      default:
        // No filter - send to all users
        break;
    }

    // Get all active tokens for matching users
    const tokens = await prisma.pushToken.findMany({
      where: {
        isActive: true,
        user: userFilter,
      },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const messages = tokens.map((t) => this.createMessage(t.token, notification));
    const result = await this.sendMessages(messages);

    return result;
  }

  /**
   * Create an Expo push message
   */
  private createMessage(token: string, notification: NotificationPayload): ExpoPushMessage {
    return {
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };
  }

  /**
   * Send messages in chunks and handle responses
   */
  private async sendMessages(
    messages: ExpoPushMessage[]
  ): Promise<{ sent: number; failed: number }> {
    console.log('[NotificationService] Sending', messages.length, 'messages');
    const chunks = expo.chunkPushNotifications(messages);
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        console.log('[NotificationService] Sending chunk of', chunk.length, 'messages');
        console.log('[NotificationService] Tokens:', chunk.map(m => m.to));
        const ticketChunk: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
        console.log('[NotificationService] Received tickets:', JSON.stringify(ticketChunk));

        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          if (ticket.status === 'ok') {
            sent++;
            console.log('[NotificationService] Ticket OK for token', chunk[i].to);
          } else {
            failed++;
            console.log('[NotificationService] Ticket FAILED for token', chunk[i].to);
            console.log('[NotificationService] Error details:', JSON.stringify(ticket));

            // Log all error information for debugging
            if (ticket.status === 'error') {
              console.log('[NotificationService] Error type:', ticket.details?.error);
              console.log('[NotificationService] Error message:', ticket.message);
            }

            // Only mark as invalid for DeviceNotRegistered errors
            // InvalidCredentials might be a temporary Expo issue, so we'll keep those
            if (
              ticket.status === 'error' &&
              ticket.details?.error === 'DeviceNotRegistered'
            ) {
              const token = chunk[i].to;
              if (typeof token === 'string') {
                console.log('[NotificationService] Marking token as invalid (DeviceNotRegistered):', token);
                invalidTokens.push(token);
              }
            }
          }
        }
      } catch (error: any) {
        console.error('[NotificationService] Error sending push notifications:', error);
        console.error('[NotificationService] Error stack:', error?.stack);
        console.error('[NotificationService] Error response:', error?.response?.data);
        failed += chunk.length;
      }
    }

    // Deactivate invalid tokens
    if (invalidTokens.length > 0) {
      console.log('[NotificationService] Deactivating', invalidTokens.length, 'invalid tokens');
      await prisma.pushToken.updateMany({
        where: { token: { in: invalidTokens } },
        data: { isActive: false },
      });
    }

    console.log('[NotificationService] Result: sent=', sent, 'failed=', failed);
    return { sent, failed };
  }

  /**
   * Get count of users with active push tokens by subscription tier
   */
  async getTokenStats(): Promise<{
    total: number;
    premium: number;
    free: number;
  }> {
    const [total, premium, free] = await Promise.all([
      prisma.pushToken.count({ where: { isActive: true } }),
      prisma.pushToken.count({
        where: { isActive: true, user: { subscriptionTier: 'premium' } },
      }),
      prisma.pushToken.count({
        where: { isActive: true, user: { subscriptionTier: 'free' } },
      }),
    ]);

    return { total, premium, free };
  }
}

export const notificationService = new NotificationService();
