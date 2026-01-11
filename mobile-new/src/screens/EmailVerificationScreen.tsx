import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { colors, BRAND } from '../theme';

export function EmailVerificationScreen() {
  const { user, logout, checkAuth } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    try {
      await authApi.resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent to your inbox.'
      );
      // Start 60 second cooldown
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      await checkAuth();
    } catch (error) {
      // Silent fail - checkAuth handles errors
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              // Silent fail
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={colors.gradientDark} style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.iconBackground}
          >
            <Ionicons name="mail" size={48} color="#fff" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Email</Text>

        {/* Description */}
        <Text style={styles.description}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.instructions}>
          Please check your inbox and click the verification link to activate your {BRAND.name} account.
        </Text>

        {/* Check spam notice */}
        <View style={styles.tipContainer}>
          <Ionicons name="information-circle" size={20} color={colors.secondary} />
          <Text style={styles.tipText}>
            Can't find it? Check your spam or junk folder.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Check verification button */}
          <TouchableOpacity
            onPress={handleCheckVerification}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              {isChecking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend email button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResendEmail}
            disabled={isResending || cooldown > 0}
            activeOpacity={0.7}
          >
            {isResending ? (
              <ActivityIndicator color={colors.secondary} />
            ) : cooldown > 0 ? (
              <Text style={styles.secondaryButtonText}>
                Resend in {cooldown}s
              </Text>
            ) : (
              <>
                <Ionicons name="refresh" size={18} color={colors.secondary} />
                <Text style={styles.secondaryButtonText}>Resend Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout option */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Use a different account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 32,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
});
