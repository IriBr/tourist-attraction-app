import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ProfileStackParamList } from './types';
import { BadgesScreen, ProgressScreen } from '../screens';
import { AppHeader } from '../components';
import { useAuthStore, useBadgeStore } from '../store';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  accentColor?: string;
  badge?: number;
}

function MenuItem({ icon, label, sublabel, onPress, accentColor = '#e91e63', badge }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[`${accentColor}25`, `${accentColor}10`]}
        style={styles.menuIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={22} color={accentColor} />
      </LinearGradient>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuText}>{label}</Text>
        {sublabel && <Text style={styles.menuSubtext}>{sublabel}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.menuBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.statIconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </LinearGradient>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { summary } = useBadgeStore();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader showLogo />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(233, 30, 99, 0.15)', 'rgba(233, 30, 99, 0.05)']}
            style={styles.profileCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#e91e63', '#c2185b']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {(user?.name || 'T').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Traveler'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.memberBadge}>
              <Ionicons name="diamond" size={12} color="#FFD700" />
              <Text style={styles.memberBadgeText}>Explorer Member</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="medal"
            value={summary?.totalBadges || 0}
            label="Badges"
            color="#FFD700"
          />
          <StatCard
            icon="location"
            value={summary?.badgesByType?.city || 0}
            label="Cities"
            color="#e91e63"
          />
          <StatCard
            icon="flag"
            value={summary?.badgesByType?.country || 0}
            label="Countries"
            color="#00BCD4"
          />
          <StatCard
            icon="globe"
            value={summary?.badgesByType?.continent || 0}
            label="Continents"
            color="#4CAF50"
          />
        </View>

        {/* Achievement Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('BadgesScreen')}
          >
            <Text style={styles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="medal-outline"
            label="My Badges"
            sublabel="Track your earned achievements"
            onPress={() => (navigation as any).navigate('BadgesScreen')}
            accentColor="#FFD700"
            badge={summary?.totalBadges}
          />
          <MenuItem
            icon="trending-up"
            label="My Progress"
            sublabel="See how close you are to new badges"
            onPress={() => (navigation as any).navigate('ProgressScreen')}
            accentColor="#4CAF50"
          />
        </View>

        {/* Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity</Text>
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="map-outline"
            label="My Visits"
            sublabel="Places you've explored"
            onPress={() => {}}
            accentColor="#e91e63"
          />
          <MenuItem
            icon="heart-outline"
            label="Favorites"
            sublabel="Saved attractions"
            onPress={() => {}}
            accentColor="#FF5722"
          />
          <MenuItem
            icon="chatbubble-outline"
            label="My Reviews"
            sublabel="Your shared experiences"
            onPress={() => {}}
            accentColor="#9C27B0"
          />
        </View>

        {/* Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => {}}
            accentColor="#2196F3"
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
            accentColor="#FF9800"
          />
          <MenuItem
            icon="settings-outline"
            label="Preferences"
            onPress={() => {}}
            accentColor="#607D8B"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#e91e63" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Wanderlust v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="BadgesScreen" component={BadgesScreen} />
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} />
    </Stack.Navigator>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  profileCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  sectionAction: {
    fontSize: 14,
    color: '#e91e63',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  menuSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  menuBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e91e63',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 20,
    marginBottom: 10,
  },
});
