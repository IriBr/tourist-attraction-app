import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type ResultType = 'success' | 'confirm' | 'error';

interface VerificationResultProps {
  type: ResultType;
  title: string;
  attractionName?: string;
  location?: string;
  explanation?: string;
  confidence?: number;
  message?: string;
  isProcessing?: boolean;
  onPrimaryAction: () => void;
  primaryActionText: string;
  onSecondaryAction?: () => void;
  secondaryActionText?: string;
}

export function VerificationResult({
  type,
  title,
  attractionName,
  location,
  explanation,
  confidence,
  message,
  isProcessing = false,
  onPrimaryAction,
  primaryActionText,
  onSecondaryAction,
  secondaryActionText,
}: VerificationResultProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#4CAF50' };
      case 'confirm':
        return { name: 'help-circle' as const, color: colors.secondary };
      case 'error':
        return { name: 'close-circle' as const, color: '#FF5252' };
    }
  };

  const iconConfig = getIcon();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
        <Ionicons name={iconConfig.name} size={60} color={iconConfig.color} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {attractionName && (
        <Text style={styles.attractionName}>{attractionName}</Text>
      )}

      {location && (
        <Text style={styles.location}>{location}</Text>
      )}

      {explanation && (
        <Text style={styles.explanation}>{explanation}</Text>
      )}

      {confidence !== undefined && (
        <Text style={styles.confidence}>
          Confidence: {Math.round(confidence * 100)}%
        </Text>
      )}

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      <View style={styles.actions}>
        {onSecondaryAction && secondaryActionText && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSecondaryAction}
            disabled={isProcessing}
          >
            <Text style={styles.secondaryButtonText}>{secondaryActionText}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onPrimaryAction}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{primaryActionText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  attractionName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  location: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  explanation: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  confidence: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 24,
  },
  message: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
