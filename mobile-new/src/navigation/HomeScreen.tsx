import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WorldMap } from '../components';
import { useAuthStore } from '../store/authStore';
import { attractionsApi } from '../api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

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
      colors={['#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    color: '#888',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e91e63',
  },
  mapContainer: {
    flex: 1,
    marginBottom: 80,
  },
});
