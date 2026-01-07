import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../theme';
import { BadgeTier, LocationType } from '../types';

interface PersonalizedBadgeProps {
  imageUrl: string | null | undefined;
  tier: BadgeTier | string;
  locationType: LocationType | string;
  locationName: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  earned?: boolean;
}

const TIER_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  bronze: { primary: '#CD7F32', secondary: '#8B4513', glow: 'rgba(205, 127, 50, 0.5)' },
  silver: { primary: '#C0C0C0', secondary: '#808080', glow: 'rgba(192, 192, 192, 0.5)' },
  gold: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.6)' },
  platinum: { primary: '#E5E4E2', secondary: '#BCC6CC', glow: 'rgba(229, 228, 226, 0.7)' },
};

const SIZE_CONFIG = {
  small: { badge: 50, border: 3, icon: 16, fontSize: 10 },
  medium: { badge: 80, border: 4, icon: 24, fontSize: 12 },
  large: { badge: 120, border: 6, icon: 36, fontSize: 14 },
};

const LOCATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  city: 'business',
  country: 'flag',
  continent: 'globe',
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
  platinum: 'PLATINUM',
};

export const PersonalizedBadge: React.FC<PersonalizedBadgeProps> = ({
  imageUrl,
  tier,
  locationType,
  locationName,
  size = 'medium',
  showLabel = true,
  earned = true,
}) => {
  const tierKey = tier.toLowerCase();
  const tierColors = TIER_COLORS[tierKey] || TIER_COLORS.bronze;
  const sizeConfig = SIZE_CONFIG[size];
  const locationIcon = LOCATION_ICONS[locationType] || 'location';

  const badgeSize = sizeConfig.badge;
  const borderWidth = sizeConfig.border;
  const innerSize = badgeSize - borderWidth * 2;

  return (
    <View style={[styles.container, { opacity: earned ? 1 : 0.5 }]}>
      {/* Glow effect */}
      {earned && (
        <View
          style={[
            styles.glow,
            {
              width: badgeSize + 20,
              height: badgeSize + 20,
              borderRadius: (badgeSize + 20) / 2,
              backgroundColor: tierColors.glow,
            },
          ]}
        />
      )}

      {/* Badge border ring */}
      <LinearGradient
        colors={[tierColors.primary, tierColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badgeRing,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
        ]}
      >
        {/* Inner content area */}
        <View
          style={[
            styles.innerContainer,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
                !earned && styles.imageGrayscale,
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
              ]}
            >
              <Ionicons
                name={locationIcon}
                size={sizeConfig.icon}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Tier ribbon */}
      <View style={[styles.tierRibbon, { backgroundColor: tierColors.primary }]}>
        <Text style={[styles.tierText, { fontSize: sizeConfig.fontSize - 2 }]}>
          {TIER_LABELS[tierKey] || 'BADGE'}
        </Text>
      </View>

      {/* Location name label */}
      {showLabel && (
        <Text
          style={[styles.locationName, { fontSize: sizeConfig.fontSize }]}
          numberOfLines={2}
        >
          {locationName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -10,
  },
  badgeRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  innerContainer: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: colors.backgroundSecondary,
  },
  imageGrayscale: {
    opacity: 0.6,
  },
  placeholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRibbon: {
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  tierText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationName: {
    marginTop: spacing.xs,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 100,
  },
});

export default PersonalizedBadge;
