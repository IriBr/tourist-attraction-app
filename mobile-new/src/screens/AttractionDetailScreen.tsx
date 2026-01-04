import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { attractionsApi, favoritesApi, visitsApi, NewBadgeInfo } from '../api';
import { useStatsStore } from '../store';
import { BadgeAwardModal } from '../components/BadgeAwardModal';
import type { Attraction } from '../types';

const { width } = Dimensions.get('window');

export function AttractionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params;

  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadAttraction();
  }, [id]);

  const loadAttraction = async () => {
    try {
      setIsLoading(true);
      const data = await attractionsApi.getById(id);
      setAttraction(data);
      setIsFavorite(data.isFavorited || false);
      setIsVisited(data.isVisited || false);
    } catch (error) {
      console.error('Failed to load attraction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!attraction) return;
    try {
      if (isFavorite) {
        await favoritesApi.remove(attraction.id);
      } else {
        await favoritesApi.add(attraction.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadges, setNewBadges] = useState<NewBadgeInfo[]>([]);
  const { refreshStats } = useStatsStore();

  const handleMarkVisited = async () => {
    if (!attraction || isVisited || isMarkingVisited) return;
    try {
      setIsMarkingVisited(true);
      const response = await visitsApi.markVisited({ attractionId: attraction.id });
      setIsVisited(true);
      // Refresh global stats immediately
      refreshStats();

      // Check for newly earned badges
      const earnedBadges = response.newBadges
        ?.filter((b) => b.isNew)
        .map((b) => b.badge) || [];

      if (earnedBadges.length > 0) {
        // Show badge animation modal
        setNewBadges(earnedBadges);
        setShowBadgeModal(true);
      } else {
        // Just show simple success alert
        Alert.alert('Success!', `You've marked ${attraction.name} as visited!`);
      }
    } catch (error: any) {
      console.error('Failed to mark visited:', error);
      if (error?.response?.status === 409) {
        // Already visited
        setIsVisited(true);
        Alert.alert('Already Visited', 'You have already visited this attraction.');
      } else {
        Alert.alert('Error', 'Failed to mark as visited. Please try again.');
      }
    } finally {
      setIsMarkingVisited(false);
    }
  };

  const handleOpenWebsite = () => {
    if (attraction?.website) {
      Linking.openURL(attraction.website);
    }
  };

  const handleOpenMaps = () => {
    if (attraction) {
      const url = `https://maps.google.com/?q=${attraction.latitude},${attraction.longitude}`;
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.container}>
        <ActivityIndicator size="large" color="#e91e63" style={{ flex: 1 }} />
      </LinearGradient>
    );
  }

  if (!attraction) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.container}>
        <Text style={styles.errorText}>Attraction not found</Text>
      </LinearGradient>
    );
  }

  const images = attraction.images?.length > 0 ? attraction.images : [attraction.thumbnailUrl];

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, { top: insets.top + 10 }]}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#e91e63' : '#fff'}
            />
          </TouchableOpacity>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{attraction.category}</Text>
            </View>
            <Text style={styles.title}>{attraction.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#888" />
              <Text style={styles.location}>
                {attraction.city?.name}, {attraction.city?.country?.name}
              </Text>
            </View>
          </View>

          {/* Rating & Reviews */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.ratingValue}>
                {attraction.averageRating?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.ratingCount}>
                ({attraction.totalReviews || 0} reviews)
              </Text>
            </View>
            {isVisited && (
              <View style={styles.visitedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.visitedText}>Visited</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{attraction.description}</Text>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.addressCard}>
              <Ionicons name="map-outline" size={24} color="#e91e63" />
              <Text style={styles.addressText}>{attraction.address}</Text>
            </View>
          </View>

          {/* Contact */}
          {(attraction.website || attraction.contactPhone) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {attraction.website && (
                <TouchableOpacity style={styles.contactRow} onPress={handleOpenWebsite}>
                  <Ionicons name="globe-outline" size={20} color="#e91e63" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {attraction.website}
                  </Text>
                </TouchableOpacity>
              )}
              {attraction.contactPhone && (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={20} color="#e91e63" />
                  <Text style={styles.contactText}>{attraction.contactPhone}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pricing */}
          {(attraction.isFree || attraction.adultPrice) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admission</Text>
              <View style={styles.priceCard}>
                {attraction.isFree ? (
                  <Text style={styles.freeText}>Free Entry</Text>
                ) : (
                  <>
                    <Text style={styles.priceLabel}>Adult</Text>
                    <Text style={styles.priceValue}>
                      {attraction.currency || '$'}{attraction.adultPrice}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isVisited && (
              <TouchableOpacity
                style={[styles.visitButton, isMarkingVisited && styles.visitButtonDisabled]}
                onPress={handleMarkVisited}
                disabled={isMarkingVisited}
              >
                {isMarkingVisited ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                )}
                <Text style={styles.visitButtonText}>
                  {isMarkingVisited ? 'Marking...' : 'Mark as Visited'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.directionsButton} onPress={handleOpenMaps}>
              <Ionicons name="navigate-outline" size={22} color="#e91e63" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Badge Award Modal */}
      <BadgeAwardModal
        visible={showBadgeModal}
        badges={newBadges}
        onClose={() => setShowBadgeModal(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    color: '#e91e63',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#888',
    fontSize: 14,
    marginLeft: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  ratingCount: {
    color: '#888',
    fontSize: 14,
    marginLeft: 8,
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  visitedText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
  },
  addressText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  contactText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
  },
  freeText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  priceLabel: {
    color: '#888',
    fontSize: 14,
  },
  priceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    borderRadius: 12,
  },
  visitButtonDisabled: {
    opacity: 0.7,
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e91e63',
  },
  directionsButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
