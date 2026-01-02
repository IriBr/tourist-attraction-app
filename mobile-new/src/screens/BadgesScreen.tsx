import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBadgeStore } from '../store';
import { AppHeader } from '../components';
import { BadgeTier, LocationType, UserBadge } from '../types';

const TIER_CONFIG: Record<BadgeTier, { gradient: [string, string]; text: string; glow: string }> = {
  bronze: {
    gradient: ['#CD7F32', '#8B4513'],
    text: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    gradient: ['#C0C0C0', '#808080'],
    text: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.3)',
  },
  gold: {
    gradient: ['#FFD700', '#DAA520'],
    text: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.3)',
  },
  platinum: {
    gradient: ['#E5E4E2', '#B8B8B8'],
    text: '#E5E4E2',
    glow: 'rgba(229, 228, 226, 0.4)',
  },
};

const LOCATION_ICONS: Record<LocationType, keyof typeof Ionicons.glyphMap> = {
  city: 'business',
  country: 'flag',
  continent: 'globe',
};

function BadgeCard({ badge }: { badge: UserBadge }) {
  const tierConfig = TIER_CONFIG[badge.tier as BadgeTier] || TIER_CONFIG.bronze;
  const locationIcon = LOCATION_ICONS[badge.locationType as LocationType] || 'trophy';

  return (
    <View style={styles.badgeCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.badgeCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Badge Icon */}
      <View style={[styles.badgeIconOuter, { shadowColor: tierConfig.text }]}>
        <LinearGradient
          colors={tierConfig.gradient}
          style={styles.badgeIconGradient}
        >
          <Ionicons name={locationIcon} size={24} color="#fff" />
        </LinearGradient>
      </View>

      {/* Badge Info */}
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{badge.locationName}</Text>
        <View style={styles.badgeMetaRow}>
          <View style={[styles.tierPill, { backgroundColor: `${tierConfig.text}20` }]}>
            <Ionicons name="medal" size={10} color={tierConfig.text} />
            <Text style={[styles.tierPillText, { color: tierConfig.text }]}>
              {badge.tier.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.badgeType}>
            {badge.locationType.charAt(0).toUpperCase() + badge.locationType.slice(1)}
          </Text>
        </View>
      </View>

      {/* Progress Circle */}
      <View style={styles.progressCircleContainer}>
        <View style={[styles.progressCircle, { borderColor: `${tierConfig.text}30` }]}>
          <Text style={[styles.progressPercent, { color: tierConfig.text }]}>
            {badge.progressPercent}%
          </Text>
        </View>
        <Text style={styles.progressLabel}>
          {badge.attractionsVisited}/{badge.totalAttractions}
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({ summary }: { summary: any }) {
  return (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={['rgba(233, 30, 99, 0.15)', 'rgba(233, 30, 99, 0.05)']}
        style={styles.summaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Main Stats Row */}
      <View style={styles.summaryMainRow}>
        <View style={styles.summaryMainItem}>
          <LinearGradient
            colors={['#e91e63', '#c2185b']}
            style={styles.summaryMainIcon}
          >
            <Ionicons name="trophy" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.summaryMainValue}>{summary?.totalBadges || 0}</Text>
          <Text style={styles.summaryMainLabel}>Total Badges</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryTiersContainer}>
          <View style={styles.summaryTierRow}>
            <View style={styles.summaryTierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#E5E4E2' }]} />
              <Text style={styles.tierValue}>{summary?.badgesByTier?.platinum || 0}</Text>
              <Text style={styles.tierLabel}>Platinum</Text>
            </View>
            <View style={styles.summaryTierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#FFD700' }]} />
              <Text style={styles.tierValue}>{summary?.badgesByTier?.gold || 0}</Text>
              <Text style={styles.tierLabel}>Gold</Text>
            </View>
          </View>
          <View style={styles.summaryTierRow}>
            <View style={styles.summaryTierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#C0C0C0' }]} />
              <Text style={styles.tierValue}>{summary?.badgesByTier?.silver || 0}</Text>
              <Text style={styles.tierLabel}>Silver</Text>
            </View>
            <View style={styles.summaryTierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#CD7F32' }]} />
              <Text style={styles.tierValue}>{summary?.badgesByTier?.bronze || 0}</Text>
              <Text style={styles.tierLabel}>Bronze</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location Types Row */}
      <View style={styles.summaryTypesRow}>
        <View style={styles.summaryTypeItem}>
          <LinearGradient
            colors={['rgba(233, 30, 99, 0.2)', 'rgba(233, 30, 99, 0.1)']}
            style={styles.typeIconBg}
          >
            <Ionicons name="business" size={18} color="#e91e63" />
          </LinearGradient>
          <Text style={styles.typeValue}>{summary?.badgesByType?.city || 0}</Text>
          <Text style={styles.typeLabel}>Cities</Text>
        </View>
        <View style={styles.summaryTypeItem}>
          <LinearGradient
            colors={['rgba(0, 188, 212, 0.2)', 'rgba(0, 188, 212, 0.1)']}
            style={styles.typeIconBg}
          >
            <Ionicons name="flag" size={18} color="#00BCD4" />
          </LinearGradient>
          <Text style={styles.typeValue}>{summary?.badgesByType?.country || 0}</Text>
          <Text style={styles.typeLabel}>Countries</Text>
        </View>
        <View style={styles.summaryTypeItem}>
          <LinearGradient
            colors={['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)']}
            style={styles.typeIconBg}
          >
            <Ionicons name="globe" size={18} color="#4CAF50" />
          </LinearGradient>
          <Text style={styles.typeValue}>{summary?.badgesByType?.continent || 0}</Text>
          <Text style={styles.typeLabel}>Continents</Text>
        </View>
      </View>
    </View>
  );
}

export function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { badges, summary, isLoading, error, fetchBadges } = useBadgeStore();

  useEffect(() => {
    fetchBadges();
  }, []);

  const groupedBadges = React.useMemo(() => {
    const grouped: Record<string, UserBadge[]> = {
      continent: [],
      country: [],
      city: [],
    };
    badges.forEach((badge) => {
      if (grouped[badge.locationType]) {
        grouped[badge.locationType].push(badge);
      }
    });
    return grouped;
  }, [badges]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader
        showBack
        title="My Badges"
        rightAction={{
          icon: 'stats-chart',
          onPress: () => (navigation as any).navigate('ProgressScreen'),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e91e63" />
            <Text style={styles.loadingText}>Loading your badges...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Ionicons name="alert-circle" size={32} color="#e91e63" />
            </View>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchBadges}>
              <LinearGradient
                colors={['#e91e63', '#c2185b']}
                style={styles.retryGradient}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary */}
            <SummaryCard summary={summary} />

            {/* Empty State */}
            {badges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['rgba(233, 30, 99, 0.15)', 'rgba(233, 30, 99, 0.05)']}
                  style={styles.emptyIconBg}
                >
                  <Ionicons name="medal-outline" size={48} color="#e91e63" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No Badges Yet</Text>
                <Text style={styles.emptyText}>
                  Start exploring and visit attractions to earn badges!
                </Text>
                <View style={styles.emptyTiers}>
                  <View style={styles.emptyTierItem}>
                    <View style={[styles.emptyTierDot, { backgroundColor: '#CD7F32' }]} />
                    <Text style={styles.emptyTierText}>Bronze at 25%</Text>
                  </View>
                  <View style={styles.emptyTierItem}>
                    <View style={[styles.emptyTierDot, { backgroundColor: '#C0C0C0' }]} />
                    <Text style={styles.emptyTierText}>Silver at 50%</Text>
                  </View>
                  <View style={styles.emptyTierItem}>
                    <View style={[styles.emptyTierDot, { backgroundColor: '#FFD700' }]} />
                    <Text style={styles.emptyTierText}>Gold at 75%</Text>
                  </View>
                  <View style={styles.emptyTierItem}>
                    <View style={[styles.emptyTierDot, { backgroundColor: '#E5E4E2' }]} />
                    <Text style={styles.emptyTierText}>Platinum at 100%</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Continent Badges */}
                {groupedBadges.continent.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="globe" size={18} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Continent Badges</Text>
                      <View style={styles.sectionCount}>
                        <Text style={styles.sectionCountText}>
                          {groupedBadges.continent.length}
                        </Text>
                      </View>
                    </View>
                    {groupedBadges.continent.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </View>
                )}

                {/* Country Badges */}
                {groupedBadges.country.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flag" size={18} color="#00BCD4" />
                      <Text style={styles.sectionTitle}>Country Badges</Text>
                      <View style={styles.sectionCount}>
                        <Text style={styles.sectionCountText}>
                          {groupedBadges.country.length}
                        </Text>
                      </View>
                    </View>
                    {groupedBadges.country.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </View>
                )}

                {/* City Badges */}
                {groupedBadges.city.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="business" size={18} color="#e91e63" />
                      <Text style={styles.sectionTitle}>City Badges</Text>
                      <View style={styles.sectionCount}>
                        <Text style={styles.sectionCountText}>
                          {groupedBadges.city.length}
                        </Text>
                      </View>
                    </View>
                    {groupedBadges.city.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </View>
                )}
              </>
            )}
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
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  errorIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  summaryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryMainItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryMainIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryMainValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  summaryMainLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  summaryTiersContainer: {
    flex: 1,
    gap: 12,
  },
  summaryTierRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryTierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tierLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryTypesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  summaryTypeItem: {
    flex: 1,
    alignItems: 'center',
  },
  typeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  typeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyTiers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyTierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyTierText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  sectionCount: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  badgeCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeIconOuter: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  progressCircleContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});
