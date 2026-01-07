import { prisma } from '../config/database.js';
import { BadgeTier, LocationType } from '@prisma/client';

// ============ TYPES ============

interface BadgeInfo {
  id: string;
  tier: BadgeTier;
  locationId: string;
  locationName: string;
  locationType: LocationType;
  iconUrl: string | null;
  locationImageUrl: string | null; // City image, country flag, or continent image
  earnedAt: string;
  attractionsVisited: number;
  totalAttractions: number;
  progressPercent: number;
}

interface NewBadgeResult {
  badge: BadgeInfo;
  isNew: boolean;
}

interface BadgeProgress {
  locationId: string;
  locationName: string;
  locationType: LocationType;
  totalAttractions: number;
  visitedAttractions: number;
  progressPercent: number;
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  progressToNextTier: number;
  earnedBadges: BadgeInfo[];
}

interface BadgeSummary {
  totalBadges: number;
  badgesByTier: Record<BadgeTier, number>;
  badgesByType: Record<LocationType, number>;
  recentBadge: BadgeInfo | null;
}

// ============ HELPERS ============

const TIER_THRESHOLDS: Record<BadgeTier, number> = {
  bronze: 25,
  silver: 50,
  gold: 75,
  platinum: 100,
};

const TIER_ORDER: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];

function getTierFromProgress(progressPercent: number): BadgeTier | null {
  if (progressPercent >= 100) return 'platinum';
  if (progressPercent >= 75) return 'gold';
  if (progressPercent >= 50) return 'silver';
  if (progressPercent >= 25) return 'bronze';
  return null;
}

function getNextTier(currentTier: BadgeTier | null): BadgeTier | null {
  if (!currentTier) return 'bronze';
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[currentIndex + 1];
}

function getProgressToNextTier(progressPercent: number, currentTier: BadgeTier | null): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 0;
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  return Math.max(0, nextThreshold - progressPercent);
}

function mapUserBadgeToBadgeInfo(userBadge: any, locationImageUrl: string | null = null): BadgeInfo {
  return {
    id: userBadge.id,
    tier: userBadge.badge.tier,
    locationId: userBadge.badge.locationId,
    locationName: userBadge.badge.locationName,
    locationType: userBadge.badge.locationType,
    iconUrl: userBadge.badge.iconUrl,
    locationImageUrl,
    earnedAt: userBadge.earnedAt.toISOString(),
    attractionsVisited: userBadge.attractionsVisited,
    totalAttractions: userBadge.totalAttractions,
    progressPercent: userBadge.progressPercent,
  };
}

// Helper to fetch location image URL based on location type
async function getLocationImageUrl(locationId: string, locationType: LocationType): Promise<string | null> {
  if (locationType === 'city') {
    const city = await prisma.city.findUnique({
      where: { id: locationId },
      select: { imageUrl: true },
    });
    return city?.imageUrl || null;
  } else if (locationType === 'country') {
    const country = await prisma.country.findUnique({
      where: { id: locationId },
      select: { flagUrl: true, imageUrl: true },
    });
    // Prefer flagUrl for countries, fall back to imageUrl
    return country?.flagUrl || country?.imageUrl || null;
  } else if (locationType === 'continent') {
    const continent = await prisma.continent.findUnique({
      where: { id: locationId },
      select: { imageUrl: true },
    });
    return continent?.imageUrl || null;
  }
  return null;
}

// Helper to map user badge with location image
async function mapUserBadgeWithImage(userBadge: any): Promise<BadgeInfo> {
  const locationImageUrl = await getLocationImageUrl(
    userBadge.badge.locationId,
    userBadge.badge.locationType
  );
  return mapUserBadgeToBadgeInfo(userBadge, locationImageUrl);
}

// ============ SERVICE CLASS ============

export class BadgeService {
  /**
   * Check and award badges after a user visits an attraction.
   * Checks city, country, and continent levels.
   */
  async checkAndAwardBadges(userId: string, cityId: string): Promise<NewBadgeResult[]> {
    // Get the full location hierarchy
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        country: {
          include: {
            continent: true,
          },
        },
      },
    });

    if (!city) {
      return [];
    }

    const results: NewBadgeResult[] = [];

    // Check city level
    const cityResult = await this.checkAndAwardBadgeForLocation(
      userId,
      city.id,
      city.name,
      'city'
    );
    if (cityResult) results.push(cityResult);

    // Check country level
    const countryResult = await this.checkAndAwardBadgeForLocation(
      userId,
      city.country.id,
      city.country.name,
      'country'
    );
    if (countryResult) results.push(countryResult);

    // Check continent level
    const continentResult = await this.checkAndAwardBadgeForLocation(
      userId,
      city.country.continent.id,
      city.country.continent.name,
      'continent'
    );
    if (continentResult) results.push(continentResult);

    return results;
  }

  /**
   * Check and award badge for a specific location
   */
  private async checkAndAwardBadgeForLocation(
    userId: string,
    locationId: string,
    locationName: string,
    locationType: LocationType
  ): Promise<NewBadgeResult | null> {
    // Calculate current progress
    const progress = await this.calculateProgress(userId, locationId, locationType);

    // Determine current tier from progress
    const currentTier = getTierFromProgress(progress.progressPercent);

    if (!currentTier) {
      return null; // No badge earned yet
    }

    // Check if badge already exists
    let badge = await prisma.badge.findUnique({
      where: {
        locationId_tier: {
          locationId,
          tier: currentTier,
        },
      },
    });

    // Create badge if it doesn't exist
    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          locationId,
          locationType,
          locationName,
          tier: currentTier,
        },
      });
    }

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
      include: { badge: true },
    });

    if (existingUserBadge) {
      // User already has this badge
      return {
        badge: await mapUserBadgeWithImage(existingUserBadge),
        isNew: false,
      };
    }

    // Award new badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        attractionsVisited: progress.visitedAttractions,
        totalAttractions: progress.totalAttractions,
        progressPercent: progress.progressPercent,
      },
      include: { badge: true },
    });

    return {
      badge: await mapUserBadgeWithImage(userBadge),
      isNew: true,
    };
  }

  /**
   * Calculate progress for a specific location
   */
  private async calculateProgress(
    userId: string,
    locationId: string,
    locationType: LocationType
  ): Promise<{ totalAttractions: number; visitedAttractions: number; progressPercent: number }> {
    let totalAttractions = 0;
    let visitedAttractions = 0;

    if (locationType === 'city') {
      // Count attractions in the city
      totalAttractions = await prisma.attraction.count({
        where: { cityId: locationId },
      });

      // Count visited attractions in the city
      visitedAttractions = await prisma.visit.count({
        where: {
          userId,
          attraction: { cityId: locationId },
        },
      });
    } else if (locationType === 'country') {
      // Count attractions in the country (all cities in this country)
      totalAttractions = await prisma.attraction.count({
        where: {
          city: { countryId: locationId },
        },
      });

      // Count visited attractions in the country
      visitedAttractions = await prisma.visit.count({
        where: {
          userId,
          attraction: {
            city: { countryId: locationId },
          },
        },
      });
    } else if (locationType === 'continent') {
      // Count attractions in the continent (all cities in all countries in this continent)
      totalAttractions = await prisma.attraction.count({
        where: {
          city: {
            country: { continentId: locationId },
          },
        },
      });

      // Count visited attractions in the continent
      visitedAttractions = await prisma.visit.count({
        where: {
          userId,
          attraction: {
            city: {
              country: { continentId: locationId },
            },
          },
        },
      });
    }

    const progressPercent = totalAttractions > 0
      ? Math.round((visitedAttractions / totalAttractions) * 100)
      : 0;

    return { totalAttractions, visitedAttractions, progressPercent };
  }

  /**
   * Get all badges earned by a user
   */
  async getUserBadges(
    userId: string,
    filters?: { locationType?: LocationType; tier?: BadgeTier }
  ): Promise<BadgeInfo[]> {
    const where: any = { userId };

    if (filters?.locationType || filters?.tier) {
      where.badge = {};
      if (filters.locationType) {
        where.badge.locationType = filters.locationType;
      }
      if (filters.tier) {
        where.badge.tier = filters.tier;
      }
    }

    const userBadges = await prisma.userBadge.findMany({
      where,
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return Promise.all(userBadges.map(mapUserBadgeWithImage));
  }

  /**
   * Get badge progress for a specific location
   */
  async getBadgeProgress(
    userId: string,
    locationType: LocationType,
    locationId: string
  ): Promise<BadgeProgress> {
    // Get location name
    let locationName = '';
    if (locationType === 'city') {
      const city = await prisma.city.findUnique({ where: { id: locationId } });
      locationName = city?.name || '';
    } else if (locationType === 'country') {
      const country = await prisma.country.findUnique({ where: { id: locationId } });
      locationName = country?.name || '';
    } else if (locationType === 'continent') {
      const continent = await prisma.continent.findUnique({ where: { id: locationId } });
      locationName = continent?.name || '';
    }

    // Calculate progress
    const progress = await this.calculateProgress(userId, locationId, locationType);
    const currentTier = getTierFromProgress(progress.progressPercent);
    const nextTier = getNextTier(currentTier);
    const progressToNextTier = getProgressToNextTier(progress.progressPercent, currentTier);

    // Get earned badges for this location
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId,
        badge: { locationId },
      },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return {
      locationId,
      locationName,
      locationType,
      totalAttractions: progress.totalAttractions,
      visitedAttractions: progress.visitedAttractions,
      progressPercent: progress.progressPercent,
      currentTier,
      nextTier,
      progressToNextTier,
      earnedBadges: await Promise.all(userBadges.map(mapUserBadgeWithImage)),
    };
  }

  /**
   * Get progress for all locations the user has visited
   */
  async getAllProgress(userId: string): Promise<{
    cities: BadgeProgress[];
    countries: BadgeProgress[];
    continents: BadgeProgress[];
  }> {
    // Get all cities where user has visited at least one attraction
    const visitedCities = await prisma.visit.findMany({
      where: { userId },
      select: {
        attraction: {
          select: {
            city: {
              select: {
                id: true,
                name: true,
                country: {
                  select: {
                    id: true,
                    name: true,
                    continent: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract unique cities, countries, and continents
    const cityMap = new Map<string, { id: string; name: string }>();
    const countryMap = new Map<string, { id: string; name: string }>();
    const continentMap = new Map<string, { id: string; name: string }>();

    for (const visit of visitedCities) {
      const city = visit.attraction.city;
      cityMap.set(city.id, { id: city.id, name: city.name });
      countryMap.set(city.country.id, { id: city.country.id, name: city.country.name });
      continentMap.set(city.country.continent.id, {
        id: city.country.continent.id,
        name: city.country.continent.name,
      });
    }

    // Calculate progress for each location
    const cities: BadgeProgress[] = [];
    const countries: BadgeProgress[] = [];
    const continents: BadgeProgress[] = [];

    for (const city of cityMap.values()) {
      const progress = await this.getBadgeProgress(userId, 'city', city.id);
      cities.push(progress);
    }

    for (const country of countryMap.values()) {
      const progress = await this.getBadgeProgress(userId, 'country', country.id);
      countries.push(progress);
    }

    for (const continent of continentMap.values()) {
      const progress = await this.getBadgeProgress(userId, 'continent', continent.id);
      continents.push(progress);
    }

    // Sort by progress descending
    cities.sort((a, b) => b.progressPercent - a.progressPercent);
    countries.sort((a, b) => b.progressPercent - a.progressPercent);
    continents.sort((a, b) => b.progressPercent - a.progressPercent);

    return { cities, countries, continents };
  }

  /**
   * Get badge earning timeline
   */
  async getBadgeTimeline(userId: string, limit = 20): Promise<BadgeInfo[]> {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    });

    return Promise.all(userBadges.map(mapUserBadgeWithImage));
  }

  /**
   * Get badge summary for a user
   */
  async getBadgeSummary(userId: string): Promise<BadgeSummary> {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const badgesByTier: Record<BadgeTier, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    const badgesByType: Record<LocationType, number> = {
      city: 0,
      country: 0,
      continent: 0,
    };

    for (const ub of userBadges) {
      badgesByTier[ub.badge.tier]++;
      badgesByType[ub.badge.locationType]++;
    }

    return {
      totalBadges: userBadges.length,
      badgesByTier,
      badgesByType,
      recentBadge: userBadges.length > 0 ? await mapUserBadgeWithImage(userBadges[0]) : null,
    };
  }
}

export const badgeService = new BadgeService();
