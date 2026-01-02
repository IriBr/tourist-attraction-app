import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

type GradientVariant = 'dark' | 'primary' | 'secondary' | 'accent';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  style?: StyleProp<ViewStyle>;
}

const gradientMap: Record<GradientVariant, readonly string[]> = {
  dark: colors.gradientDark,
  primary: colors.gradientPrimary,
  secondary: colors.gradientSecondary,
  accent: colors.gradientAccent,
};

export function GradientBackground({
  children,
  variant = 'dark',
  style,
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={gradientMap[variant] as unknown as string[]}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
