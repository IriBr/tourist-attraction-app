import { apiClient } from './config';
import {
  UserBadge,
  BadgeProgress,
  BadgeSummary,
  AllBadgeProgress,
  BadgeTier,
  LocationType,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

interface GetBadgesParams {
  locationType?: LocationType;
  tier?: BadgeTier;
}

interface GetBadgesResponse {
  badges: UserBadge[];
  summary: BadgeSummary;
}

interface TimelineResponse {
  items: UserBadge[];
  total: number;
}

export const badgesApi = {
  async getAll(params?: GetBadgesParams): Promise<GetBadgesResponse> {
    const response = await apiClient.get<ApiResponse<GetBadgesResponse>>(
      '/badges',
      { params }
    );
    return response.data.data;
  },

  async getProgress(): Promise<AllBadgeProgress> {
    const response = await apiClient.get<ApiResponse<AllBadgeProgress>>(
      '/badges/progress'
    );
    return response.data.data;
  },

  async getLocationProgress(
    locationType: LocationType,
    locationId: string
  ): Promise<BadgeProgress> {
    const response = await apiClient.get<ApiResponse<BadgeProgress>>(
      `/badges/progress/${locationType}/${locationId}`
    );
    return response.data.data;
  },

  async getTimeline(limit = 20): Promise<TimelineResponse> {
    const response = await apiClient.get<ApiResponse<TimelineResponse>>(
      '/badges/timeline',
      { params: { limit } }
    );
    return response.data.data;
  },

  async getSummary(): Promise<BadgeSummary> {
    const response = await apiClient.get<ApiResponse<BadgeSummary>>(
      '/badges/summary'
    );
    return response.data.data;
  },
};
