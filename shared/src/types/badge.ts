export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum LocationType {
  CITY = 'city',
  COUNTRY = 'country',
  CONTINENT = 'continent',
}

export interface Badge {
  id: string;
  locationId: string;
  locationType: LocationType;
  locationName: string;
  tier: BadgeTier;
  iconUrl: string | null;
}

export interface UserBadge {
  id: string;
  tier: BadgeTier;
  locationId: string;
  locationName: string;
  locationType: LocationType;
  iconUrl: string | null;
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
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  progressToNextTier: number;
  earnedBadges: UserBadge[];
}

export interface BadgeSummary {
  totalBadges: number;
  badgesByTier: Record<BadgeTier, number>;
  badgesByType: Record<LocationType, number>;
  recentBadge: UserBadge | null;
}

export interface AllBadgeProgress {
  cities: BadgeProgress[];
  countries: BadgeProgress[];
  continents: BadgeProgress[];
}

export interface NewBadgeResult {
  badge: UserBadge;
  isNew: boolean;
}

export interface MarkVisitedResponse {
  visit: {
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
  };
  newBadges: NewBadgeResult[];
}

// Badge tier thresholds
export const BADGE_THRESHOLDS: Record<BadgeTier, number> = {
  [BadgeTier.BRONZE]: 25,
  [BadgeTier.SILVER]: 50,
  [BadgeTier.GOLD]: 75,
  [BadgeTier.PLATINUM]: 100,
};
