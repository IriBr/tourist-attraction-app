import { useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// Ensure web browser can complete the authentication
WebBrowser.maybeCompleteAuthSession();

// Get client IDs from app config extra
const extra = Constants.expoConfig?.extra || {};
const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = extra.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Check if Google Sign-In is configured
const isConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

export function useGoogleAuth() {
  const { googleLogin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    isConfigured
      ? {
          clientId: GOOGLE_WEB_CLIENT_ID,
          iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
          androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
        }
      : { clientId: 'not-configured' }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      setError('Google sign in failed');
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await googleLogin(idToken);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) {
      setError('Google Sign-In is not configured');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await promptAsync();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign in');
      setIsLoading(false);
    }
  }, [promptAsync]);

  return {
    signInWithGoogle,
    isLoading,
    error,
    isReady: !!request && isConfigured,
    isConfigured,
  };
}
