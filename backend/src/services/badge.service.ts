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

// Batch load location images to avoid N+1 queries
async function batchLoadLocationImages(
  badges: Array<{ locationId: string; locationType: LocationType }>
): Promise<Map<string, string | null>> {
  const imageMap = new Map<string, string | null>();

  // Group by location type
  const cityIds: string[] = [];
  const countryIds: string[] = [];
  const continentIds: string[] = [];

  for (const badge of badges) {
    if (badge.locationType === 'city') {
      cityIds.push(badge.locationId);
    } else if (badge.locationType === 'country') {
      countryIds.push(badge.locationId);
    } else if (badge.locationType === 'continent') {
      continentIds.push(badge.locationId);
    }
  }

  // Batch fetch all locations in parallel (3 queries max instead of N)
  const [cities, countries, continents] = await Promise.all([
    cityIds.length > 0
      ? prisma.city.findMany({
          where: { id: { in: cityIds } },
          select: { id: true, imageUrl: true },
        })
      : [],
    countryIds.length > 0
      ? prisma.country.findMany({
          where: { id: { in: countryIds } },
          select: { id: true, flagUrl: true, imageUrl: true },
        })
      : [],
    continentIds.length > 0
      ? prisma.continent.findMany({
          where: { id: { in: continentIds } },
          select: { id: true, imageUrl: true },
        })
      : [],
  ]);

  // Build the map
  for (const city of cities) {
    imageMap.set(city.id, city.imageUrl);
  }
  for (const country of countries) {
    imageMap.set(country.id, country.flagUrl || country.imageUrl);
  }
  for (const continent of continents) {
    imageMap.set(continent.id, continent.imageUrl);
  }

  return imageMap;
}

// Helper to fetch location image URL based on location type (single item - used for single badge operations)
async function getLocationImageUrl(locationId: string, locationType: LocationType): Promise<string | null> {
  const imageMap = await batchLoadLocationImages([{ locationId, locationType }]);
  return imageMap.get(locationId) || null;
}

// Helper to map user badges with location images in batch (fixes N+1)
async function mapUserBadgesWithImages(userBadges: any[]): Promise<BadgeInfo[]> {
  if (userBadges.length === 0) return [];

  // Batch load all location images
  const imageMap = await batchLoadLocationImages(
    userBadges.map(ub => ({
      locationId: ub.badge.locationId,
      locationType: ub.badge.locationType,
    }))
  );

  // Map without additional queries
  return userBadges.map(userBadge =>
    mapUserBadgeToBadgeInfo(userBadge, imageMap.get(userBadge.badge.locationId) || null)
  );
}

// Helper to map single user badge with location image (for backwards compatibility)
async function mapUserBadgeWithImage(userBadge: any): Promise<BadgeInfo> {
  const results = await mapUserBadgesWithImages([userBadge]);
  return results[0];
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

    // Use batched loading to avoid N+1 queries
    return mapUserBadgesWithImages(userBadges);
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
      // Use batched loading to avoid N+1 queries
      earnedBadges: await mapUserBadgesWithImages(userBadges),
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

    // Calculate progress for all locations IN PARALLEL using Promise.all
    // This reduces N+1 queries to batch queries
    const [cities, countries, continents] = await Promise.all([
      Promise.all(
        Array.from(cityMap.values()).map((city) =>
          this.getBadgeProgressWithName(userId, 'city', city.id, city.name)
        )
      ),
      Promise.all(
        Array.from(countryMap.values()).map((country) =>
          this.getBadgeProgressWithName(userId, 'country', country.id, country.name)
        )
      ),
      Promise.all(
        Array.from(continentMap.values()).map((continent) =>
          this.getBadgeProgressWithName(userId, 'continent', continent.id, continent.name)
        )
      ),
    ]);

    // Sort by progress descending
    cities.sort((a, b) => b.progressPercent - a.progressPercent);
    countries.sort((a, b) => b.progressPercent - a.progressPercent);
    continents.sort((a, b) => b.progressPercent - a.progressPercent);

    return { cities, countries, continents };
  }

  /**
   * Get badge progress with location name already provided (avoids extra query)
   */
  private async getBadgeProgressWithName(
    userId: string,
    locationType: LocationType,
    locationId: string,
    locationName: string
  ): Promise<BadgeProgress> {
    // Calculate progress and get earned badges in parallel
    const [progress, userBadges] = await Promise.all([
      this.calculateProgress(userId, locationId, locationType),
      prisma.userBadge.findMany({
        where: {
          userId,
          badge: { locationId },
        },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
    ]);

    const currentTier = getTierFromProgress(progress.progressPercent);
    const nextTier = getNextTier(currentTier);
    const progressToNextTier = getProgressToNextTier(progress.progressPercent, currentTier);

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
      earnedBadges: await mapUserBadgesWithImages(userBadges),
    };
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

    // Use batched loading to avoid N+1 queries
    return mapUserBadgesWithImages(userBadges);
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
