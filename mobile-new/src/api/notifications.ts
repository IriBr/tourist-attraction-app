import { apiClient } from './config';

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
}

export const notificationsApi = {
  /**
   * Register a push token with the backend
   */
  async registerToken(token: string, platform: 'ios' | 'android'): Promise<RegisterTokenResponse> {
    const response = await apiClient.post('/notifications/register-token', {
      token,
      platform,
    });
    return response.data;
  },

  /**
   * Unregister a push token (call on logout)
   */
  async unregisterToken(token?: string): Promise<RegisterTokenResponse> {
    const response = await apiClient.delete('/notifications/unregister-token', {
      data: token ? { token } : {},
    });
    return response.data;
  },
};
