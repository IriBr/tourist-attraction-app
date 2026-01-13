import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';

type GradientVariant = 'dark' | 'primary' | 'secondary' | 'accent';

interface ScreenContainerProps {
  children: React.ReactNode;
  gradient?: GradientVariant;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  gradient = 'dark',
  style,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  return (
    <GradientBackground variant={gradient}>
      <SafeAreaView style={[styles.container, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
