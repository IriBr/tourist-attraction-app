import { apiClient } from './config';
import {
  ApiResponse,
  PaginatedResponse,
  Attraction,
  AttractionSummary,
  AttractionSearchParams,
  AttractionCategory,
} from '../types';

export const attractionsApi = {
  async search(
    params: AttractionSearchParams
  ): Promise<PaginatedResponse<AttractionSummary>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AttractionSummary>>
    >('/attractions/search', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Attraction> {
    const response = await apiClient.get<ApiResponse<Attraction>>(
      `/attractions/${id}`
    );
    return response.data.data;
  },

  async getNearby(
    latitude: number,
    longitude: number,
    radiusMeters?: number,
    category?: AttractionCategory,
    limit?: number
  ): Promise<AttractionSummary[]> {
    const response = await apiClient.get<ApiResponse<AttractionSummary[]>>(
      '/attractions/nearby',
      {
        params: { latitude, longitude, radiusMeters, category, limit },
      }
    );
    return response.data.data;
  },

  async getPopular(limit?: number): Promise<AttractionSummary[]> {
    const response = await apiClient.get<ApiResponse<AttractionSummary[]>>(
      '/attractions/popular',
      { params: { limit } }
    );
    return response.data.data;
  },

  async getByCategory(
    category: AttractionCategory,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<AttractionSummary>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AttractionSummary>>
    >(`/attractions/category/${category}`, { params: { page, limit } });
    return response.data.data;
  },
};
