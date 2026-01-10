import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { PremiumScreen, AttractionDetailScreen } from '../screens';
import { OnboardingScreen, isOnboardingComplete } from '../screens/OnboardingScreen';
import {
  startProximityTracking,
  setupNotificationHandler,
} from '../services/proximityNotifications';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation ref for navigating from notification handler
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { fetchStatus } = useSubscriptionStore();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
    checkOnboarding();
  }, []);

  // Fetch subscription status and set up tracking when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch subscription status immediately when authenticated
    fetchStatus().catch(console.error);

    // Start background location tracking
    startProximityTracking().catch(console.error);

    // Handle notification taps - navigate to Camera tab
    const cleanup = setupNotificationHandler((attractionId) => {
      // Navigate to Camera tab
      if (navigationRef.current) {
        navigationRef.current.navigate('Main', { screen: 'Camera' });
      }
    });

    return cleanup;
  }, [isAuthenticated]);

  const checkOnboarding = async () => {
    const complete = await isOnboardingComplete();
    setShowOnboarding(!complete);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="AttractionDetail"
              component={AttractionDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
