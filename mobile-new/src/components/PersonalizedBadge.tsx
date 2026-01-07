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

// Tier colors designed for authentic engraved metal look
const TIER_COLORS: Record<string, {
  // Outer ring gradient
  ringLight: string;
  ringDark: string;
  ringMid: string;
  // Inner engraved area
  baseColor: string;      // Main metal color
  highlightColor: string; // Light reflection (top-left)
  shadowColor: string;    // Deep shadow (bottom-right)
  midtone: string;        // Mid-tone for depth
  // Glow effect
  glow: string;
}> = {
  bronze: {
    ringLight: '#D4943A',
    ringMid: '#CD7F32',
    ringDark: '#8B5A2B',
    baseColor: '#B87333',
    highlightColor: '#E8C4A0',
    shadowColor: '#5C3A21',
    midtone: '#A0522D',
    glow: 'rgba(205, 127, 50, 0.4)',
  },
  silver: {
    ringLight: '#E8E8E8',
    ringMid: '#C0C0C0',
    ringDark: '#808080',
    baseColor: '#A8A8A8',
    highlightColor: '#F5F5F5',
    shadowColor: '#4A4A4A',
    midtone: '#909090',
    glow: 'rgba(192, 192, 192, 0.4)',
  },
  gold: {
    ringLight: '#FFE55C',
    ringMid: '#FFD700',
    ringDark: '#B8860B',
    baseColor: '#DAA520',
    highlightColor: '#FFF8DC',
    shadowColor: '#8B6914',
    midtone: '#CD9B1D',
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  platinum: {
    ringLight: '#F5F5F5',
    ringMid: '#E5E4E2',
    ringDark: '#A9A9A9',
    baseColor: '#D3D3D3',
    highlightColor: '#FFFFFF',
    shadowColor: '#696969',
    midtone: '#BEBEBE',
    glow: 'rgba(229, 228, 226, 0.5)',
  },
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
  const ringWidth = sizeConfig.border + 2;
  const innerSize = badgeSize - ringWidth * 2;
  const engravedDepth = Math.max(2, ringWidth / 2);

  return (
    <View style={[styles.container, { opacity: earned ? 1 : 0.5 }]}>
      {/* Subtle glow behind badge */}
      {earned && (
        <View
          style={[
            styles.glow,
            {
              width: badgeSize + 16,
              height: badgeSize + 16,
              borderRadius: (badgeSize + 16) / 2,
              backgroundColor: tierColors.glow,
            },
          ]}
        />
      )}

      {/* Outer metallic ring with beveled edge effect */}
      <LinearGradient
        colors={[tierColors.ringLight, tierColors.ringMid, tierColors.ringDark]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.outerRing,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
        ]}
      >
        {/* Highlight edge (top-left light reflection) */}
        <View
          style={[
            styles.ringHighlight,
            {
              width: badgeSize - 2,
              height: badgeSize - 2,
              borderRadius: (badgeSize - 2) / 2,
              borderColor: tierColors.highlightColor,
            },
          ]}
        />

        {/* Inner recessed area - creates the "pressed in" look */}
        <View
          style={[
            styles.recessedArea,
            {
              width: innerSize + engravedDepth * 2,
              height: innerSize + engravedDepth * 2,
              borderRadius: (innerSize + engravedDepth * 2) / 2,
              backgroundColor: tierColors.shadowColor,
            },
          ]}
        >
          {/* Inner highlight edge (bottom of recess catches light) */}
          <LinearGradient
            colors={['transparent', tierColors.highlightColor + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.recessHighlight,
              {
                width: innerSize + engravedDepth * 2,
                height: innerSize + engravedDepth * 2,
                borderRadius: (innerSize + engravedDepth * 2) / 2,
              },
            ]}
          />

          {/* Engraved content area */}
          <View
            style={[
              styles.engravedContent,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
                backgroundColor: tierColors.baseColor,
              },
            ]}
          >
            {imageUrl ? (
              <View style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2, overflow: 'hidden' }}>
                {/* Base image */}
                <Image
                  source={{ uri: imageUrl }}
                  style={[
                    styles.image,
                    {
                      width: innerSize,
                      height: innerSize,
                    },
                  ]}
                  resizeMode="cover"
                />

                {/* Monochrome overlay - converts to metal-tinted grayscale */}
                <View
                  style={[
                    styles.monochromeOverlay,
                    {
                      width: innerSize,
                      height: innerSize,
                      backgroundColor: tierColors.baseColor,
                    },
                  ]}
                />

                {/* Metallic sheen gradient (diagonal light reflection) */}
                <LinearGradient
                  colors={[
                    tierColors.highlightColor + '60',
                    'transparent',
                    tierColors.shadowColor + '50',
                  ]}
                  locations={[0, 0.4, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.metallicSheen,
                    {
                      width: innerSize,
                      height: innerSize,
                    },
                  ]}
                />

                {/* Embossed inner edge (pressed-in effect) */}
                <View
                  style={[
                    styles.embossedEdge,
                    {
                      width: innerSize,
                      height: innerSize,
                      borderRadius: innerSize / 2,
                      borderTopColor: tierColors.shadowColor + '80',
                      borderLeftColor: tierColors.shadowColor + '60',
                      borderBottomColor: tierColors.highlightColor + '50',
                      borderRightColor: tierColors.highlightColor + '30',
                    },
                  ]}
                />
              </View>
            ) : (
              <View style={[styles.placeholderInner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
                {/* Metallic gradient for placeholder */}
                <LinearGradient
                  colors={[tierColors.highlightColor, tierColors.baseColor, tierColors.midtone]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.placeholderGradient, { borderRadius: innerSize / 2 }]}
                >
                  <Ionicons
                    name={locationIcon}
                    size={sizeConfig.icon}
                    color={tierColors.shadowColor}
                    style={styles.placeholderIcon}
                  />
                </LinearGradient>
                {/* Embossed edge for placeholder */}
                <View
                  style={[
                    styles.embossedEdge,
                    {
                      width: innerSize,
                      height: innerSize,
                      borderRadius: innerSize / 2,
                      borderTopColor: tierColors.shadowColor + '60',
                      borderLeftColor: tierColors.shadowColor + '40',
                      borderBottomColor: tierColors.highlightColor + '60',
                      borderRightColor: tierColors.highlightColor + '40',
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Tier label ribbon */}
      <LinearGradient
        colors={[tierColors.ringLight, tierColors.ringMid, tierColors.ringDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.tierRibbon]}
      >
        <Text style={[styles.tierText, { fontSize: sizeConfig.fontSize - 2, color: tierColors.shadowColor }]}>
          {TIER_LABELS[tierKey] || 'BADGE'}
        </Text>
      </LinearGradient>

      {/* Location name */}
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
    top: -8,
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  ringHighlight: {
    position: 'absolute',
    borderWidth: 1,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  recessedArea: {
    alignItems: 'center',
    justifyContent: 'center',
    // Dark shadow to create depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  recessHighlight: {
    position: 'absolute',
  },
  engravedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    // Image sits as base layer
  },
  monochromeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7, // Blend with image to create metal-tinted monochrome
  },
  metallicSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  embossedEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
  },
  placeholderInner: {
    overflow: 'hidden',
  },
  placeholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    // Icon shadow for embossed look
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  tierRibbon: {
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  tierText: {
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
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
