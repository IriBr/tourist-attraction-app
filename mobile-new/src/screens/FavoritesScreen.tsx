import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { favoritesApi } from '../api';
import { useVisitsStore } from '../store';
import type { FavoriteWithAttraction } from '../types';
import type { RootStackParamList } from '../navigation/types';

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [favorites, setFavorites] = useState<FavoriteWithAttraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { visitedIds, fetchVisits } = useVisitsStore();

  const fetchFavorites = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch favorites and visits in parallel
      const [favoritesData] = await Promise.all([
        favoritesApi.getAll({ limit: 100 }),
        fetchVisits(), // Use global visits store
      ]);

      setFavorites(favoritesData.items || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const handleRefresh = () => {
    fetchFavorites(true);
  };

  const handleRemoveFavorite = async (attractionId: string) => {
    try {
      await favoritesApi.remove(attractionId);
      setFavorites(prev => prev.filter(f => f.attraction.id !== attractionId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleAttractionPress = (attractionId: string) => {
    navigation.navigate('AttractionDetail', { id: attractionId });
  };

  const visitedCount = favorites.filter(f => visitedIds.has(f.attraction.id)).length;
  const bucketListCount = favorites.length - visitedCount;

  if (isLoading) {
    return (
      <LinearGradient colors={colors.gradientDark} style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Your saved attractions</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color={colors.secondary} />
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{visitedCount}</Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{bucketListCount}</Text>
            <Text style={styles.statLabel}>Bucket List</Text>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchFavorites()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!error && favorites.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Start exploring and save attractions you love!
            </Text>
          </View>
        )}

        {/* Favorites List */}
        {!error && favorites.length > 0 && (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.secondary}
              />
            }
            renderItem={({ item }) => {
              const attraction = item.attraction;
              const isVisited = visitedIds.has(attraction.id);

              return (
                <TouchableOpacity
                  style={styles.favoriteCard}
                  onPress={() => handleAttractionPress(attraction.id)}
                >
                  {attraction.thumbnailUrl ? (
                    <Image
                      source={{ uri: attraction.thumbnailUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#666" />
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardName} numberOfLines={1}>{attraction.name}</Text>
                      <TouchableOpacity onPress={() => handleRemoveFavorite(attraction.id)}>
                        <Ionicons name="heart" size={22} color={colors.secondary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {attraction.location?.city}{attraction.location?.country ? `, ${attraction.location.country}` : ''}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {attraction.averageRating?.toFixed(1) || 'N/A'}
                        </Text>
                      </View>
                      {isVisited ? (
                        <View style={styles.visitedBadge}>
                          <Ionicons name="checkmark" size={12} color="#4CAF50" />
                          <Text style={styles.visitedText}>Visited</Text>
                        </View>
                      ) : (
                        <View style={styles.bucketBadge}>
                          <Ionicons name="flag" size={12} color="#FFD700" />
                          <Text style={styles.bucketText}>Bucket List</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
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
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContent: {
    paddingBottom: 120,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  cardLocation: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '600',
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitedText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  bucketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bucketText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});
