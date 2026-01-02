import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, BRAND } from '../theme';

interface AppHeaderProps {
  showBack?: boolean;
  showLogo?: boolean;
  title?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  transparent?: boolean;
}

function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logoIcon}
        resizeMode="contain"
      />
      <View style={styles.logoTextContainer}>
        <Text style={styles.logoText}>{BRAND.name}</Text>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>EXPLORE</Text>
        </View>
      </View>
    </View>
  );
}

export function AppHeader({
  showBack = false,
  showLogo = true,
  title,
  rightAction,
  transparent = false,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const HeaderContent = () => (
    <View style={[styles.headerContent, { paddingTop: insets.top + 8 }]}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={styles.centerSection}>
        {showLogo && !title ? (
          <Logo />
        ) : title ? (
          <Text style={styles.titleText}>{title}</Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon as any} size={22} color={colors.secondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );

  if (transparent) {
    return (
      <View style={styles.transparentHeader}>
        <HeaderContent />
      </View>
    );
  }

  return (
    <View style={styles.headerWrapper}>
      <BlurView
        intensity={80}
        tint="dark"
        style={styles.blurContainer}
      />
      <View style={styles.headerOverlay}>
        <HeaderContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    backgroundColor: 'rgba(13, 148, 136, 0.85)',
  },
  transparentHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  logoBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  logoBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
