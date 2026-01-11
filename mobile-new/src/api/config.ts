import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ApiErrorResponse } from '../types';

// Use appropriate URL based on platform
const getApiUrl = () => {
  // Always use production API for now (testing)
  // TODO: Revert to local for development when needed
  return 'https://wandr-backend-k87hq.ondigitalocean.app/api/v1';

  // if (__DEV__) {
  //   // Use local IP for simulators during development
  //   const LOCAL_IP = '192.168.8.206';
  //   return `http://${LOCAL_IP}:3001/api/v1`;
  // }
  // // Production API on Digital Ocean
  // return 'https://wandr-backend-k87hq.ondigitalocean.app/api/v1';
};

const API_BASE_URL = getApiUrl();
console.log('[API] Using base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = '@auth/accessToken';
const REFRESH_TOKEN_KEY = '@auth/refreshToken';

// Token storage helpers
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  },

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          // No refresh token - clear everything and reject silently
          await tokenStorage.clearTokens();
          processQueue(new Error('No refresh token'), null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await tokenStorage.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError as Error, null);
        // Only clear tokens on auth errors (401/403), not network errors
        const status = refreshError?.response?.status;
        if (status === 401 || status === 403) {
          await tokenStorage.clearTokens();
        }
        // For network errors, keep tokens - user can retry when network is back
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
