import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { useResponsive } from '../hooks';

const privacySections = [
  {
    title: 'Data We Collect',
    icon: 'document-text-outline',
    items: [
      'Account information (name, email)',
      'Location data (when using nearby features)',
      'Photos (only when you choose to upload)',
      'Visit history and favorites',
    ],
  },
  {
    title: 'How We Use Your Data',
    icon: 'analytics-outline',
    items: [
      'Personalize your exploration experience',
      'Show nearby attractions',
      'Track your visited locations and badges',
      'Improve our service and recommendations',
    ],
  },
  {
    title: 'Data Sharing',
    icon: 'share-outline',
    items: [
      'We do not sell your personal data',
      'Reviews are visible to other users',
      'Analytics data is anonymized',
    ],
  },
  {
    title: 'Your Rights',
    icon: 'shield-checkmark-outline',
    items: [
      'Access your personal data',
      'Request data deletion',
      'Opt-out of marketing communications',
      'Export your data',
    ],
  },
];

export function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { maxContentWidth, horizontalPadding } = useResponsive();

  const openPrivacyPolicy = () => {
    Linking.openURL('https://wandr.app/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://wandr.app/terms');
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
          <Text style={styles.title}>Privacy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="lock-closed" size={32} color={colors.secondary} />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We're committed to protecting your personal information and being transparent about what data we collect.
          </Text>
        </View>

        {/* Privacy Sections */}
        {privacySections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as any} size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
            <Ionicons name="document-outline" size={20} color={colors.secondary} />
            <Text style={styles.linkText}>Full Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={openTerms}>
            <Ionicons name="document-text-outline" size={20} color={colors.secondary} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have any questions about our privacy practices, please contact us at{' '}
            <Text style={styles.email} onPress={() => Linking.openURL('mailto:privacy@wandr.app')}>
              privacy@wandr.app
            </Text>
          </Text>
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
  introCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  introTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionContent: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginTop: 6,
    marginRight: 10,
  },
  listText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  linksSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
    marginLeft: 12,
  },
  contactSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  contactTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  email: {
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
