import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { suggestionsApi, SuggestionType } from '../api';

interface SuggestionModalProps {
  visible: boolean;
  attractionId: string;
  attractionName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SuggestionOption {
  type: SuggestionType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  requiresComment: boolean;
}

const SUGGESTION_OPTIONS: SuggestionOption[] = [
  {
    type: 'suggest_remove',
    icon: 'flag',
    title: 'Not a Tourist Attraction',
    description: 'This is a business, restaurant, or not a real tourist spot',
    color: '#EF4444',
    requiresComment: false,
  },
  {
    type: 'suggest_verify',
    icon: 'shield-checkmark',
    title: 'Verify This Attraction',
    description: 'This is a legitimate tourist attraction that should be verified',
    color: '#10B981',
    requiresComment: false,
  },
  {
    type: 'comment',
    icon: 'chatbubble',
    title: 'Leave Feedback',
    description: 'Share your thoughts or report an issue',
    color: '#3B82F6',
    requiresComment: true,
  },
];

export function SuggestionModal({
  visible,
  attractionId,
  attractionName,
  onClose,
  onSuccess,
}: SuggestionModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<SuggestionType | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = SUGGESTION_OPTIONS.find((o) => o.type === selectedType);
  const canSubmit =
    selectedType && (!selectedOption?.requiresComment || comment.trim().length >= 10);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await suggestionsApi.create({
        attractionId,
        type: selectedType,
        comment: comment.trim() || undefined,
      });

      // Reset state
      setSelectedType(null);
      setComment('');
      onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit feedback';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setComment('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Submit Feedback</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>
            {attractionName}
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>What would you like to report?</Text>

            {SUGGESTION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.optionCard,
                  selectedType === option.type && styles.optionCardSelected,
                  selectedType === option.type && { borderColor: option.color },
                ]}
                onPress={() => setSelectedType(option.type)}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}
                >
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {selectedType === option.type && (
                  <Ionicons name="checkmark-circle" size={24} color={option.color} />
                )}
              </TouchableOpacity>
            ))}

            {selectedType && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  {selectedOption?.requiresComment
                    ? 'Your feedback (required, min 10 characters)'
                    : 'Additional comments (optional)'}
                </Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share more details..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={1000}
                />
                {selectedOption?.requiresComment && comment.length < 10 && (
                  <Text style={styles.charCount}>
                    {10 - comment.length} more characters needed
                  </Text>
                )}
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
  },
  commentSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#e91e63',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(233, 30, 99, 0.5)',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SuggestionModal;
