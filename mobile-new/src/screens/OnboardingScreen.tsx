import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = '@wandr_onboarding_complete';

interface OnboardingSlide {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  gradientColors: readonly [string, string, string];
  accentColor: string;
  decorativeIcons: (keyof typeof Ionicons.glyphMap)[];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'earth',
    title: 'Explore the World',
    subtitle: 'Your adventure starts here',
    description: 'Discover thousands of breathtaking attractions across the globe. From iconic landmarks to hidden gems waiting to be explored.',
    gradientColors: ['#667eea', '#764ba2', '#f093fb'] as const,
    accentColor: '#667eea',
    decorativeIcons: ['location', 'map', 'navigate', 'compass'],
  },
  {
    id: 2,
    icon: 'camera',
    title: 'Capture Moments',
    subtitle: 'Verify your visits',
    description: 'Snap photos at attractions to verify your visits. Build your personal travel journal and share your adventures.',
    gradientColors: ['#f093fb', '#f5576c', '#ff9a9e'] as const,
    accentColor: '#f5576c',
    decorativeIcons: ['image', 'heart', 'star', 'bookmark'],
  },
  {
    id: 3,
    icon: 'trophy',
    title: 'Earn Rewards',
    subtitle: 'Collect badges & achievements',
    description: 'Unlock bronze, silver, gold, and platinum badges as you explore. Track your progress and become a legendary traveler!',
    gradientColors: ['#f6d365', '#fda085', '#ff9a9e'] as const,
    accentColor: '#fda085',
    decorativeIcons: ['medal', 'ribbon', 'shield', 'flag'],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex !== currentIndex) {
      setCurrentIndex(slideIndex);
    }
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={currentSlide.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.circle, styles.circle1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={[styles.circle, styles.circle3, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      </View>

      {/* Floating Icons */}
      <View style={styles.floatingIconsContainer}>
        {currentSlide.decorativeIcons.map((iconName, index) => (
          <View
            key={iconName}
            style={[
              styles.floatingIcon,
              {
                top: 100 + (index * 120),
                left: index % 2 === 0 ? 20 : width - 60,
                opacity: 0.15,
              },
            ]}
          >
            <Ionicons name={iconName} size={40} color="#fff" />
          </View>
        ))}
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]}
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Icon with glow effect */}
            <View style={styles.iconWrapper}>
              <View style={[styles.iconGlow, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={[styles.iconGlowInner, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.iconContainer}>
                <Ionicons name={slide.icon} size={70} color="#fff" />
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={goToNext}
          activeOpacity={0.9}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? "Let's Go!" : 'Continue'}
            </Text>
            <View style={styles.buttonIconContainer}>
              <Ionicons
                name={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-forward'}
                size={20}
                color={currentSlide.accentColor}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Page indicator text */}
        <Text style={styles.pageIndicator}>
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </View>
  );
}

// Helper function to check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check onboarding state:', error);
    return false;
  }
}

// Helper function to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    right: -30,
  },
  floatingIconsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingIcon: {
    position: 'absolute',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  iconGlowInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingHorizontal: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 24,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  buttonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 16,
    fontWeight: '500',
  },
});
