import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { colors } from '../theme';
import { useResponsive } from '../hooks';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';

export function AboutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { maxContentWidth, horizontalPadding } = useResponsive();

  const openLink = (url: string) => {
    Linking.openURL(url);
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
          <Text style={styles.title}>About</Text>
          <View style={styles.placeholder} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Ionicons name="globe" size={48} color={colors.secondary} />
          </View>
          <Text style={styles.appName}>Wandr</Text>
          <Text style={styles.appTagline}>Explore the world, one attraction at a time</Text>
          <Text style={styles.versionText}>Version {APP_VERSION} ({BUILD_NUMBER})</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            Wandr is your personal travel companion that helps you discover, track, and remember
            the amazing places you visit around the world. Scan attractions with your camera,
            earn badges, and build your travel story.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={24} color={colors.secondary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Scanning</Text>
              <Text style={styles.featureDesc}>AI-powered attraction recognition</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="ribbon" size={24} color="#FFD700" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Badges & Achievements</Text>
              <Text style={styles.featureDesc}>Earn rewards as you explore</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="globe" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Global Coverage</Text>
              <Text style={styles.featureDesc}>40,000+ attractions worldwide</Text>
            </View>
          </View>
          <View style={[styles.featureItem, styles.featureItemLast]}>
            <Ionicons name="heart" size={24} color="#e91e63" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Favorites & Lists</Text>
              <Text style={styles.featureDesc}>Save places for future visits</Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.linksContainer}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://wandr.app/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.secondary} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://wandr.app/privacy')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.secondary} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, styles.linkItemLast]}
            onPress={() => openLink('https://wandr.app/licenses')}
          >
            <Ionicons name="code-slash-outline" size={20} color={colors.secondary} />
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Social */}
        <Text style={styles.sectionTitle}>Connect With Us</Text>
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => openLink('https://twitter.com/wandrapp')}
          >
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => openLink('https://instagram.com/wandrapp')}
          >
            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => openLink('https://wandr.app')}
          >
            <Ionicons name="globe-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with love for travelers</Text>
          <Text style={styles.copyright}>&copy; 2024 Wandr. All rights reserved.</Text>
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
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 13,
    color: '#666',
  },
  descriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureItemLast: {
    borderBottomWidth: 0,
  },
  featureContent: {
    marginLeft: 14,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  featureDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  linksContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkItemLast: {
    borderBottomWidth: 0,
  },
  linkText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
    marginLeft: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  copyright: {
    color: '#555',
    fontSize: 12,
  },
});
