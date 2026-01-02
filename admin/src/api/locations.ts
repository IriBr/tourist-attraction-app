import api from './client';

export interface Continent {
  id: string;
  name: string;
  code: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    countries: number;
  };
  countries?: Country[];
}

export interface Country {
  id: string;
  name: string;
  code: string;
  imageUrl?: string;
  flagUrl?: string;
  continentId: string;
  continent?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    cities: number;
  };
  cities?: City[];
}

export interface City {
  id: string;
  name: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  countryId: string;
  country?: {
    id: string;
    name: string;
    code: string;
    continent?: {
      id: string;
      name: string;
      code: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    attractions: number;
  };
}

export interface HierarchyStats {
  continents: number;
  countries: number;
  cities: number;
  attractions: number;
}

export const locationsApi = {
  // Stats
  getHierarchyStats: async (): Promise<HierarchyStats> => {
    const response = await api.get('/admin/locations/stats');
    return response.data;
  },

  getFullHierarchy: async (): Promise<Continent[]> => {
    const response = await api.get('/admin/locations/hierarchy');
    return response.data;
  },

  // Continents
  getContinents: async (): Promise<Continent[]> => {
    const response = await api.get('/admin/locations/continents');
    return response.data;
  },

  getContinent: async (id: string): Promise<Continent> => {
    const response = await api.get(`/admin/locations/continents/${id}`);
    return response.data;
  },

  createContinent: async (data: {
    name: string;
    code: string;
    imageUrl?: string;
  }): Promise<Continent> => {
    const response = await api.post('/admin/locations/continents', data);
    return response.data;
  },

  updateContinent: async (
    id: string,
    data: { name?: string; code?: string; imageUrl?: string }
  ): Promise<Continent> => {
    const response = await api.put(`/admin/locations/continents/${id}`, data);
    return response.data;
  },

  deleteContinent: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/locations/continents/${id}`);
    return response.data;
  },

  // Countries
  getCountries: async (continentId?: string): Promise<Country[]> => {
    const params = continentId ? `?continentId=${continentId}` : '';
    const response = await api.get(`/admin/locations/countries${params}`);
    return response.data;
  },

  getCountry: async (id: string): Promise<Country> => {
    const response = await api.get(`/admin/locations/countries/${id}`);
    return response.data;
  },

  createCountry: async (data: {
    name: string;
    code: string;
    continentId: string;
    imageUrl?: string;
    flagUrl?: string;
  }): Promise<Country> => {
    const response = await api.post('/admin/locations/countries', data);
    return response.data;
  },

  updateCountry: async (
    id: string,
    data: {
      name?: string;
      code?: string;
      continentId?: string;
      imageUrl?: string;
      flagUrl?: string;
    }
  ): Promise<Country> => {
    const response = await api.put(`/admin/locations/countries/${id}`, data);
    return response.data;
  },

  deleteCountry: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/locations/countries/${id}`);
    return response.data;
  },

  // Cities
  getCities: async (countryId?: string): Promise<City[]> => {
    const params = countryId ? `?countryId=${countryId}` : '';
    const response = await api.get(`/admin/locations/cities${params}`);
    return response.data;
  },

  getCity: async (id: string): Promise<City> => {
    const response = await api.get(`/admin/locations/cities/${id}`);
    return response.data;
  },

  createCity: async (data: {
    name: string;
    countryId: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<City> => {
    const response = await api.post('/admin/locations/cities', data);
    return response.data;
  },

  updateCity: async (
    id: string,
    data: {
      name?: string;
      countryId?: string;
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<City> => {
    const response = await api.put(`/admin/locations/cities/${id}`, data);
    return response.data;
  },

  deleteCity: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/locations/cities/${id}`);
    return response.data;
  },
};
