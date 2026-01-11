import { apiClient } from './config';

export type LeaderboardBadge =
  | 'gold_champion'
  | 'silver_explorer'
  | 'bronze_voyager'
  | 'elite_traveler'
  | 'rising_star'
  | null;

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  verifiedVisits: number;
  badge: LeaderboardBadge;
}

export interface UserLeaderboardStats {
  rank: number | null;
  verifiedVisits: number;
  totalVisits: number;
  badge: LeaderboardBadge;
  isEligible: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUser: UserLeaderboardStats | null;
  totalParticipants: number;
}

export interface BadgeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  position: number | string;
}

export const leaderboardApi = {
  /**
   * Get the global leaderboard with current user's position
   */
  async getLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
    const response = await apiClient.get('/leaderboard', { params: { limit } });
    return response.data.data;
  },

  /**
   * Get top 10 users (quick preview)
   */
  async getTopUsers(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get('/leaderboard/top');
    return response.data.data;
  },

  /**
   * Get current user's leaderboard stats
   */
  async getMyStats(): Promise<UserLeaderboardStats> {
    const response = await apiClient.get('/leaderboard/me');
    return response.data.data;
  },

  /**
   * Get badge definitions
   */
  async getBadgeInfo(): Promise<{ badges: BadgeInfo[] }> {
    const response = await apiClient.get('/leaderboard/badges');
    return response.data.data;
  },
};
