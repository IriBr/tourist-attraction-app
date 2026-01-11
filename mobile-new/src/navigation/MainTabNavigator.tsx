import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks';
import { HomeScreen } from './HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import {
  ProfileScreen,
  BadgesScreen,
  ProgressScreen,
  LeaderboardScreen,
  EditProfileScreen,
  NotificationsScreen,
  PrivacyScreen,
  HelpScreen,
  AboutScreen,
} from '../screens';
import { ProfileStackParamList } from './types';

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="BadgesScreen" component={BadgesScreen} />
      <ProfileStack.Screen name="ProgressScreen" component={ProgressScreen} />
      <ProfileStack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      <ProfileStack.Screen name="Help" component={HelpScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
    </ProfileStack.Navigator>
  );
}

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Camera: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isTablet, cameraButtonSize, horizontalPadding } = useResponsive();

  // Dynamic icon sizes
  const iconSize = isTablet ? 28 : 24;
  const cameraIconSize = isTablet ? 32 : 28;

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      <View style={[
        styles.tabBar,
        {
          marginHorizontal: horizontalPadding,
          ...(isTablet && {
            maxWidth: 500,
            alignSelf: 'center' as const,
            width: '50%',
          }),
        },
      ]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCamera = route.name === 'Camera';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') {
            iconName = isFocused ? 'globe' : 'globe-outline';
          } else if (route.name === 'Search') {
            iconName = isFocused ? 'search' : 'search-outline';
          } else if (route.name === 'Camera') {
            iconName = 'camera';
          } else if (route.name === 'Favorites') {
            iconName = isFocused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
          }

          if (isCamera) {
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.cameraButtonContainer, { marginTop: isTablet ? -36 : -30 }]}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.cameraButton,
                  {
                    width: cameraButtonSize,
                    height: cameraButtonSize,
                    borderRadius: cameraButtonSize / 2,
                  },
                ]}>
                  <Ionicons name="camera" size={cameraIconSize} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={iconSize}
                color={isFocused ? '#e91e63' : '#888'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    marginBottom: Platform.OS === 'ios' ? 0 : 16,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#e91e63',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(26, 26, 46, 0.95)',
  },
});
