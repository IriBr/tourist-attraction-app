import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../store/authStore';

export function useAppleAuth() {
  const { appleLogin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setError('Apple Sign-In is only available on iOS');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract user info
      const { identityToken, fullName, email } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Construct name from full name parts
      let name: string | undefined;
      if (fullName) {
        const nameParts = [fullName.givenName, fullName.familyName].filter(Boolean);
        if (nameParts.length > 0) {
          name = nameParts.join(' ');
        }
      }

      await appleLogin(identityToken, name, email || undefined);
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in
        setError(null);
      } else {
        setError(err.message || 'Failed to sign in with Apple');
      }
    } finally {
      setIsLoading(false);
    }
  }, [appleLogin]);

  const isAvailable = Platform.OS === 'ios';

  return {
    signInWithApple,
    isLoading,
    error,
    isAvailable,
  };
}
