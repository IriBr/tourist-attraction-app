import { apiClient, tokenStorage } from './config';
import {
  ApiResponse,
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@tourist-app/shared';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    const { tokens } = response.data.data;
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    const { tokens } = response.data.data;
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data.data;
  },

  async logout(): Promise<void> {
    const refreshToken = await tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      '/auth/profile',
      data
    );
    return response.data.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async checkAuthStatus(): Promise<User | null> {
    const token = await tokenStorage.getAccessToken();
    if (!token) return null;

    try {
      return await this.getProfile();
    } catch {
      return null;
    }
  },
};
