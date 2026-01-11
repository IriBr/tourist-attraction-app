import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsApi } from '../api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let pushToken: string | null = null;

/**
 * Request notification permissions and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[PushNotifications] Must use physical device for Push Notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted');
    return null;
  }

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    pushToken = tokenData.data;
    console.log('[PushNotifications] Got push token:', pushToken);

    // Register with backend
    const platform = Platform.OS as 'ios' | 'android';
    await notificationsApi.registerToken(pushToken, platform);
    console.log('[PushNotifications] Token registered with backend');

    return pushToken;
  } catch (error) {
    console.error('[PushNotifications] Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Unregister push token (call on logout)
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    if (pushToken) {
      await notificationsApi.unregisterToken(pushToken);
      console.log('[PushNotifications] Token unregistered from backend');
    } else {
      // Unregister all tokens for this user
      await notificationsApi.unregisterToken();
      console.log('[PushNotifications] All tokens unregistered from backend');
    }
    pushToken = null;
  } catch (error) {
    console.error('[PushNotifications] Error unregistering push notifications:', error);
  }
}

/**
 * Setup notification response handler
 */
export function setupPushNotificationHandler(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Handle notification received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PushNotifications] Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // Handle notification response (user tapped notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[PushNotifications] Notification response:', response);
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get the current push token (if registered)
 */
export function getPushToken(): string | null {
  return pushToken;
}
