import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { subscriptionService } from './subscription.service.js';
import {
  Attraction,
  AttractionSummary,
  AttractionSearchParams,
  AttractionCategory,
  Location,
  OpeningHours,
  PriceInfo,
} from '@tourist-app/shared';

interface AttractionWithRelations {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  cityId: string;
  city: {
    name: string;
    country: {
      name: string;
      continent: {
        name: string;
      };
    };
  };
  latitude: number;
  longitude: number;
  address: string;
  postalCode: string | null;
  images: string[];
  thumbnailUrl: string;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  currency: string | null;
  adultPrice: number | null;
  childPrice: number | null;
  seniorPrice: number | null;
  isFree: boolean;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  openingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  favorites?: { id: string }[];
  visits?: { id: string }[];
}

// Lighter type for summary queries (uses select instead of include)
interface AttractionSummaryData {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  thumbnailUrl: string;
  images?: string[]; // Optional - only included for visual comparison fallback
  latitude: number;
  longitude: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  city: {
    name: string;
    country: {
      name: string;
    };
  };
  favorites?: { id: string }[];
}

function mapToAttraction(
  attr: AttractionWithRelations,
  userId?: string
): Attraction {
  const location: Location = {
    latitude: attr.latitude,
    longitude: attr.longitude,
    address: attr.address,
    city: attr.city.name,
    country: attr.city.country.name,
    postalCode: attr.postalCode ?? undefined,
  };

  const openingHours: OpeningHours[] = attr.openingHours.map((oh) => ({
    dayOfWeek: oh.dayOfWeek,
    openTime: oh.openTime,
    closeTime: oh.closeTime,
    isClosed: oh.isClosed,
  }));

  const priceInfo: PriceInfo | null = attr.currency
    ? {
        currency: attr.currency,
        adultPrice: attr.adultPrice ?? 0,
        childPrice: attr.childPrice ?? undefined,
        seniorPrice: attr.seniorPrice ?? undefined,
        isFree: attr.isFree,
      }
    : null;

  return {
    id: attr.id,
    name: attr.name,
    description: attr.description,
    shortDescription: attr.shortDescription,
    category: attr.category as AttractionCategory,
    location,
    images: attr.images,
    thumbnailUrl: attr.thumbnailUrl,
    openingHours,
    priceInfo,
    contactPhone: attr.contactPhone ?? undefined,
    contactEmail: attr.contactEmail ?? undefined,
    website: attr.website ?? undefined,
    averageRating: attr.averageRating,
    totalReviews: attr.totalReviews,
    isVerified: attr.isVerified,
    isFavorited: userId ? (attr.favorites?.length ?? 0) > 0 : undefined,
    isVisited: userId ? (attr.visits?.length ?? 0) > 0 : undefined,
    createdAt: attr.createdAt.toISOString(),
    updatedAt: attr.updatedAt.toISOString(),
  };
}

function mapToSummary(
  attr: AttractionWithRelations,
  userId?: string,
  distance?: number
): AttractionSummary {
  return {
    id: attr.id,
    name: attr.name,
    shortDescription: attr.shortDescription,
    category: attr.category as AttractionCategory,
    thumbnailUrl: attr.thumbnailUrl,
    location: { city: attr.city.name, country: attr.city.country.name },
    averageRating: attr.averageRating,
    totalReviews: attr.totalReviews,
    isVerified: attr.isVerified,
    isFavorited: userId ? (attr.favorites?.length ?? 0) > 0 : undefined,
    distance,
  };
}

// Lightweight mapping for select-based queries
function mapSummaryData(
  attr: AttractionSummaryData,
  userId?: string,
  distance?: number
): AttractionSummary {
  return {
    id: attr.id,
    name: attr.name,
    shortDescription: attr.shortDescription,
    category: attr.category as AttractionCategory,
    thumbnailUrl: attr.thumbnailUrl,
    images: attr.images, // For visual comparison fallback
    location: { city: attr.city.name, country: attr.city.country.name },
    averageRating: attr.averageRating,
    totalReviews: attr.totalReviews,
    isVerified: attr.isVerified,
    isFavorited: userId ? (attr.favorites?.length ?? 0) > 0 : undefined,
    distance,
  };
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchAttractions(
  params: AttractionSearchParams,
  userId?: string
): Promise<{ items: AttractionSummary[]; total: number }> {
  const {
    query,
    category,
    latitude,
    longitude,
    radiusMeters = 5000,
    minRating,
    isFree,
    sortBy = 'rating',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = params;

  // Cap limit to prevent abuse
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);

  const where: Prisma.AttractionWhereInput = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { city: { name: { contains: query, mode: 'insensitive' } } },
      { city: { country: { name: { contains: query, mode: 'insensitive' } } } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (minRating) {
    where.averageRating = { gte: minRating };
  }

  if (isFree !== undefined) {
    where.isFree = isFree;
  }

  // For location-based search, we'll filter in-memory after fetching
  // In production, use PostGIS for efficient geo queries

  const orderBy: Prisma.AttractionOrderByWithRelationInput = {};
  if (sortBy === 'rating') orderBy.averageRating = sortOrder;
  else if (sortBy === 'reviews') orderBy.totalReviews = sortOrder;
  else if (sortBy === 'name') orderBy.name = sortOrder;

  const skip = (page - 1) * safeLimit;

  const [attractions, total] = await Promise.all([
    prisma.attraction.findMany({
      where,
      orderBy,
      skip,
      take: safeLimit,
      // Use select for list queries - much lighter than include with openingHours
      select: {
        id: true,
        name: true,
        shortDescription: true,
        category: true,
        thumbnailUrl: true,
        latitude: true,
        longitude: true,
        averageRating: true,
        totalReviews: true,
        isVerified: true,
        city: {
          select: {
            name: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
        favorites: userId ? { where: { userId }, select: { id: true } } : false,
      },
    }),
    prisma.attraction.count({ where }),
  ]);

  let results = attractions.map((attr) => {
    const distance =
      latitude !== undefined && longitude !== undefined
        ? calculateDistance(latitude, longitude, attr.latitude, attr.longitude)
        : undefined;
    return mapSummaryData(attr as AttractionSummaryData, userId, distance);
  });

  // Filter by radius if location provided
  if (latitude !== undefined && longitude !== undefined) {
    results = results.filter((r) => r.distance !== undefined && r.distance <= radiusMeters);

    // Sort by distance if requested
    if (sortBy === 'distance') {
      results.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return sortOrder === 'asc' ? distA - distB : distB - distA;
      });
    }
  }

  return { items: results, total };
}

export async function getAttractionById(
  id: string,
  userId?: string
): Promise<Attraction> {
  const attraction = await prisma.attraction.findUnique({
    where: { id },
    include: {
      city: {
        include: {
          country: {
            include: {
              continent: true,
            },
          },
        },
      },
      openingHours: true,
      favorites: userId ? { where: { userId }, select: { id: true } } : false,
      visits: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  return mapToAttraction(attraction as AttractionWithRelations, userId);
}

export async function getNearbyAttractions(
  latitude: number,
  longitude: number,
  radiusMeters = 5000,
  category?: AttractionCategory,
  limit = 10,
  userId?: string
): Promise<AttractionSummary[]> {
  // Cap limit to prevent abuse
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);

  // Calculate bounding box for initial filtering (much faster than loading all)
  const latDelta = radiusMeters / 111000;
  const lonDelta = radiusMeters / (111000 * Math.cos((latitude * Math.PI) / 180));

  const where: Prisma.AttractionWhereInput = {
    latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
    longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta },
  };

  if (category) {
    where.category = category;
  }

  // Use select for summary data - no openingHours needed
  const attractions = await prisma.attraction.findMany({
    where,
    select: {
      id: true,
      name: true,
      shortDescription: true,
      category: true,
      thumbnailUrl: true,
      images: true, // Include images for visual comparison fallback
      latitude: true,
      longitude: true,
      averageRating: true,
      totalReviews: true,
      isVerified: true,
      city: {
        select: {
          name: true,
          country: {
            select: {
              name: true,
            },
          },
        },
      },
      favorites: userId ? { where: { userId }, select: { id: true } } : false,
    },
    // Fetch all attractions in bounding box, then filter/sort by actual distance
    // This ensures we don't miss attractions due to arbitrary DB ordering
    take: 500,
  });

  const withDistance = attractions
    .map((attr) => ({
      attraction: attr as AttractionSummaryData,
      distance: calculateDistance(latitude, longitude, attr.latitude, attr.longitude),
    }))
    .filter((item) => item.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, safeLimit);

  return withDistance.map((item) =>
    mapSummaryData(item.attraction, userId, item.distance)
  );
}

export async function getAttractionsByCategory(
  category: AttractionCategory,
  page = 1,
  limit = 20,
  userId?: string
): Promise<{ items: AttractionSummary[]; total: number }> {
  // Cap limit to prevent abuse
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * safeLimit;

  const [attractions, total] = await Promise.all([
    prisma.attraction.findMany({
      where: { category },
      orderBy: { averageRating: 'desc' },
      skip,
      take: safeLimit,
      // Use select for summary data - no openingHours needed
      select: {
        id: true,
        name: true,
        shortDescription: true,
        category: true,
        thumbnailUrl: true,
        latitude: true,
        longitude: true,
        averageRating: true,
        totalReviews: true,
        isVerified: true,
        city: {
          select: {
            name: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
        favorites: userId ? { where: { userId }, select: { id: true } } : false,
      },
    }),
    prisma.attraction.count({ where: { category } }),
  ]);

  return {
    items: attractions.map((attr) =>
      mapSummaryData(attr as AttractionSummaryData, userId)
    ),
    total,
  };
}

export async function getPopularAttractions(
  limit = 10,
  userId?: string
): Promise<AttractionSummary[]> {
  // Cap limit to prevent abuse
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);

  const attractions = await prisma.attraction.findMany({
    orderBy: [{ averageRating: 'desc' }, { totalReviews: 'desc' }],
    take: safeLimit,
    // Use select for summary data - no openingHours needed
    select: {
      id: true,
      name: true,
      shortDescription: true,
      category: true,
      thumbnailUrl: true,
      latitude: true,
      longitude: true,
      averageRating: true,
      totalReviews: true,
      isVerified: true,
      city: {
        select: {
          name: true,
          country: {
            select: {
              name: true,
            },
          },
        },
      },
      favorites: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  return attractions.map((attr) =>
    mapSummaryData(attr as AttractionSummaryData, userId)
  );
}

/**
 * Check if user can receive proximity notifications (premium feature)
 */
export async function canReceiveProximityNotifications(userId: string): Promise<boolean> {
  const result = await subscriptionService.canUseFeature(userId, 'proximity_notifications');
  return result.allowed;
}

/**
 * Get nearby attractions that the user has NOT visited
 * Used for proximity notifications
 */
export async function getNearbyUnvisitedAttractions(
  latitude: number,
  longitude: number,
  radiusMeters = 50,
  userId: string,
  limit = 5
): Promise<AttractionSummary[]> {
  // Calculate bounding box for initial filtering (rough approximation)
  // 1 degree of latitude ≈ 111km, 1 degree of longitude varies by latitude
  const latDelta = radiusMeters / 111000;
  const lonDelta = radiusMeters / (111000 * Math.cos((latitude * Math.PI) / 180));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  // Get user's visited attraction IDs
  const visits = await prisma.visit.findMany({
    where: { userId },
    select: { attractionId: true },
  });
  const visitedIds = new Set(visits.map((v) => v.attractionId));

  // Get attractions within bounding box (much faster than loading all)
  const attractions = await prisma.attraction.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLon, lte: maxLon },
      id: { notIn: Array.from(visitedIds) },
    },
    include: {
      city: {
        include: {
          country: {
            include: {
              continent: true,
            },
          },
        },
      },
      openingHours: true,
    },
    take: limit * 2, // Get a few extra to account for distance filtering
  });

  // Filter by exact distance (bounding box is a rough approximation)
  const nearbyUnvisited = attractions
    .map((attr) => ({
      attraction: attr as AttractionWithRelations,
      distance: calculateDistance(latitude, longitude, attr.latitude, attr.longitude),
    }))
    .filter((item) => item.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return nearbyUnvisited.map((item) =>
    mapToSummary(item.attraction, userId, item.distance)
  );
}
