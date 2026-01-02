import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBadgeStore } from '../store';
import { AppHeader } from '../components';
import { BadgeProgress, BadgeTier, LocationType, BADGE_THRESHOLDS } from '@tourist-app/shared';

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TAB_CONFIG = {
  continents: { icon: 'globe', color: '#4CAF50', label: 'Continents' },
  countries: { icon: 'flag', color: '#00BCD4', label: 'Countries' },
  cities: { icon: 'business', color: '#e91e63', label: 'Cities' },
};

type TabType = 'continents' | 'countries' | 'cities';

function ProgressBar({ percent, currentTier }: { percent: number; currentTier: BadgeTier | null }) {
  const tierColor = currentTier ? TIER_COLORS[currentTier] : '#e91e63';

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <LinearGradient
          colors={[tierColor, `${tierColor}99`]}
          style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      {/* Tier markers */}
      <View style={styles.tierMarkers}>
        {Object.entries(BADGE_THRESHOLDS).map(([tier, threshold]) => (
          <View
            key={tier}
            style={[styles.tierMarker, { left: `${threshold}%` }]}
          >
            <View
              style={[
                styles.tierDot,
                percent >= threshold && { backgroundColor: TIER_COLORS[tier as BadgeTier] }
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const LOCATION_TO_TAB: Record<LocationType, TabType> = {
  city: 'cities',
  country: 'countries',
  continent: 'continents',
};

function ProgressCard({ progress }: { progress: BadgeProgress }) {
  const tierColor = progress.currentTier ? TIER_COLORS[progress.currentTier] : 'rgba(255,255,255,0.3)';
  const tabType = LOCATION_TO_TAB[progress.locationType] || 'cities';
  const tabConfig = TAB_CONFIG[tabType];

  return (
    <View style={styles.progressCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[`${tabConfig.color}30`, `${tabConfig.color}15`]}
          style={styles.locationIconBg}
        >
          <Ionicons name={tabConfig.icon} size={18} color={tabConfig.color} />
        </LinearGradient>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{progress.locationName}</Text>
          <Text style={styles.locationMeta}>
            {progress.visitedAttractions} of {progress.totalAttractions} attractions
          </Text>
        </View>
        {progress.currentTier && (
          <View style={[styles.currentTierBadge, { backgroundColor: `${tierColor}25` }]}>
            <Ionicons name="medal" size={12} color={tierColor} />
            <Text style={[styles.currentTierText, { color: tierColor }]}>
              {progress.currentTier.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <ProgressBar percent={progress.progressPercent} currentTier={progress.currentTier} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={[styles.progressPercent, { color: tierColor }]}>
          {progress.progressPercent}%
        </Text>
        {progress.nextTier && progress.progressToNextTier > 0 && (
          <View style={styles.nextTierInfo}>
            <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.nextTierText}>
              {progress.progressToNextTier}% to {progress.nextTier.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function EmptyState({ type }: { type: TabType }) {
  const config = TAB_CONFIG[type];

  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={[`${config.color}20`, `${config.color}10`]}
        style={styles.emptyIconBg}
      >
        <Ionicons name={config.icon} size={48} color={config.color} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No {config.label} Progress Yet</Text>
      <Text style={styles.emptyText}>
        Start visiting attractions to track your progress and earn badges!
      </Text>
    </View>
  );
}

function TabButton({ tab, isActive, onPress }: { tab: TabType; isActive: boolean; onPress: () => void }) {
  const config = TAB_CONFIG[tab];

  return (
    <TouchableOpacity
      style={[styles.tab, isActive && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isActive ? (
        <LinearGradient
          colors={[`${config.color}30`, `${config.color}15`]}
          style={styles.activeTabGradient}
        >
          <Ionicons name={config.icon} size={18} color={config.color} />
          <Text style={[styles.tabText, { color: config.color }]}>{config.label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTabContent}>
          <Ionicons name={config.icon} size={18} color="rgba(255,255,255,0.4)" />
          <Text style={styles.tabTextInactive}>{config.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { progress, isLoading, error, fetchProgress } = useBadgeStore();
  const [activeTab, setActiveTab] = useState<TabType>('continents');

  useEffect(() => {
    fetchProgress();
  }, []);

  const getProgressList = (): BadgeProgress[] => {
    if (!progress) return [];
    switch (activeTab) {
      case 'continents':
        return progress.continents || [];
      case 'countries':
        return progress.countries || [];
      case 'cities':
        return progress.cities || [];
      default:
        return [];
    }
  };

  const progressList = getProgressList();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader
        showBack
        title="My Progress"
        rightAction={{
          icon: 'medal',
          onPress: () => (navigation as any).navigate('BadgesScreen'),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          {(['continents', 'countries', 'cities'] as TabType[]).map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              isActive={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Badge Tiers</Text>
          <View style={styles.legendRow}>
            {Object.entries(TIER_COLORS).map(([tier, color]) => (
              <View key={tier} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <View>
                  <Text style={styles.legendTier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                  <Text style={styles.legendThreshold}>{BADGE_THRESHOLDS[tier as BadgeTier]}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e91e63" />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Ionicons name="alert-circle" size={32} color="#e91e63" />
            </View>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProgress}>
              <LinearGradient
                colors={['#e91e63', '#c2185b']}
                style={styles.retryGradient}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : progressList.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <View style={styles.progressList}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {TAB_CONFIG[activeTab].label} ({progressList.length})
              </Text>
            </View>
            {progressList.map((item) => (
              <ProgressCard key={item.locationId} progress={item} />
            ))}
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTab: {},
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  inactiveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextInactive: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  legendCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTier: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  legendThreshold: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressList: {
    gap: 12,
  },
  listHeader: {
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  locationMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  currentTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  currentTierText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tierMarkers: {
    position: 'relative',
    height: 16,
    marginTop: 4,
  },
  tierMarker: {
    position: 'absolute',
    transform: [{ translateX: -5 }],
    alignItems: 'center',
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
  },
  nextTierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextTierText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
