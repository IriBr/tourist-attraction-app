import { apiClient } from './config';
import {
  ApiResponse,
  PaginatedResponse,
  Review,
  ReviewStats,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewSearchParams,
} from '@tourist-app/shared';

export const reviewsApi = {
  async getForAttraction(
    params: ReviewSearchParams
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Review>>>(
      '/reviews',
      { params }
    );
    return response.data.data;
  },

  async getById(id: string): Promise<Review> {
    const response = await apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
    return response.data.data;
  },

  async create(data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<ApiResponse<Review>>('/reviews', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateReviewRequest): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(
      `/reviews/${id}`,
      data
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  },

  async markHelpful(id: string): Promise<void> {
    await apiClient.post(`/reviews/${id}/helpful`);
  },

  async getStats(attractionId: string): Promise<ReviewStats> {
    const response = await apiClient.get<ApiResponse<ReviewStats>>(
      '/reviews/stats',
      { params: { attractionId } }
    );
    return response.data.data;
  },

  async getUserReviews(
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Review>>>(
      '/reviews/user/me',
      { params: { page, limit } }
    );
    return response.data.data;
  },
};
