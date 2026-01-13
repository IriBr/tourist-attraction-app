import api from './client';
import type {
  User,
  Attraction,
  Pagination,
  DashboardStats,
  LocationStats,
  Suggestion,
  SuggestionStats,
  SuggestionStatus,
  SuggestionType,
} from '../types';

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getLocationStats: async (): Promise<LocationStats> => {
    const response = await api.get('/admin/locations/stats');
    return response.data;
  },

  // Users
  getUsers: async (
    page = 1,
    limit = 20,
    search?: string
  ): Promise<{ users: User[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserSubscription: async (
    userId: string,
    tier: 'free' | 'premium'
  ): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/subscription`, { tier });
    return response.data;
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Attractions
  getAttractions: async (
    page = 1,
    limit = 20,
    search?: string,
    category?: string,
    country?: string,
    city?: string
  ): Promise<{ attractions: Attraction[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (country) params.append('country', country);
    if (city) params.append('city', city);
    const response = await api.get(`/admin/attractions?${params}`);
    return response.data;
  },

  getAttraction: async (attractionId: string): Promise<Attraction> => {
    const response = await api.get(`/admin/attractions/${attractionId}`);
    return response.data;
  },

  createAttraction: async (data: Partial<Attraction>): Promise<Attraction> => {
    const response = await api.post('/admin/attractions', data);
    return response.data;
  },

  updateAttraction: async (
    attractionId: string,
    data: Partial<Attraction>
  ): Promise<Attraction> => {
    const response = await api.put(`/admin/attractions/${attractionId}`, data);
    return response.data;
  },

  deleteAttraction: async (
    attractionId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/attractions/${attractionId}`);
    return response.data;
  },

  setAttractionVerified: async (
    attractionId: string,
    isVerified: boolean
  ): Promise<Attraction> => {
    const response = await api.patch(`/admin/attractions/${attractionId}/verify`, {
      isVerified,
    });
    return response.data.data;
  },

  // Suggestions
  getSuggestions: async (
    page = 1,
    limit = 20,
    status?: SuggestionStatus,
    type?: SuggestionType
  ): Promise<{ suggestions: Suggestion[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    const response = await api.get(`/admin/suggestions?${params}`);
    return {
      suggestions: response.data.data.items,
      pagination: {
        page: response.data.data.page,
        limit: response.data.data.limit,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    };
  },

  getSuggestionStats: async (): Promise<SuggestionStats> => {
    const response = await api.get('/admin/suggestions/stats');
    return response.data.data;
  },

  updateSuggestion: async (
    suggestionId: string,
    data: { status: SuggestionStatus; adminNotes?: string }
  ): Promise<Suggestion> => {
    const response = await api.patch(`/admin/suggestions/${suggestionId}`, data);
    return response.data.data;
  },

  deleteSuggestion: async (
    suggestionId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/suggestions/${suggestionId}`);
    return response.data;
  },
};
