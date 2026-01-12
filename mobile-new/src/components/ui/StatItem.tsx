import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

interface StatItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
  iconSize?: number;
  horizontal?: boolean;
}

export function StatItem({
  icon,
  value,
  label,
  color = colors.secondary,
  style,
  iconSize = 24,
  horizontal = false,
}: StatItemProps) {
  return (
    <View style={[horizontal ? styles.containerHorizontal : styles.container, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={iconSize} color={color} />
        </View>
      )}
      <View style={horizontal ? styles.contentHorizontal : styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  content: {
    alignItems: 'center',
  },
  contentHorizontal: {
    marginLeft: spacing.md,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
