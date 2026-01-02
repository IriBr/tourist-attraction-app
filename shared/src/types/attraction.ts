export enum AttractionCategory {
  MUSEUM = 'museum',
  PARK = 'park',
  LANDMARK = 'landmark',
  BEACH = 'beach',
  RESTAURANT = 'restaurant',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  NATURE = 'nature',
  HISTORICAL = 'historical',
  RELIGIOUS = 'religious',
  OTHER = 'other',
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface OpeningHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
}

export interface PriceInfo {
  currency: string;
  adultPrice: number;
  childPrice?: number;
  seniorPrice?: number;
  isFree: boolean;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: AttractionCategory;
  location: Location;
  images: string[];
  thumbnailUrl: string;
  openingHours: OpeningHours[];
  priceInfo: PriceInfo | null;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  averageRating: number;
  totalReviews: number;
  isFavorited?: boolean; // Populated based on current user
  isVisited?: boolean; // Populated based on current user
  distance?: number; // Populated when searching by location (in meters)
  createdAt: string;
  updatedAt: string;
}

export interface AttractionSummary {
  id: string;
  name: string;
  shortDescription: string;
  category: AttractionCategory;
  thumbnailUrl: string;
  location: Pick<Location, 'city' | 'country'>;
  averageRating: number;
  totalReviews: number;
  isFavorited?: boolean;
  distance?: number;
}

export interface AttractionSearchParams {
  query?: string;
  category?: AttractionCategory;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  minRating?: number;
  isFree?: boolean;
  sortBy?: 'distance' | 'rating' | 'reviews' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface NearbyAttractionsParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  category?: AttractionCategory;
  limit?: number;
}
