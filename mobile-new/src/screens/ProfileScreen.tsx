import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useBadgeStore, useStatsStore } from '../store';
import { locationsApi, visitsApi } from '../api';
import { colors } from '../theme';
import { useResponsive } from '../hooks';
import { MenuItem, SectionHeader, Card } from '../components/ui';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, ProfileStackParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';

const menuItems: { id: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; label: string; screen: keyof ProfileStackParamList }[] = [
  { id: '1', icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
  { id: '2', icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
  { id: '3', icon: 'lock-closed-outline', label: 'Privacy', screen: 'Privacy' },
  { id: '4', icon: 'help-circle-outline', label: 'Help & Support', screen: 'Help' },
  { id: '5', icon: 'information-circle-outline', label: 'About', screen: 'About' },
];

type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { maxContentWidth, horizontalPadding, avatarSize, isTablet } = useResponsive();
  const { user, logout } = useAuthStore();
  const {
    status,
    isPremium,
    isLoading,
    fetchStatus,
    cancelSubscription,
  } = useSubscriptionStore();
  // scansRemaining feature not yet implemented - default to 3 for UI display
  const scansRemaining = 3;
  const { progress, fetchProgress } = useBadgeStore();
  const { userStats, globalStats, fetchStats } = useStatsStore();

  const [locationStatus, setLocationStatus] = useState<'granted' | 'while_using' | 'denied'>('denied');

  // Check location permission status
  const checkLocationPermission = useCallback(async () => {
    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      setLocationStatus('granted');
    } else {
      const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
      if (fgStatus === 'granted') {
        setLocationStatus('while_using');
      } else {
        setLocationStatus('denied');
      }
    }
  }, []);

  // Fetch stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      fetchProgress();
      fetchStats();
      checkLocationPermission();
    }, [checkLocationPermission])
  );

  const handleLocationSettings = () => {
    if (locationStatus === 'granted') {
      Alert.alert(
        'Location Access Enabled',
        'Background location is enabled. You\'ll receive notifications when near attractions.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Enable Background Location',
        Platform.OS === 'ios'
          ? 'To receive notifications when you\'re near attractions (even when the app is closed), please enable "Always" location access.\n\n1. Tap "Open Settings"\n2. Select "Location"\n3. Choose "Always"'
          : 'To receive notifications when you\'re near attractions, please enable location access in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  // Use actual visit stats from API
  const visitedStats = {
    attractions: userStats?.totalVisits || 0,
    cities: userStats?.citiesVisited || 0,
    countries: userStats?.countriesVisited || 0,
    continents: userStats?.continentsVisited || 0,
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleUpgrade = () => {
    navigation.navigate('Premium');
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription?',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelSubscription();
            if (success) {
              Alert.alert('Subscription Cancelled', 'You are now on the free tier.');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingHorizontal: horizontalPadding,
            maxWidth: maxContentWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}>
              <Ionicons name="person" size={isTablet ? 48 : 40} color="#fff" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Explorer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'explorer@world.com'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {visitedStats.attractions}/{globalStats?.attractions || '...'}
            </Text>
            <Text style={styles.statLabel}>Attractions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {visitedStats.cities}/{globalStats?.cities || '...'}
            </Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {visitedStats.countries}/{globalStats?.countries || '...'}
            </Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.subscriptionSection}>
          <SectionHeader title="Subscription" />
          <View style={[styles.subscriptionCard, isPremium && styles.subscriptionCardPremium]}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionBadge}>
                <Ionicons
                  name={isPremium ? 'star' : 'flash-outline'}
                  size={20}
                  color={isPremium ? '#FFD700' : colors.secondary}
                />
                <Text style={[styles.subscriptionTier, isPremium && styles.subscriptionTierPremium]}>
                  {isPremium ? 'Premium' : 'Free Tier'}
                </Text>
              </View>
              {isLoading && <ActivityIndicator size="small" color={colors.secondary} />}
            </View>

            {!isPremium && (
              <View style={styles.scanLimitInfo}>
                <Text style={styles.scanLimitLabel}>Daily Scans Remaining</Text>
                <View style={styles.scanLimitBar}>
                  <View
                    style={[
                      styles.scanLimitFill,
                      { width: `${(scansRemaining / 3) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.scanLimitText}>{scansRemaining} of 3 scans left</Text>
              </View>
            )}

            {isPremium && (
              <View style={styles.premiumFeatures}>
                <View style={styles.premiumFeatureRow}>
                  <Ionicons name="infinite" size={18} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>Unlimited daily scans</Text>
                </View>
                <View style={styles.premiumFeatureRow}>
                  <Ionicons name="globe" size={18} color="#4CAF50" />
                  <Text style={styles.premiumFeatureText}>Access to all attractions</Text>
                </View>
                {status?.subscriptionEndDate && (
                  <Text style={styles.subscriptionEndDate}>
                    Renews: {new Date(status.subscriptionEndDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.subscriptionButton,
                isPremium && styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={isPremium ? handleCancelSubscription : handleUpgrade}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isPremium ? 'close-circle-outline' : 'star'}
                size={18}
                color={isPremium ? '#ff4757' : '#fff'}
              />
              <Text style={[styles.subscriptionButtonText, isPremium && styles.cancelButtonText]}>
                {isPremium ? 'Cancel Subscription' : 'Upgrade to Premium'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Badges & Progress */}
        <View style={styles.section}>
          <SectionHeader title="Badges & Progress" />
          <View style={styles.badgesContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.badgeNavCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => navigation.navigate('BadgesScreen')}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <View style={[styles.badgeNavIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                <Ionicons name="ribbon" size={28} color="#FFD700" />
              </View>
              <View style={styles.badgeNavContent}>
                <Text style={styles.badgeNavTitle}>My Badges</Text>
                <Text style={styles.badgeNavDesc}>View your earned badges</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.badgeNavCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => navigation.navigate('ProgressScreen')}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <View style={[styles.badgeNavIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="trending-up" size={28} color={colors.secondary} />
              </View>
              <View style={styles.badgeNavContent}>
                <Text style={styles.badgeNavTitle}>Progress</Text>
                <Text style={styles.badgeNavDesc}>Track your exploration</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </Pressable>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={() => navigation.navigate(item.screen)}
            />
          ))}

          {/* Location Settings - Special item with status */}
          <MenuItem
            icon="location-outline"
            label="Location Access"
            onPress={handleLocationSettings}
            showArrow={false}
            rightContent={
              <View style={styles.locationStatusContainer}>
                <View style={[
                  styles.locationStatusDot,
                  locationStatus === 'granted' && styles.locationStatusGranted,
                  locationStatus === 'while_using' && styles.locationStatusPartial,
                  locationStatus === 'denied' && styles.locationStatusDenied,
                ]} />
                <Text style={[
                  styles.locationStatusText,
                  locationStatus === 'granted' && styles.locationStatusTextGranted,
                  locationStatus !== 'granted' && styles.locationStatusTextWarning,
                ]}>
                  {locationStatus === 'granted' ? 'Always' : locationStatus === 'while_using' ? 'While Using' : 'Off'}
                </Text>
              </View>
            }
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ff4757" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // paddingHorizontal set dynamically
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  badgesContainer: {
    gap: 12,
  },
  badgeNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeNavIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeNavContent: {
    flex: 1,
  },
  badgeNavTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeNavDesc: {
    color: '#888',
    fontSize: 13,
  },
  menuContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderRadius: 12,
    padding: 16,
  },
  logoutText: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Subscription styles
  subscriptionSection: {
    marginBottom: 24,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  subscriptionCardPremium: {
    borderColor: 'rgba(255, 215, 0, 0.5)',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionTier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
  },
  subscriptionTierPremium: {
    color: '#FFD700',
  },
  scanLimitInfo: {
    marginBottom: 16,
  },
  scanLimitLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  scanLimitBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scanLimitFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  scanLimitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumFeatures: {
    marginBottom: 16,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumFeatureText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  subscriptionEndDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  subscriptionButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  subscriptionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  cancelButtonText: {
    color: '#ff4757',
  },
  // Pressed states for iPad compatibility
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Location status styles
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  locationStatusGranted: {
    backgroundColor: '#4CAF50',
  },
  locationStatusPartial: {
    backgroundColor: '#FFA500',
  },
  locationStatusDenied: {
    backgroundColor: '#888',
  },
  locationStatusText: {
    fontSize: 13,
    marginRight: 4,
  },
  locationStatusTextGranted: {
    color: '#4CAF50',
  },
  locationStatusTextWarning: {
    color: '#FFA500',
  },
});
