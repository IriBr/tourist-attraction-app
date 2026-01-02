import { apiClient } from './config';
import {
  ApiResponse,
  PaginatedResponse,
  MarkVisitedResponse,
} from '@tourist-app/shared';

interface Visit {
  id: string;
  attractionId: string;
  visitDate: string;
  photoUrl: string | null;
  notes: string | null;
  attraction: {
    id: string;
    name: string;
    cityId: string;
    cityName: string;
    countryName: string;
    continentName: string;
    thumbnailUrl: string;
  };
}

interface MarkVisitedParams {
  attractionId: string;
  photoUrl?: string;
  notes?: string;
  visitDate?: string;
}

interface GetVisitsParams {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'name';
  sortOrder?: 'asc' | 'desc';
}

interface UserStats {
  totalVisits: number;
  countriesVisited: number;
  citiesVisited: number;
  continentsVisited: number;
  countries: string[];
  cities: string[];
  continents: string[];
}

interface LocationStats {
  totalAttractions: number;
  visitedAttractions: number;
  progress: number;
  attractions: {
    id: string;
    name: string;
    isVisited: boolean;
  }[];
}

export const visitsApi = {
  async getAll(params?: GetVisitsParams): Promise<PaginatedResponse<Visit>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Visit>>>(
      '/visits',
      { params }
    );
    return response.data.data;
  },

  async markVisited(data: MarkVisitedParams): Promise<MarkVisitedResponse> {
    const response = await apiClient.post<ApiResponse<MarkVisitedResponse>>(
      '/visits',
      data
    );
    return response.data.data;
  },

  async removeVisit(attractionId: string): Promise<void> {
    await apiClient.delete(`/visits/${attractionId}`);
  },

  async checkVisited(attractionId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ isVisited: boolean }>>(
      `/visits/check/${attractionId}`
    );
    return response.data.data.isVisited;
  },

  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<ApiResponse<UserStats>>(
      '/visits/stats'
    );
    return response.data.data;
  },

  async getContinentStats(continent: string): Promise<LocationStats> {
    const response = await apiClient.get<ApiResponse<LocationStats>>(
      `/visits/stats/continent/${encodeURIComponent(continent)}`
    );
    return response.data.data;
  },

  async getCountryStats(country: string): Promise<LocationStats> {
    const response = await apiClient.get<ApiResponse<LocationStats>>(
      `/visits/stats/country/${encodeURIComponent(country)}`
    );
    return response.data.data;
  },

  async getCityStats(city: string): Promise<LocationStats> {
    const response = await apiClient.get<ApiResponse<LocationStats>>(
      `/visits/stats/city/${encodeURIComponent(city)}`
    );
    return response.data.data;
  },
};
