import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationCardProps {
  name: string;
  subtitle?: string;
  subSubtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconContent?: React.ReactNode;
  color: string;
  progress?: number;
  onPress: () => void;
}

export function LocationCard({
  name,
  subtitle,
  subSubtitle,
  icon = 'earth',
  iconContent,
  color,
  progress,
  onPress,
}: LocationCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        {iconContent || <Ionicons name={icon} size={24} color="#fff" />}
      </View>
      <Text style={styles.name}>{name}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {subSubtitle && <Text style={styles.subSubtitle}>{subSubtitle}</Text>}
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
  },
  subSubtitle: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 32,
  },
});
