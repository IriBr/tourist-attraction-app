import { prisma } from '../config/database.js';

// Leaderboard badge definitions based on position
export type LeaderboardBadge =
  | 'gold_champion'      // #1
  | 'silver_explorer'    // #2
  | 'bronze_voyager'     // #3
  | 'elite_traveler'     // Top 10
  | 'rising_star'        // Top 100
  | null;                // No badge

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  verifiedVisits: number;
  badge: LeaderboardBadge;
}

export interface UserLeaderboardStats {
  rank: number | null;  // null if user has no verified visits or is not premium
  verifiedVisits: number;
  totalVisits: number;
  badge: LeaderboardBadge;
  isEligible: boolean;  // false if not premium
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUser: UserLeaderboardStats | null;
  totalParticipants: number;
}

/**
 * Get badge based on leaderboard position
 */
function getBadgeForPosition(rank: number): LeaderboardBadge {
  if (rank === 1) return 'gold_champion';
  if (rank === 2) return 'silver_explorer';
  if (rank === 3) return 'bronze_voyager';
  if (rank <= 10) return 'elite_traveler';
  if (rank <= 100) return 'rising_star';
  return null;
}

/**
 * Get display name (first name + last initial for privacy)
 */
function getDisplayName(name: string | null, email: string): string {
  if (!name) {
    // Use email prefix
    return email.split('@')[0];
  }

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0];
  }

  // First name + last initial
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export const leaderboardService = {
  /**
   * Get the global leaderboard
   * Only premium users with verified visits are ranked
   */
  async getLeaderboard(limit = 100, userId?: string): Promise<LeaderboardResponse> {
    // Get all premium users with their verified visit counts
    const usersWithVerifiedVisits = await prisma.user.findMany({
      where: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        visits: {
          some: {
            isVerified: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        _count: {
          select: {
            visits: {
              where: {
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: {
        visits: {
          _count: 'desc',
        },
      },
    });

    // Sort by verified visit count (Prisma orderBy on _count may not work perfectly)
    const sorted = usersWithVerifiedVisits.sort(
      (a, b) => b._count.visits - a._count.visits
    );

    // Assign ranks
    const leaderboard: LeaderboardEntry[] = sorted.slice(0, limit).map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: getDisplayName(user.name, user.email),
      avatarUrl: user.avatarUrl,
      verifiedVisits: user._count.visits,
      badge: getBadgeForPosition(index + 1),
    }));

    // Get current user's stats if provided
    let currentUser: UserLeaderboardStats | null = null;
    if (userId) {
      currentUser = await this.getUserStats(userId, sorted);
    }

    return {
      leaderboard,
      currentUser,
      totalParticipants: sorted.length,
    };
  },

  /**
   * Get a specific user's leaderboard stats
   */
  async getUserStats(
    userId: string,
    precomputedRanking?: { id: string; _count: { visits: number } }[]
  ): Promise<UserLeaderboardStats> {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    // Get visit counts
    const [totalVisits, verifiedVisits] = await Promise.all([
      prisma.visit.count({ where: { userId } }),
      prisma.visit.count({ where: { userId, isVerified: true } }),
    ]);

    const isPremium = user?.subscriptionTier === 'premium' && user?.subscriptionStatus === 'active';

    // If not premium or no verified visits, no rank
    if (!isPremium || verifiedVisits === 0) {
      return {
        rank: null,
        verifiedVisits,
        totalVisits,
        badge: null,
        isEligible: isPremium,
      };
    }

    // Calculate rank
    let rank: number;

    if (precomputedRanking) {
      // Use precomputed ranking if available
      const userIndex = precomputedRanking.findIndex(u => u.id === userId);
      rank = userIndex >= 0 ? userIndex + 1 : precomputedRanking.length + 1;
    } else {
      // Count how many users have more verified visits
      const usersAhead = await prisma.user.count({
        where: {
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          visits: {
            some: {
              isVerified: true,
            },
          },
          id: { not: userId },
          // This is tricky - we need users with MORE verified visits
        },
      });

      // More accurate: count users with higher verified visit count
      const usersWithMoreVisits = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT u.id) as count
        FROM "User" u
        JOIN "Visit" v ON v."userId" = u.id
        WHERE u."subscriptionTier" = 'premium'
          AND u."subscriptionStatus" = 'active'
          AND v."isVerified" = true
          AND u.id != ${userId}
        GROUP BY u.id
        HAVING COUNT(v.id) > ${verifiedVisits}
      `;

      rank = (usersWithMoreVisits.length || 0) + 1;
    }

    return {
      rank,
      verifiedVisits,
      totalVisits,
      badge: getBadgeForPosition(rank),
      isEligible: true,
    };
  },

  /**
   * Get user's current badge based on their leaderboard position
   */
  async getUserBadge(userId: string): Promise<LeaderboardBadge> {
    const stats = await this.getUserStats(userId);
    return stats.badge;
  },

  /**
   * Get top N users for a quick preview
   */
  async getTopUsers(limit = 10): Promise<LeaderboardEntry[]> {
    const result = await this.getLeaderboard(limit);
    return result.leaderboard;
  },
};
