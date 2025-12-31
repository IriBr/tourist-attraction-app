import { apiClient } from './config';
import {
  ApiResponse,
  PaginatedResponse,
  Favorite,
  FavoriteWithAttraction,
  FavoritesListParams,
} from '@tourist-app/shared';

export const favoritesApi = {
  async getAll(
    params?: FavoritesListParams
  ): Promise<PaginatedResponse<FavoriteWithAttraction>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<FavoriteWithAttraction>>
    >('/favorites', { params });
    return response.data.data;
  },

  async add(attractionId: string): Promise<Favorite> {
    const response = await apiClient.post<ApiResponse<Favorite>>('/favorites', {
      attractionId,
    });
    return response.data.data;
  },

  async remove(attractionId: string): Promise<void> {
    await apiClient.delete(`/favorites/${attractionId}`);
  },

  async check(attractionId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ isFavorited: boolean }>>(
      `/favorites/check/${attractionId}`
    );
    return response.data.data.isFavorited;
  },

  async getCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/favorites/count'
    );
    return response.data.data.count;
  },
};
