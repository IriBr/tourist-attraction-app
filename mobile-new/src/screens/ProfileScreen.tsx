import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useBadgeStore, useStatsStore } from '../store';
import { locationsApi, visitsApi } from '../api';
import { colors } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, ProfileStackParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';

const menuItems = [
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
  const { user, logout } = useAuthStore();
  const {
    status,
    isPremium,
    scansRemaining,
    isLoading,
    fetchStatus,
    cancelSubscription,
  } = useSubscriptionStore();
  const { progress, fetchProgress } = useBadgeStore();
  const { userStats, globalStats, fetchStats } = useStatsStore();

  // Fetch stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      fetchProgress();
      fetchStats();
    }, [])
  );

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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
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
          <Text style={styles.sectionTitle}>Subscription</Text>
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

            <TouchableOpacity
              style={[styles.subscriptionButton, isPremium && styles.cancelButton]}
              onPress={isPremium ? handleCancelSubscription : handleUpgrade}
            >
              <Ionicons
                name={isPremium ? 'close-circle-outline' : 'star'}
                size={18}
                color={isPremium ? '#ff4757' : '#fff'}
              />
              <Text style={[styles.subscriptionButtonText, isPremium && styles.cancelButtonText]}>
                {isPremium ? 'Cancel Subscription' : 'Upgrade to Premium'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges & Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges & Progress</Text>
          <View style={styles.badgesContainer}>
            <TouchableOpacity
              style={styles.badgeNavCard}
              onPress={() => navigation.navigate('BadgesScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.badgeNavIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                <Ionicons name="ribbon" size={28} color="#FFD700" />
              </View>
              <View style={styles.badgeNavContent}>
                <Text style={styles.badgeNavTitle}>My Badges</Text>
                <Text style={styles.badgeNavDesc}>View your earned badges</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.badgeNavCard}
              onPress={() => navigation.navigate('ProgressScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.badgeNavIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="trending-up" size={28} color={colors.secondary} />
              </View>
              <View style={styles.badgeNavContent}>
                <Text style={styles.badgeNavTitle}>Progress</Text>
                <Text style={styles.badgeNavDesc}>Track your exploration</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color={colors.secondary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
});
