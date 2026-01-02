import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { AuthStackScreenProps } from '../navigation/types';
import { colors, BRAND } from '../theme';

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Coming Soon', 'Google Sign-In will be available in a future update');
  };

  const handleAppleLogin = () => {
    Alert.alert('Coming Soon', 'Apple Sign-In will be available in a future update');
  };

  const handlePhoneLogin = () => {
    Alert.alert('Coming Soon', 'Phone Sign-In will be available in a future update');
  };

  return (
    <LinearGradient
      colors={colors.gradientDark}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.title}>{BRAND.name}</Text>
            <Text style={styles.subtitle}>{BRAND.tagline}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            {/* Google */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleLogin}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              style={[styles.socialButton, styles.phoneButton]}
              onPress={handlePhoneLogin}
              disabled={isLoading}
            >
              <Ionicons name="call-outline" size={20} color={colors.secondary} />
              <Text style={[styles.socialButtonText, styles.phoneButtonText]}>
                Continue with Phone Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.footerLink}>Register now</Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <Text style={styles.versionText}>{BRAND.name} v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '300',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
  phoneButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  phoneButtonText: {
    color: '#1a1a1a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  footerLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 24,
  },
});
