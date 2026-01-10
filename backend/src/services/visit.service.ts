import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { badgeService } from './badge.service.js';

interface MarkVisitedData {
  attractionId: string;
  photoUrl?: string;
  notes?: string;
  visitDate?: string;
  isVerified?: boolean; // true = camera scan verified, counts for leaderboard
}

interface VisitWithAttraction {
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

interface NewBadgeInfo {
  id: string;
  tier: string;
  locationId: string;
  locationName: string;
  locationType: string;
  earnedAt: string;
}

interface MarkVisitedResult {
  visit: VisitWithAttraction;
  newBadges: { badge: NewBadgeInfo; isNew: boolean }[];
}

interface UserStats {
  totalVisits: number;
  verifiedVisits: number; // Camera scan verified visits (counts for leaderboard)
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
  attractions?: {
    id: string;
    name: string;
    isVisited: boolean;
  }[];
}

export async function markVisited(
  userId: string,
  data: MarkVisitedData
): Promise<MarkVisitedResult> {
  const { attractionId, photoUrl, notes, visitDate, isVerified = false } = data;

  // Check if attraction exists with full location hierarchy
  const attraction = await prisma.attraction.findUnique({
    where: { id: attractionId },
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
    },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  // Check if already visited
  const existing = await prisma.visit.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });

  if (existing) {
    throw new ConflictError('Attraction is already marked as visited');
  }

  const visit = await prisma.visit.create({
    data: {
      userId,
      attractionId,
      photoUrl,
      notes,
      isVerified,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
    },
  });

  // Check and award badges for this visit
  const badgeResults = await badgeService.checkAndAwardBadges(userId, attraction.cityId);

  // Map badge results to the expected format
  const newBadges = badgeResults.map((result) => ({
    badge: {
      id: result.badge.id,
      tier: result.badge.tier,
      locationId: result.badge.locationId,
      locationName: result.badge.locationName,
      locationType: result.badge.locationType,
      earnedAt: result.badge.earnedAt,
    },
    isNew: result.isNew,
  }));

  return {
    visit: {
      id: visit.id,
      attractionId: visit.attractionId,
      visitDate: visit.visitDate.toISOString(),
      photoUrl: visit.photoUrl,
      notes: visit.notes,
      attraction: {
        id: attraction.id,
        name: attraction.name,
        cityId: attraction.cityId,
        cityName: attraction.city.name,
        countryName: attraction.city.country.name,
        continentName: attraction.city.country.continent.name,
        thumbnailUrl: attraction.thumbnailUrl,
      },
    },
    newBadges,
  };
}

export async function removeVisit(
  userId: string,
  attractionId: string
): Promise<void> {
  const visit = await prisma.visit.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });

  if (!visit) {
    throw new NotFoundError('Visit');
  }

  await prisma.visit.delete({
    where: { id: visit.id },
  });
}

export async function getUserVisits(
  userId: string,
  params: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
): Promise<{ items: VisitWithAttraction[]; total: number }> {
  const { page = 1, limit = 20, sortBy = 'recent', sortOrder = 'desc' } = params;
  const skip = (page - 1) * limit;

  const orderBy: Prisma.VisitOrderByWithRelationInput =
    sortBy === 'name'
      ? { attraction: { name: sortOrder } }
      : { visitDate: sortOrder };

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where: { userId },
      orderBy,
      skip,
      take: limit,
      include: {
        attraction: {
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
          },
        },
      },
    }),
    prisma.visit.count({ where: { userId } }),
  ]);

  return {
    items: visits.map((v) => ({
      id: v.id,
      attractionId: v.attractionId,
      visitDate: v.visitDate.toISOString(),
      photoUrl: v.photoUrl,
      notes: v.notes,
      attraction: {
        id: v.attraction.id,
        name: v.attraction.name,
        cityId: v.attraction.cityId,
        cityName: v.attraction.city.name,
        countryName: v.attraction.city.country.name,
        continentName: v.attraction.city.country.continent.name,
        thumbnailUrl: v.attraction.thumbnailUrl,
      },
    })),
    total,
  };
}

export async function isVisited(
  userId: string,
  attractionId: string
): Promise<boolean> {
  const visit = await prisma.visit.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });
  return visit !== null;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const visits = await prisma.visit.findMany({
    where: { userId },
    include: {
      attraction: {
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
        },
      },
    },
  });

  const countrySet = new Set<string>();
  const citySet = new Set<string>();
  const continentSet = new Set<string>();
  let verifiedCount = 0;

  for (const visit of visits) {
    citySet.add(visit.attraction.city.name);
    countrySet.add(visit.attraction.city.country.name);
    continentSet.add(visit.attraction.city.country.continent.name);
    if (visit.isVerified) {
      verifiedCount++;
    }
  }

  return {
    totalVisits: visits.length,
    verifiedVisits: verifiedCount,
    countriesVisited: countrySet.size,
    citiesVisited: citySet.size,
    continentsVisited: continentSet.size,
    countries: [...countrySet],
    cities: [...citySet],
    continents: [...continentSet],
  };
}

export async function getContinentStats(
  userId: string,
  continentName: string
): Promise<LocationStats> {
  // Find the continent by name
  const continent = await prisma.continent.findFirst({
    where: { name: { equals: continentName, mode: 'insensitive' } },
  });

  if (!continent) {
    return {
      totalAttractions: 0,
      visitedAttractions: 0,
      progress: 0,
    };
  }

  // Count attractions in this continent (much more efficient than fetching all)
  const totalAttractions = await prisma.attraction.count({
    where: {
      city: {
        country: {
          continentId: continent.id,
        },
      },
    },
  });

  // Count user's visits in this continent
  const visitedAttractions = await prisma.visit.count({
    where: {
      userId,
      attraction: {
        city: {
          country: {
            continentId: continent.id,
          },
        },
      },
    },
  });

  return {
    totalAttractions,
    visitedAttractions,
    progress: totalAttractions > 0 ? Math.round((visitedAttractions / totalAttractions) * 100) : 0,
  };
}

export async function getCountryStats(
  userId: string,
  countryName: string
): Promise<LocationStats> {
  // Find the country by name
  const country = await prisma.country.findFirst({
    where: { name: { equals: countryName, mode: 'insensitive' } },
  });

  if (!country) {
    return {
      totalAttractions: 0,
      visitedAttractions: 0,
      progress: 0,
    };
  }

  // Count attractions in this country (more efficient than fetching all)
  const totalAttractions = await prisma.attraction.count({
    where: {
      city: {
        countryId: country.id,
      },
    },
  });

  // Count user's visits in this country
  const visitedAttractions = await prisma.visit.count({
    where: {
      userId,
      attraction: {
        city: {
          countryId: country.id,
        },
      },
    },
  });

  return {
    totalAttractions,
    visitedAttractions,
    progress: totalAttractions > 0 ? Math.round((visitedAttractions / totalAttractions) * 100) : 0,
  };
}

export async function getCityStats(
  userId: string,
  cityName: string
): Promise<LocationStats> {
  // Find the city by name
  const city = await prisma.city.findFirst({
    where: { name: { equals: cityName, mode: 'insensitive' } },
  });

  if (!city) {
    return {
      totalAttractions: 0,
      visitedAttractions: 0,
      progress: 0,
      attractions: [],
    };
  }

  const attractions = await prisma.attraction.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true },
  });

  const visits = await prisma.visit.findMany({
    where: {
      userId,
      attraction: { cityId: city.id },
    },
    select: { attractionId: true },
  });

  const visitedIds = new Set(visits.map((v) => v.attractionId));

  return {
    totalAttractions: attractions.length,
    visitedAttractions: visits.length,
    progress: attractions.length > 0 ? Math.round((visits.length / attractions.length) * 100) : 0,
    attractions: attractions.map((a) => ({
      id: a.id,
      name: a.name,
      isVisited: visitedIds.has(a.id),
    })),
  };
}
