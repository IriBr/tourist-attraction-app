import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  rightContent?: React.ReactNode;
  iconColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function MenuItem({
  icon,
  label,
  onPress,
  showArrow = true,
  rightContent,
  iconColor = colors.secondary,
  style,
  disabled = false,
}: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      {rightContent}
      {showArrow && !rightContent && (
        <Ionicons name="chevron-forward" size={20} color="#888" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  labelDisabled: {
    color: '#666',
  },
});
