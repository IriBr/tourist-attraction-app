import { apiClient } from './config';

export type SuggestionType = 'suggest_remove' | 'suggest_verify' | 'comment';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface Suggestion {
  id: string;
  attractionId: string;
  userId: string;
  type: SuggestionType;
  status: SuggestionStatus;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionWithDetails extends Suggestion {
  user: {
    id: string;
    name: string;
    email: string;
  };
  attraction: {
    id: string;
    name: string;
    city: string;
    country: string;
    isVerified: boolean;
  };
}

export interface CreateSuggestionRequest {
  attractionId: string;
  type: SuggestionType;
  comment?: string;
}

export const suggestionsApi = {
  async create(data: CreateSuggestionRequest): Promise<Suggestion> {
    const response = await apiClient.post('/suggestions', data);
    return response.data.data;
  },

  async getUserSuggestions(page = 1, limit = 20): Promise<{
    items: SuggestionWithDetails[];
    total: number;
  }> {
    const response = await apiClient.get('/suggestions/me', {
      params: { page, limit },
    });
    return response.data.data;
  },

  async getForAttraction(attractionId: string): Promise<SuggestionWithDetails[]> {
    const response = await apiClient.get(`/suggestions/attraction/${attractionId}`);
    return response.data.data;
  },
};

export default suggestionsApi;
