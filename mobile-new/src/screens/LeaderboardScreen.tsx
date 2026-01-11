import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components';
import { leaderboardApi, LeaderboardEntry, LeaderboardBadge, UserLeaderboardStats, BadgeInfo } from '../api';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { colors } from '../theme';

// Badge display config
const BADGE_CONFIG: Record<string, { emoji: string; color: string; bgColor: string }> = {
  gold_champion: { emoji: '🥇', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.2)' },
  silver_explorer: { emoji: '🥈', color: '#C0C0C0', bgColor: 'rgba(192, 192, 192, 0.2)' },
  bronze_voyager: { emoji: '🥉', color: '#CD7F32', bgColor: 'rgba(205, 127, 50, 0.2)' },
  elite_traveler: { emoji: '⭐', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.2)' },
  rising_star: { emoji: '✨', color: '#3498DB', bgColor: 'rgba(52, 152, 219, 0.2)' },
};

function getBadgeDisplay(badge: LeaderboardBadge) {
  if (!badge) return null;
  return BADGE_CONFIG[badge] || null;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        style={styles.topRankBadge}
      >
        <Text style={styles.topRankText}>1</Text>
      </LinearGradient>
    );
  }
  if (rank === 2) {
    return (
      <LinearGradient
        colors={['#C0C0C0', '#A0A0A0']}
        style={styles.topRankBadge}
      >
        <Text style={styles.topRankText}>2</Text>
      </LinearGradient>
    );
  }
  if (rank === 3) {
    return (
      <LinearGradient
        colors={['#CD7F32', '#8B4513']}
        style={styles.topRankBadge}
      >
        <Text style={styles.topRankText}>3</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
  );
}

function LeaderboardCard({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  const badgeDisplay = getBadgeDisplay(entry.badge);

  return (
    <View style={[styles.leaderboardCard, isCurrentUser && styles.currentUserCard]}>
      <LinearGradient
        colors={isCurrentUser ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={styles.cardGradient}
      />

      <RankBadge rank={entry.rank} />

      <View style={styles.userInfo}>
        {entry.avatarUrl ? (
          <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
              {entry.name}
            </Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
          </View>
          {badgeDisplay && (
            <View style={[styles.badgeTag, { backgroundColor: badgeDisplay.bgColor }]}>
              <Text style={styles.badgeEmoji}>{badgeDisplay.emoji}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.visitsCount}>{entry.verifiedVisits}</Text>
        <Text style={styles.visitsLabel}>verified</Text>
      </View>
    </View>
  );
}

function UserStatsCard({ stats, isPremium }: { stats: UserLeaderboardStats | null; isPremium: boolean }) {
  const navigation = useNavigation();

  if (!stats) return null;

  const badgeDisplay = getBadgeDisplay(stats.badge);

  if (!stats.isEligible || !isPremium) {
    return (
      <View style={styles.userStatsCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={styles.cardGradient}
        />
        <View style={styles.notEligibleContent}>
          <Ionicons name="lock-closed" size={32} color={colors.secondary} />
          <Text style={styles.notEligibleTitle}>Join the Competition</Text>
          <Text style={styles.notEligibleText}>
            {isPremium
              ? 'Start scanning attractions with your camera to earn verified visits and compete on the leaderboard!'
              : 'Upgrade to Premium to use camera scanning and compete on the global leaderboard.'}
          </Text>
          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => (navigation as any).navigate('Premium')}
            >
              <LinearGradient
                colors={[colors.secondary, '#FF8C00']}
                style={styles.upgradeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userStatsCard}>
      <LinearGradient
        colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']}
        style={styles.cardGradient}
      />
      <Text style={styles.yourStatsTitle}>Your Position</Text>

      <View style={styles.yourStatsRow}>
        <View style={styles.yourStatItem}>
          <Text style={styles.yourStatValue}>
            {stats.rank ? `#${stats.rank}` : '-'}
          </Text>
          <Text style={styles.yourStatLabel}>Rank</Text>
        </View>

        <View style={styles.yourStatDivider} />

        <View style={styles.yourStatItem}>
          <Text style={styles.yourStatValue}>{stats.verifiedVisits}</Text>
          <Text style={styles.yourStatLabel}>Verified</Text>
        </View>

        <View style={styles.yourStatDivider} />

        <View style={styles.yourStatItem}>
          <Text style={styles.yourStatValue}>{stats.totalVisits}</Text>
          <Text style={styles.yourStatLabel}>Total</Text>
        </View>

        {badgeDisplay && (
          <>
            <View style={styles.yourStatDivider} />
            <View style={styles.yourStatItem}>
              <Text style={styles.badgeStatEmoji}>{badgeDisplay.emoji}</Text>
              <Text style={styles.yourStatLabel}>Badge</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function BadgeLegend({ badges }: { badges: BadgeInfo[] }) {
  return (
    <View style={styles.legendCard}>
      <Text style={styles.legendTitle}>Badge Tiers</Text>
      <View style={styles.legendGrid}>
        {badges.map((badge) => {
          const display = BADGE_CONFIG[badge.id];
          return (
            <View key={badge.id} style={styles.legendItem}>
              <View style={[styles.legendBadge, display && { backgroundColor: display.bgColor }]}>
                <Text style={styles.legendEmoji}>{badge.emoji}</Text>
              </View>
              <View style={styles.legendInfo}>
                <Text style={styles.legendName}>{badge.name}</Text>
                <Text style={styles.legendPosition}>
                  {typeof badge.position === 'number' ? `#${badge.position}` : badge.position}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscriptionStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserLeaderboardStats | null>(null);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [leaderboardData, badgeData] = await Promise.all([
        leaderboardApi.getLeaderboard(50),
        leaderboardApi.getBadgeInfo(),
      ]);

      setLeaderboard(leaderboardData.leaderboard);
      setUserStats(leaderboardData.currentUser);
      setTotalParticipants(leaderboardData.totalParticipants);
      setBadges(badgeData.badges);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(false);
  }, [loadData]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientDark}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader
        showBack
        title="Leaderboard"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.secondary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* User Stats Card */}
            <UserStatsCard stats={userStats} isPremium={isPremium} />

            {/* Participants Count */}
            <View style={styles.participantsRow}>
              <Ionicons name="people" size={18} color="rgba(255,255,255,0.5)" />
              <Text style={styles.participantsText}>
                {totalParticipants} travelers competing
              </Text>
            </View>

            {/* Badge Legend */}
            {badges.length > 0 && <BadgeLegend badges={badges} />}

            {/* Leaderboard List */}
            <View style={styles.leaderboardSection}>
              <Text style={styles.sectionTitle}>Top Travelers</Text>
              {leaderboard.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="trophy-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No entries yet. Be the first!</Text>
                </View>
              ) : (
                <View style={styles.leaderboardList}>
                  {leaderboard.map((entry) => (
                    <LeaderboardCard
                      key={entry.userId}
                      entry={entry}
                      isCurrentUser={userStats?.rank === entry.rank}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  // User stats card
  userStatsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  yourStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  yourStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  yourStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  yourStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  yourStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  yourStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeStatEmoji: {
    fontSize: 28,
  },
  notEligibleContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  notEligibleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  notEligibleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Participants row
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  participantsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  // Badge legend
  legendCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 8,
  },
  legendBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  legendEmoji: {
    fontSize: 18,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  legendPosition: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  // Leaderboard section
  leaderboardSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  leaderboardList: {
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 12,
  },
  // Leaderboard card
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  currentUserCard: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  topRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  currentUserName: {
    color: colors.secondary,
  },
  youBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondary,
  },
  badgeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  statsContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  visitsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  visitsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
