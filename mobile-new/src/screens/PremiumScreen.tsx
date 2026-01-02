import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../store/subscriptionStore';
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

const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    savings: null,
    durationDays: 30,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$79.99',
    period: '/year',
    savings: 'Save 33%',
    durationDays: 365,
    popular: true,
  },
];

export function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const { isPremium, upgradeToPremium, status } = useSubscriptionStore();

  const handleUpgrade = async () => {
    const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsProcessing(true);
    try {
      const success = await upgradeToPremium();
      if (success) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          'You now have access to all premium features. Enjoy unlimited scans and full access to attractions!',
          [
            {
              text: 'Start Exploring',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
    } finally {
      setIsProcessing(false);
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
        <View style={styles.plansContainer}>
          {PRICING_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.planRadio}>
                <View style={[
                  styles.planRadioOuter,
                  selectedPlan === plan.id && styles.planRadioOuterSelected,
                ]}>
                  {selectedPlan === plan.id && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Guarantee */}
        <View style={styles.guaranteeSection}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>7-Day Money Back Guarantee</Text>
            <Text style={styles.guaranteeDesc}>
              Not satisfied? Get a full refund within 7 days, no questions asked.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleUpgrade}
          disabled={isProcessing}
          activeOpacity={0.8}
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
                  Upgrade to Premium - {PRICING_PLANS.find(p => p.id === selectedPlan)?.price}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.ctaDisclaimer}>
          Cancel anytime. Subscription auto-renews.
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
  guaranteeSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  guaranteeContent: {
    flex: 1,
    marginLeft: 12,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
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
});
