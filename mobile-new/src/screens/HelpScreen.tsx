import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { useResponsive } from '../hooks';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  {
    question: 'How do I scan an attraction?',
    answer: 'Tap the camera button in the tab bar, point your camera at the attraction, and tap the capture button. Our AI will identify the attraction and add it to your visited list.',
  },
  {
    question: 'What counts as a "visit"?',
    answer: 'A visit is recorded when you successfully scan an attraction using the camera feature. You need to be physically at the location for the best results.',
  },
  {
    question: 'How do I earn badges?',
    answer: 'Badges are earned automatically when you visit attractions. There are badges for visiting attractions in cities, countries, and continents. The more you explore, the more badges you earn!',
  },
  {
    question: 'What\'s included in Premium?',
    answer: 'Premium members get unlimited daily scans (free users get 3 per day), access to all attractions worldwide, and exclusive badges.',
  },
  {
    question: 'Can I edit or delete a visit?',
    answer: 'Currently, visits cannot be deleted to maintain the integrity of your travel history. If you scanned the wrong attraction, please contact support.',
  },
  {
    question: 'How accurate is the location detection?',
    answer: 'Our AI uses image recognition combined with your GPS location to identify attractions. For best results, ensure location services are enabled and you\'re close to the attraction.',
  },
  {
    question: 'Is my data private?',
    answer: 'Yes! Your personal data is encrypted and stored securely. We never sell your data. Check our Privacy Policy for more details.',
  },
];

export function HelpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { maxContentWidth, horizontalPadding } = useResponsive();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@wandr.app?subject=Wandr Support Request');
  };

  return (
    <LinearGradient colors={colors.gradientDark} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingHorizontal: horizontalPadding,
            maxWidth: maxContentWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Contact Support */}
        <TouchableOpacity style={styles.supportCard} onPress={contactSupport}>
          <View style={styles.supportIcon}>
            <Ionicons name="mail" size={28} color={colors.secondary} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Contact Support</Text>
            <Text style={styles.supportDesc}>Get help from our team</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqItem,
                index === faqs.length - 1 && styles.faqItemLast,
              ]}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestion}>
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#888"
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Resources */}
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        <View style={styles.resourcesContainer}>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL('https://wandr.app/guide')}
          >
            <Ionicons name="book-outline" size={22} color={colors.secondary} />
            <Text style={styles.resourceText}>User Guide</Text>
            <Ionicons name="open-outline" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL('https://wandr.app/tips')}
          >
            <Ionicons name="bulb-outline" size={22} color={colors.secondary} />
            <Text style={styles.resourceText}>Travel Tips</Text>
            <Ionicons name="open-outline" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resourceItem, styles.resourceItemLast]}
            onPress={() => Linking.openURL('https://twitter.com/wandrapp')}
          >
            <Ionicons name="logo-twitter" size={22} color={colors.secondary} />
            <Text style={styles.resourceText}>Follow us on X</Text>
            <Ionicons name="open-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  faqContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  resourcesContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resourceItemLast: {
    borderBottomWidth: 0,
  },
  resourceText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
    marginLeft: 12,
  },
});
