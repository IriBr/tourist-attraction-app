import React, { useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from './src/store';
import { ProfileStackNavigator } from './src/navigation';
import { colors, BRAND } from './src/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

function SplashScreen() {
  return (
    <LinearGradient
      colors={colors.gradientHero}
      style={styles.splashContainer}
    >
      <Image
        source={require('./assets/images/icon.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
      <Text style={styles.splashTitle}>{BRAND.name}</Text>
      <Text style={styles.splashTagline}>{BRAND.tagline}</Text>
      <ActivityIndicator size="large" color={colors.secondary} style={styles.splashLoader} />
    </LinearGradient>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <SplashScreen />;
  }

  // For now, show ProfileStackNavigator directly for testing badges
  // TODO: Add proper auth flow with login/register screens
  return <ProfileStackNavigator />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  splashLoader: {
    marginTop: 24,
  },
});
