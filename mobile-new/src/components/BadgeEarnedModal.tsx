import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BadgeTier, LocationType, NewBadgeResult } from '../types';

const { width } = Dimensions.get('window');

const TIER_COLORS: Record<BadgeTier, { primary: string; secondary: string; glow: string }> = {
  bronze: { primary: '#CD7F32', secondary: '#8B4513', glow: 'rgba(205, 127, 50, 0.3)' },
  silver: { primary: '#C0C0C0', secondary: '#808080', glow: 'rgba(192, 192, 192, 0.3)' },
  gold: { primary: '#FFD700', secondary: '#DAA520', glow: 'rgba(255, 215, 0, 0.3)' },
  platinum: { primary: '#E5E4E2', secondary: '#B8B8B8', glow: 'rgba(229, 228, 226, 0.4)' },
};

const TIER_MESSAGES: Record<BadgeTier, string> = {
  bronze: 'Great start!',
  silver: 'Keep exploring!',
  gold: 'Almost there!',
  platinum: 'You did it!',
};

const LOCATION_ICONS: Record<LocationType, string> = {
  city: 'business',
  country: 'flag',
  continent: 'globe',
};

interface BadgeEarnedModalProps {
  visible: boolean;
  badges: NewBadgeResult[];
  onClose: () => void;
}

function BadgeDisplay({ badge }: { badge: NewBadgeResult['badge'] }) {
  const tierColors = TIER_COLORS[badge.tier as BadgeTier] || TIER_COLORS.bronze;
  const locationIcon = LOCATION_ICONS[badge.locationType as LocationType] || 'trophy';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.badgeDisplayContainer}>
      <Animated.View
        style={[
          styles.badgeGlow,
          {
            backgroundColor: tierColors.glow,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View style={[styles.badgeCircle, { borderColor: tierColors.primary }]}>
        <LinearGradient
          colors={[tierColors.primary, tierColors.secondary]}
          style={styles.badgeGradient}
        >
          {badge.locationImageUrl ? (
            <Image
              source={{ uri: badge.locationImageUrl }}
              style={styles.locationImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={locationIcon as any} size={40} color="#fff" />
          )}
        </LinearGradient>
      </View>
      <View style={[styles.tierRibbon, { backgroundColor: tierColors.primary }]}>
        <Text style={styles.tierRibbonText}>{badge.tier.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export function BadgeEarnedModal({ visible, badges, onClose }: BadgeEarnedModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const newBadges = badges.filter((b) => b.isNew);
  if (newBadges.length === 0) return null;

  const firstBadge = newBadges[0].badge;
  const tierColors = TIER_COLORS[firstBadge.tier as BadgeTier] || TIER_COLORS.bronze;
  const tierMessage = TIER_MESSAGES[firstBadge.tier as BadgeTier] || 'Congratulations!';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.modalContent}
          >
            {/* Confetti effect (simple dots) */}
            <View style={styles.confettiContainer}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.confettiDot,
                    {
                      backgroundColor: i % 3 === 0 ? tierColors.primary : i % 3 === 1 ? '#e91e63' : '#fff',
                      left: `${10 + (i * 7)}%`,
                      top: `${5 + ((i * 13) % 20)}%`,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="trophy" size={24} color={tierColors.primary} />
              <Text style={styles.congratsText}>Badge Earned!</Text>
            </View>

            {/* Badge Display */}
            <BadgeDisplay badge={firstBadge} />

            {/* Badge Info */}
            <Text style={styles.locationName}>{firstBadge.locationName}</Text>
            <Text style={styles.locationType}>
              {firstBadge.locationType.charAt(0).toUpperCase() + firstBadge.locationType.slice(1)} Badge
            </Text>

            {/* Progress Info */}
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {firstBadge.attractionsVisited}/{firstBadge.totalAttractions} attractions visited
              </Text>
              <Text style={[styles.percentText, { color: tierColors.primary }]}>
                {firstBadge.progressPercent}%
              </Text>
            </View>

            {/* Message */}
            <Text style={[styles.tierMessage, { color: tierColors.primary }]}>
              {tierMessage}
            </Text>

            {/* Additional badges note */}
            {newBadges.length > 1 && (
              <Text style={styles.moreBadgesText}>
                +{newBadges.length - 1} more badge{newBadges.length > 2 ? 's' : ''} earned!
              </Text>
            )}

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={['#e91e63', '#c2185b']}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Awesome!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 340,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  congratsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badgeGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  badgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: 'hidden',
  },
  badgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  locationImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  tierRibbon: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierRibbonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  locationType: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  percentText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  moreBadgesText: {
    fontSize: 14,
    color: '#e91e63',
    marginTop: 8,
  },
  closeButton: {
    marginTop: 24,
    width: '100%',
  },
  closeButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
