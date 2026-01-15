import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { PremiumScreen, AttractionDetailScreen, EmailVerificationScreen } from '../screens';
import { OnboardingScreen, isOnboardingComplete } from '../screens/OnboardingScreen';
import {
  startProximityTracking,
  setupNotificationHandler,
  checkPermissions,
} from '../services/proximityNotifications';
import {
  registerForPushNotifications,
  setupPushNotificationHandler,
} from '../services/pushNotifications';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation ref for navigating from notification handler
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Queue for pending navigation actions (when notification is tapped before navigation is ready)
let pendingNavigation: (() => void) | null = null;

// Set up notification handlers immediately at module load (before auth)
// This ensures we catch notification taps even if the app was cold-started from a notification
const proximityCleanup = setupNotificationHandler((attractionId, attractionName) => {
  const navigate = () => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate('Main', {
        screen: 'Camera',
        params: attractionName ? { attractionName } : undefined,
      });
    }
  };

  // If navigation is ready, navigate immediately; otherwise queue it
  if (navigationRef.current?.isReady()) {
    navigate();
  } else {
    pendingNavigation = navigate;
  }
});

// Also try to start proximity tracking early if permissions are already granted
// This helps resume tracking after app restart without waiting for auth UI
checkPermissions().then((hasPermissions) => {
  if (hasPermissions) {
    startProximityTracking().catch(console.error);
  }
});

export function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const { fetchStatus } = useSubscriptionStore();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
    checkOnboarding();
  }, []);

  // Check if email verification is needed
  const needsEmailVerification = isAuthenticated && user && !user.emailVerified;

  // Fetch subscription status and set up tracking when authenticated and verified
  useEffect(() => {
    if (!isAuthenticated || needsEmailVerification) return;

    // Fetch subscription status immediately when authenticated
    fetchStatus().catch(console.error);

    // Register for push notifications
    registerForPushNotifications().catch(console.error);

    // Start background location tracking (may already be started at module load if permissions were granted)
    startProximityTracking().catch(console.error);

    // Note: Proximity notification handler is now set up at module load (before auth)
    // to ensure we catch notification taps even on cold start

    // Handle push notification responses
    const cleanupPush = setupPushNotificationHandler(
      undefined, // onNotificationReceived - handled by Expo's handler
      (response) => {
        // Handle tap on push notification
        const data = response.notification.request.content.data;
        if (data?.screen && navigationRef.current) {
          // Navigate to specified screen if provided in notification data
          // @ts-ignore - dynamic screen navigation from push notification
          navigationRef.current.navigate(data.screen);
        }
      }
    );

    // Re-register push token when app comes to foreground
    // This ensures existing users get registered and handles token refresh
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        registerForPushNotifications().catch(console.error);
      }
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cleanupPush();
      appStateSubscription.remove();
    };
  }, [isAuthenticated, needsEmailVerification]);

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

  // Handle pending navigation from notification taps that occurred before navigation was ready
  const handleNavigationReady = () => {
    if (pendingNavigation) {
      pendingNavigation();
      pendingNavigation = null;
    }
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          needsEmailVerification ? (
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          ) : (
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
          )
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
