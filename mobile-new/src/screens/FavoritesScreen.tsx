import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const favoriteAttractions = [
  {
    id: '1',
    name: 'Eiffel Tower',
    location: 'Paris, France',
    rating: 4.8,
    visited: true,
  },
  {
    id: '2',
    name: 'Colosseum',
    location: 'Rome, Italy',
    rating: 4.9,
    visited: true,
  },
  {
    id: '3',
    name: 'Sagrada Familia',
    location: 'Barcelona, Spain',
    rating: 4.9,
    visited: false,
  },
  {
    id: '4',
    name: 'Santorini',
    location: 'Greece',
    rating: 4.8,
    visited: false,
  },
  {
    id: '5',
    name: 'Mount Fuji',
    location: 'Japan',
    rating: 4.7,
    visited: false,
  },
];

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Your saved attractions</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color="#e91e63" />
            <Text style={styles.statValue}>{favoriteAttractions.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>
              {favoriteAttractions.filter((a) => a.visited).length}
            </Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag" size={24} color="#FFD700" />
            <Text style={styles.statValue}>
              {favoriteAttractions.filter((a) => !a.visited).length}
            </Text>
            <Text style={styles.statLabel}>Bucket List</Text>
          </View>
        </View>

        {/* Favorites List */}
        <FlatList
          data={favoriteAttractions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.favoriteCard}>
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#666" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <TouchableOpacity>
                    <Ionicons name="heart" size={22} color="#e91e63" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardLocation}>{item.location}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                  {item.visited ? (
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
          )}
        />
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
