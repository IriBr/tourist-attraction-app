import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../theme';
import type { NewBadgeInfo } from '../api';

const { width, height } = Dimensions.get('window');

interface BadgeAwardModalProps {
  visible: boolean;
  badges: NewBadgeInfo[];
  onClose: () => void;
}

const TIER_CONFIG = {
  bronze: {
    color: colors.badgeBronze,
    gradient: ['#CD7F32', '#8B4513'] as const,
    icon: 'medal-outline',
    label: 'Bronze',
  },
  silver: {
    color: colors.badgeSilver,
    gradient: ['#E8E8E8', '#A8A8A8'] as const,
    icon: 'medal-outline',
    label: 'Silver',
  },
  gold: {
    color: colors.badgeGold,
    gradient: ['#FFD700', '#FFA500'] as const,
    icon: 'medal',
    label: 'Gold',
  },
  platinum: {
    color: colors.badgePlatinum,
    gradient: ['#E5E4E2', '#BCC6CC'] as const,
    icon: 'trophy',
    label: 'Platinum',
  },
};

const LOCATION_TYPE_LABELS = {
  city: 'City Explorer',
  country: 'Country Explorer',
  continent: 'Continental Champion',
};

export function BadgeAwardModal({ visible, badges, onClose }: BadgeAwardModalProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeRotation = useRef(new Animated.Value(0)).current;
  const shimmerPosition = useRef(new Animated.Value(-1)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const confettiParticles = useRef(
    Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
        Math.floor(Math.random() * 6)
      ],
    }))
  ).current;

  const currentBadge = badges[currentBadgeIndex];

  useEffect(() => {
    if (visible && badges.length > 0) {
      setCurrentBadgeIndex(0);
      playEntranceAnimation();
    } else {
      resetAnimations();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && currentBadgeIndex > 0) {
      playBadgeTransition();
    }
  }, [currentBadgeIndex]);

  const resetAnimations = () => {
    backdropOpacity.setValue(0);
    cardScale.setValue(0.3);
    cardOpacity.setValue(0);
    badgeScale.setValue(0);
    badgeRotation.setValue(0);
    shimmerPosition.setValue(-1);
    confettiOpacity.setValue(0);
    textOpacity.setValue(0);
    buttonOpacity.setValue(0);
  };

  const playEntranceAnimation = () => {
    resetAnimations();

    // Sequence of animations
    Animated.sequence([
      // Backdrop fade in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Card entrance
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Badge entrance with bounce and rotation
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(badgeRotation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Button fade in
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start confetti
    Animated.timing(confettiOpacity, {
      toValue: 1,
      duration: 200,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Animate confetti particles
    confettiParticles.forEach((particle, i) => {
      particle.y.setValue(-50);
      particle.rotation.setValue(0);

      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: height + 50,
          duration: 2000 + Math.random() * 1000,
          delay: i * 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 4 - 2,
          duration: 2000 + Math.random() * 1000,
          delay: i * 50,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerPosition, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const playBadgeTransition = () => {
    badgeScale.setValue(0);
    badgeRotation.setValue(0);
    textOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(badgeRotation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible || badges.length === 0) return null;

  const tierConfig = TIER_CONFIG[currentBadge.tier];
  const rotateInterpolation = badgeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />

        {/* Confetti */}
        <Animated.View style={[styles.confettiContainer, { opacity: confettiOpacity }]}>
          {confettiParticles.map((particle, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: particle.color,
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    {
                      rotate: particle.rotation.interpolate({
                        inputRange: [-2, 2],
                        outputRange: ['-180deg', '180deg'],
                      }),
                    },
                    { scale: particle.scale },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Main Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.card}
          >
            {/* Badge */}
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  transform: [
                    { scale: badgeScale },
                    { rotate: rotateInterpolation },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={tierConfig.gradient}
                style={styles.badgeOuter}
              >
                <View style={styles.badgeInner}>
                  <Ionicons
                    name={tierConfig.icon as any}
                    size={48}
                    color={tierConfig.color}
                  />
                </View>
              </LinearGradient>

              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [
                      {
                        translateX: shimmerPosition.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-150, 150],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </Animated.View>

            {/* Congratulations text */}
            <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
              <Text style={styles.congratsText}>Congratulations!</Text>
              <Text style={styles.badgeTitle}>
                {tierConfig.label} Badge Earned
              </Text>
              <View style={styles.locationContainer}>
                <Ionicons
                  name={
                    currentBadge.locationType === 'city'
                      ? 'location'
                      : currentBadge.locationType === 'country'
                      ? 'flag'
                      : 'globe'
                  }
                  size={18}
                  color={colors.secondary}
                />
                <Text style={styles.locationText}>{currentBadge.locationName}</Text>
              </View>
              <Text style={styles.achievementText}>
                {LOCATION_TYPE_LABELS[currentBadge.locationType]}
              </Text>
            </Animated.View>

            {/* Progress indicator for multiple badges */}
            {badges.length > 1 && (
              <View style={styles.progressDots}>
                {badges.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentBadgeIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Button */}
            <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradientSecondary}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {currentBadgeIndex < badges.length - 1 ? 'Next Badge' : 'Awesome!'}
                  </Text>
                  {currentBadgeIndex < badges.length - 1 && (
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  cardContainer: {
    width: width * 0.85,
    maxWidth: 340,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    overflow: 'hidden',
    borderRadius: 60,
  },
  badgeOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '25deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.secondary,
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
