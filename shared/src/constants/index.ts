// API Configuration
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Validation Limits
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  REVIEW_TITLE_MIN_LENGTH: 3,
  REVIEW_TITLE_MAX_LENGTH: 100,
  REVIEW_CONTENT_MIN_LENGTH: 10,
  REVIEW_CONTENT_MAX_LENGTH: 2000,
  MAX_REVIEW_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 10,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

// Location Defaults
export const LOCATION = {
  DEFAULT_RADIUS_METERS: 5000,
  MAX_RADIUS_METERS: 50000,
  MIN_RADIUS_METERS: 100,
} as const;

// Image Configuration
export const IMAGES = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  THUMBNAIL_SIZE: { width: 400, height: 300 },
  FULL_SIZE: { width: 1200, height: 900 },
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  ATTRACTIONS_LIST: 300, // 5 minutes
  ATTRACTION_DETAIL: 600, // 10 minutes
  USER_PROFILE: 60, // 1 minute
  REVIEWS: 180, // 3 minutes
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  AUTH_MAX_REQUESTS: 10,
} as const;
