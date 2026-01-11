import api from './client';

export interface NotificationStats {
  total: number;
  premium: number;
  free: number;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  target: 'all' | 'premium' | 'free' | 'user';
  userId?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  data: {
    sent: number;
    failed: number;
    message: string;
  };
}

export const notificationsApi = {
  /**
   * Get push token statistics
   */
  getStats: async (): Promise<NotificationStats> => {
    const response = await api.get('/admin/notifications/stats');
    return response.data.data;
  },

  /**
   * Send a notification to users
   */
  sendNotification: async (data: SendNotificationRequest): Promise<SendNotificationResponse> => {
    const response = await api.post('/admin/notifications/send', data);
    return response.data;
  },
};
