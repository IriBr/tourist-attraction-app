// Badge types
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type LocationType = 'city' | 'country' | 'continent';

export const BADGE_THRESHOLDS: Record<BadgeTier, number> = {
  bronze: 25,
  silver: 50,
  gold: 75,
  platinum: 100,
};

// Auth types
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  emailVerified: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// API types - aligned with @tourist-app/shared
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
  meta?: Record<string, unknown>;
}

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Attraction types
export enum AttractionCategory {
  MUSEUM = 'museum',
  PARK = 'park',
  LANDMARK = 'landmark',
  MONUMENT = 'monument',
  GALLERY = 'gallery',
  THEATER = 'theater',
  HISTORIC_SITE = 'historic_site',
  RELIGIOUS_SITE = 'religious_site',
  NATURE = 'nature',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export interface AttractionLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: AttractionCategory;
  location: AttractionLocation;
  images: string[];
  thumbnailUrl: string;
  averageRating: number;
  totalReviews: number;
  isFree?: boolean;
  adultPrice?: number;
  childPrice?: number;
  currency?: string;
  website?: string;
  contactPhone?: string;
  isFavorited?: boolean;
  isVisited?: boolean;
}

export interface AttractionSummaryLocation {
  city: string;
  country: string;
}

export interface AttractionSummary {
  id: string;
  name: string;
  shortDescription: string;
  category: AttractionCategory;
  location: AttractionSummaryLocation;
  thumbnailUrl: string;
  averageRating: number;
  totalReviews: number;
  isFavorited?: boolean;
}

export interface AttractionSearchParams {
  query?: string;
  category?: AttractionCategory;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'reviews' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Review types
export interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  visitDate?: string;
  images?: string[];
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  attractionId: string;
  rating: number;
  title: string;
  content: string;
  visitDate?: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  visitDate?: string;
  images?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewSearchParams {
  attractionId: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}

// Favorite types
export interface Favorite {
  id: string;
  attractionId: string;
  userId: string;
  createdAt: string;
}

export interface FavoriteWithAttraction extends Favorite {
  attraction: AttractionSummary;
}

export interface FavoritesListParams {
  page?: number;
  limit?: number;
}

// Badge types (detailed)
export interface Badge {
  id: string;
  locationId: string;
  locationType: LocationType;
  locationName: string;
  tier: BadgeTier;
  iconUrl?: string;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  badgeId: string;
  tier: BadgeTier;
  locationType: LocationType;
  locationName: string;
  earnedAt: string;
  attractionsVisited: number;
  totalAttractions: number;
  progressPercent: number;
}

export interface BadgeProgress {
  locationId: string;
  locationName: string;
  locationType: LocationType;
  totalAttractions: number;
  visitedAttractions: number;
  progressPercent: number;
  progressToNextTier: number;
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  earnedBadges: UserBadge[];
}

export interface BadgeSummary {
  totalBadges: number;
  badgesByTier: Record<BadgeTier, number>;
  badgesByType: Record<LocationType, number>;
  recentBadge?: UserBadge;
}

export interface AllBadgeProgress {
  byCity: BadgeProgress[];
  byCountry: BadgeProgress[];
  byContinent: BadgeProgress[];
}

export interface NewBadgeResult {
  badge: UserBadge;
  isNew: boolean;
}
