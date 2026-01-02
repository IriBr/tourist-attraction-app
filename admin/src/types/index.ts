export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google' | 'apple';
  emailVerified: boolean;
  role: 'user' | 'admin';
  subscriptionTier: 'free' | 'premium';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
    favorites: number;
    visits: number;
    dailyScans?: number;
  };
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  cityId: string;
  city?: {
    id: string;
    name: string;
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
  };
  latitude: number;
  longitude: number;
  address: string;
  postalCode?: string;
  images: string[];
  thumbnailUrl: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  currency?: string;
  adultPrice?: number;
  childPrice?: number;
  seniorPrice?: number;
  isFree: boolean;
  averageRating: number;
  totalReviews: number;
  openingHours?: OpeningHours[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
    favorites: number;
    visits: number;
  };
}

export interface OpeningHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  users: {
    total: number;
    premium: number;
    free: number;
  };
  attractions: {
    total: number;
  };
  engagement: {
    reviews: number;
    visits: number;
  };
  recent: {
    users: User[];
    attractions: Attraction[];
  };
}

export interface LocationStats {
  continents: number;
  countries: number;
  cities: number;
  attractions: number;
  users: number;
  countryList: { name: string; attractionCount: number }[];
  cityList: { name: string; country: string; attractionCount: number }[];
}
