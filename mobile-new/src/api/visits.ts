import { apiClient } from './config';

export interface Visit {
  id: string;
  attractionId: string;
  visitDate: string;
  photoUrl: string | null;
  notes: string | null;
  attraction: {
    id: string;
    name: string;
    city: string;
    country: string;
    thumbnailUrl: string;
  };
}

export interface UserStats {
  totalVisits: number;
  countriesVisited: number;
  citiesVisited: number;
  continentsVisited: number;
  countries: string[];
  cities: string[];
  continents: string[];
}

export interface LocationStats {
  totalAttractions: number;
  visitedAttractions: number;
  progress: number;
  attractions: {
    id: string;
    name: string;
    isVisited: boolean;
  }[];
}

export interface MarkVisitedRequest {
  attractionId: string;
  photoUrl?: string;
  notes?: string;
  visitDate?: string;
}

export interface NewBadgeInfo {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  locationId: string;
  locationName: string;
  locationType: 'city' | 'country' | 'continent';
  earnedAt: string;
}

export interface MarkVisitedResponse {
  visit: Visit;
  newBadges: { badge: NewBadgeInfo; isNew: boolean }[];
}

export const visitsApi = {
  async getUserVisits(params?: { page?: number; limit?: number }): Promise<{ items: Visit[]; total: number }> {
    const response = await apiClient.get('/visits', { params });
    return response.data.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/visits/stats');
    return response.data.data;
  },

  async getContinentStats(continent: string): Promise<LocationStats> {
    const response = await apiClient.get(`/visits/stats/continent/${encodeURIComponent(continent)}`);
    return response.data.data;
  },

  async getCountryStats(country: string): Promise<LocationStats> {
    const response = await apiClient.get(`/visits/stats/country/${encodeURIComponent(country)}`);
    return response.data.data;
  },

  async getCityStats(city: string): Promise<LocationStats> {
    const response = await apiClient.get(`/visits/stats/city/${encodeURIComponent(city)}`);
    return response.data.data;
  },

  async checkVisit(attractionId: string): Promise<boolean> {
    const response = await apiClient.get(`/visits/check/${attractionId}`);
    return response.data.data.isVisited;
  },

  async markVisited(data: MarkVisitedRequest): Promise<MarkVisitedResponse> {
    const response = await apiClient.post('/visits', data);
    return response.data.data;
  },

  async removeVisit(attractionId: string): Promise<void> {
    await apiClient.delete(`/visits/${attractionId}`);
  },
};
