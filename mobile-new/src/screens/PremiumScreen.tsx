import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { iapService, PRODUCT_IDS, IAPProduct } from '../services/iap';
import { colors } from '../theme';

const PREMIUM_FEATURES = [
  {
    icon: 'scan',
    title: 'Unlimited Scans',
    description: 'Scan as many attractions as you want, every day',
    freeLimit: '3 per day',
    premiumLimit: 'Unlimited',
  },
  {
    icon: 'globe',
    title: 'All Attractions',
    description: 'Access our complete database of tourist attractions worldwide',
    freeLimit: '10 per location',
    premiumLimit: 'Unlimited',
  },
  {
    icon: 'map',
    title: 'Offline Maps',
    description: 'Download maps for offline use while traveling',
    freeLimit: 'Not available',
    premiumLimit: 'Included',
  },
  {
    icon: 'analytics',
    title: 'Advanced Stats',
    description: 'Detailed travel statistics and insights',
    freeLimit: 'Basic only',
    premiumLimit: 'Full access',
  },
  {
    icon: 'ribbon',
    title: 'Priority Support',
    description: 'Get help faster with priority customer support',
    freeLimit: 'Standard',
    premiumLimit: '24/7 Priority',
  },
  {
    icon: 'remove-circle',
    title: 'No Ads',
    description: 'Enjoy an ad-free experience throughout the app',
    freeLimit: 'With ads',
    premiumLimit: 'Ad-free',
  },
];

export function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  const { isPremium, status, fetchStatus } = useSubscriptionStore();

  useEffect(() => {
    loadProducts();
    return () => {
      iapService.disconnect();
    };
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      await iapService.connect();
      const loadedProducts = await iapService.getProducts();
      setProducts(loadedProducts);

      if (loadedProducts.length === 0) {
        console.warn('No products returned from App Store');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert(
        'Store Connection Issue',
        'Unable to load subscription options. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadProducts },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    return product?.price || (productId === PRODUCT_IDS.MONTHLY ? '$4.99' : '$47.90');
  };

  const handleUpgrade = async () => {
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;

    // Check if products were loaded successfully
    if (products.length === 0) {
      Alert.alert(
        'Store Unavailable',
        'Unable to connect to the App Store. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadProducts },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsProcessing(true);
    try {
      await iapService.purchaseProduct(
        productId,
        // onSuccess callback
        () => {
          setIsProcessing(false);
          Alert.alert(
            'Welcome to Premium!',
            'Your subscription is now active. Enjoy unlimited access to all features!',
            [{ text: 'OK', onPress: () => fetchStatus() }]
          );
        },
        // onError callback
        (errorMessage: string) => {
          setIsProcessing(false);
          if (errorMessage !== 'Purchase was cancelled.') {
            Alert.alert('Purchase Issue', errorMessage);
          }
        }
      );
      // Purchase was initiated - waiting for listener callbacks
    } catch (error: any) {
      console.error('Purchase error:', error);
      setIsProcessing(false);
      Alert.alert(
        'Purchase Failed',
        error.message || 'Unable to complete purchase. Please try again.'
      );
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const restored = await iapService.restorePurchases();
      if (restored) {
        Alert.alert('Success', 'Your purchases have been restored!');
        fetchStatus();
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Unable to restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    // Open iOS subscription management
    if (Platform.OS === 'ios') {
      import('react-native').then(({ Linking }) => {
        Linking.openURL('https://apps.apple.com/account/subscriptions');
      });
    }
  };

  if (isPremium) {
    return (
      <LinearGradient
        colors={colors.gradientDark}
        style={styles.container}
      >
        <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium</Text>
            <View style={styles.backButton} />
          </View>

          {/* Already Premium */}
          <View style={styles.alreadyPremiumContainer}>
            <View style={styles.premiumIconLarge}>
              <Ionicons name="star" size={64} color="#FFD700" />
            </View>
            <Text style={styles.alreadyPremiumTitle}>You're Premium!</Text>
            <Text style={styles.alreadyPremiumDesc}>
              Thank you for being a premium member. You have access to all features.
            </Text>
            {status?.subscriptionEndDate && (
              <View style={styles.renewalInfo}>
                <Ionicons name="calendar-outline" size={18} color="#888" />
                <Text style={styles.renewalText}>
                  Renews on {new Date(status.subscriptionEndDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Manage Subscription Button */}
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Ionicons name="settings-outline" size={20} color="#FFD700" />
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Go Premium</Text>
          <View style={styles.backButton} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.3)', 'rgba(255, 215, 0, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="star" size={48} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>Unlock Your Full</Text>
            <Text style={styles.heroTitleAccent}>Travel Experience</Text>
            <Text style={styles.heroSubtitle}>
              Get unlimited access to all features and explore the world without limits
            </Text>
          </LinearGradient>
        </View>

        {/* Pricing Plans */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={styles.planRadio}>
                <View style={[
                  styles.planRadioOuter,
                  selectedPlan === 'monthly' && styles.planRadioOuterSelected,
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Monthly</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{getProductPrice(PRODUCT_IDS.MONTHLY)}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Annual Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
                styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>BEST VALUE</Text>
              </View>
              <View style={styles.planRadio}>
                <View style={[
                  styles.planRadioOuter,
                  selectedPlan === 'annual' && styles.planRadioOuterSelected,
                ]}>
                  {selectedPlan === 'annual' && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Annual</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{getProductPrice(PRODUCT_IDS.ANNUAL)}</Text>
                  <Text style={styles.planPeriod}>/year</Text>
                </View>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save 20%</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Features Comparison */}
        <Text style={styles.sectionTitle}>What You Get</Text>
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={24} color={colors.secondary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureComparison}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Free</Text>
                    <Text style={styles.comparisonValueFree}>{feature.freeLimit}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#888" />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Premium</Text>
                    <Text style={styles.comparisonValuePremium}>{feature.premiumLimit}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#888" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Legal Links */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://wandr-app.com/terms')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://wandr-app.com/privacy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={handleUpgrade}
          disabled={isProcessing || isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LinearGradient
            colors={colors.gradientSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.ctaText}>
                  Subscribe - {selectedPlan === 'monthly' ? getProductPrice(PRODUCT_IDS.MONTHLY) : getProductPrice(PRODUCT_IDS.ANNUAL)}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Text style={styles.ctaDisclaimer}>
          Payment will be charged to your Apple ID account at confirmation of purchase.{'\n'}
          Subscription automatically renews unless canceled at least 24 hours before the end of the current period.{'\n'}
          Your account will be charged for renewal within 24 hours prior to the end of the current period.{'\n'}
          Manage subscriptions in your Account Settings after purchase.
        </Text>
      </View>
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
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  heroSection: {
    marginBottom: 24,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  heroTitleAccent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  loadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  planCardPopular: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planRadio: {
    marginRight: 16,
  },
  planRadioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioOuterSelected: {
    borderColor: colors.secondary,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  planPeriod: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  savingsBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  featureComparison: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  comparisonValueFree: {
    fontSize: 12,
    color: '#888',
  },
  comparisonValuePremium: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legalLink: {
    color: '#888',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#666',
    fontSize: 13,
    marginHorizontal: 12,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ctaDisclaimer: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  // Already Premium styles
  alreadyPremiumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  premiumIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  alreadyPremiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  alreadyPremiumDesc: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  renewalText: {
    color: '#888',
    fontSize: 14,
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  manageButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Pressed state for iPad compatibility
  ctaButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
