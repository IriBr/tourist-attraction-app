import { apiClient } from './config';

export interface GlobalStats {
  continents: number;
  countries: number;
  cities: number;
  attractions: number;
}

export interface LocationSearchResult {
  continents: Array<{ id: string; name: string; type: string }>;
  countries: Array<{ id: string; name: string; continentName: string; type: string }>;
  cities: Array<{ id: string; name: string; countryName: string; type: string }>;
}

// Map data types for WorldMap component
export interface MapAttraction {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  averageRating: number;
  totalReviews: number;
  isFree: boolean;
  adultPrice: number | null;
  currency: string | null;
  website: string | null;
  contactPhone: string | null;
}

export interface MapCity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  attractionCount: number;
}

export interface MapCountry {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  cityCount: number;
  cities: MapCity[];
}

export interface MapContinent {
  id: string;
  name: string;
  code: string;
  color: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  countryCount: number;
  countries: MapCountry[];
}

export const locationsApi = {
  async getStats(): Promise<GlobalStats> {
    const response = await apiClient.get('/locations/stats');
    return response.data.data;
  },

  async search(query: string): Promise<LocationSearchResult> {
    const response = await apiClient.get('/locations/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  async getContinents() {
    const response = await apiClient.get('/locations/continents');
    return response.data.data;
  },

  async getCountriesInContinent(continentId: string) {
    const response = await apiClient.get(`/locations/continents/${continentId}/countries`);
    return response.data.data;
  },

  async getCitiesInCountry(countryId: string) {
    const response = await apiClient.get(`/locations/countries/${countryId}/cities`);
    return response.data.data;
  },

  async getAttractionsInCity(cityId: string): Promise<{ city: any; attractions: MapAttraction[] }> {
    const response = await apiClient.get(`/locations/cities/${cityId}/attractions`);
    return response.data.data;
  },

  async getMapData(): Promise<MapContinent[]> {
    const response = await apiClient.get('/locations/map-data');
    return response.data.data;
  },
};
