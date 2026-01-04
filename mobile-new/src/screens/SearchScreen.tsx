import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { attractionsApi, locationsApi } from '../api';
import { useVisitsStore } from '../store';
import type { AttractionSummary } from '../types';
import { colors } from '../theme';

interface SearchResult {
  id: string;
  name: string;
  type: 'continent' | 'country' | 'city' | 'attraction';
  subtitle?: string;
}

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularAttractions, setPopularAttractions] = useState<AttractionSummary[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const { visitedIds, fetchVisits } = useVisitsStore();

  useEffect(() => {
    loadPopularAttractions();
  }, []);

  // Fetch visits when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVisits();
    }, [fetchVisits])
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadPopularAttractions = async () => {
    try {
      setIsLoading(true);
      const data = await attractionsApi.getPopular(20);
      setPopularAttractions(data.items || data);
    } catch (error) {
      console.error('Failed to load popular attractions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);

      // Search locations (continents, countries, cities)
      const locationResults = await locationsApi.search(query);

      // Search attractions
      const attractionResults = await attractionsApi.search({ query, limit: 10 });

      const results: SearchResult[] = [
        ...locationResults.continents.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: 'continent' as const,
          subtitle: 'Continent',
        })),
        ...locationResults.countries.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: 'country' as const,
          subtitle: c.continentName,
        })),
        ...locationResults.cities.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: 'city' as const,
          subtitle: c.countryName,
        })),
        ...(attractionResults.items || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: 'attraction' as const,
          subtitle: `${a.location?.city}, ${a.location?.country}`,
        })),
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'attraction') {
      navigation.navigate('AttractionDetail', { id: result.id });
    }
    // TODO: Handle navigation to continent/country/city screens
  };

  const handleAttractionPress = (attraction: AttractionSummary) => {
    navigation.navigate('AttractionDetail', { id: attraction.id });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'continent': return 'globe-outline';
      case 'country': return 'flag-outline';
      case 'city': return 'business-outline';
      case 'attraction': return 'location-outline';
      default: return 'search-outline';
    }
  };

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover 730 attractions worldwide</Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search attractions, cities, countries..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && <ActivityIndicator size="small" color={colors.secondary} />}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleResultPress(item)}
                >
                  <Ionicons
                    name={getIconForType(item.type)}
                    size={20}
                    color={colors.secondary}
                  />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#888" />
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
            />
          </View>
        )}

        {/* Popular Attractions */}
        {searchQuery.length < 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Attractions</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={popularAttractions}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContainer}
                renderItem={({ item }) => {
                  const isVisited = visitedIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={styles.attractionCard}
                      onPress={() => handleAttractionPress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: item.thumbnailUrl }}
                          style={styles.attractionImage}
                          resizeMode="cover"
                        />
                        {isVisited && (
                          <View style={styles.visitedBadge}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.attractionInfo}>
                        <Text style={styles.attractionName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.attractionLocation} numberOfLines={1}>
                          {item.location?.city}, {item.location?.country}
                        </Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {item.averageRating?.toFixed(1) || 'N/A'}
                          </Text>
                          <Text style={styles.reviewCount}>
                            ({item.totalReviews || 0})
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  searchResultSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attractionCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  attractionImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  visitedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attractionInfo: {
    padding: 10,
  },
  attractionName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  attractionLocation: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewCount: {
    color: '#888',
    fontSize: 11,
    marginLeft: 4,
  },
});
