import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WorldMap } from '../components';
import { useAuthStore } from '../store/authStore';
import { attractionsApi } from '../api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { colors } from '../theme';

export function HomeScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  const handleContinentSelect = (continent: string) => {
    setSelectedContinent(continent);
  };

  const handleAttractionPress = async (attractionName: string, cityName: string) => {
    try {
      // Search for the attraction by name
      const results = await attractionsApi.search({ query: attractionName, limit: 5 });
      const attractions = results.items || [];

      // Find the best match (same name and city)
      const match = attractions.find(
        (a) => a.name.toLowerCase().includes(attractionName.toLowerCase().substring(0, 10)) ||
               attractionName.toLowerCase().includes(a.name.toLowerCase().substring(0, 10))
      );

      if (match) {
        navigation.navigate('AttractionDetail', { id: match.id });
      } else if (attractions.length > 0) {
        // If no exact match, use the first result
        navigation.navigate('AttractionDetail', { id: attractions[0].id });
      } else {
        Alert.alert('Not Found', `${attractionName} not found in database`);
      }
    } catch (error) {
      console.error('Error searching for attraction:', error);
      Alert.alert('Error', 'Failed to load attraction details');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Explorer';

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      {/* Header with centered logo */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Wandr</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* World Map Section - Full Screen */}
      <View style={styles.mapContainer}>
        <WorldMap onContinentSelect={handleContinentSelect} onAttractionPress={handleAttractionPress} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: '#888',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mapContainer: {
    flex: 1,
    marginBottom: 80,
  },
});
