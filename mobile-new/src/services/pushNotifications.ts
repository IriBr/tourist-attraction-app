import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsApi } from '../api';

// Hardcoded projectId as fallback - this is the EAS project ID
const EAS_PROJECT_ID = '9b30d187-8bd6-4466-a484-b20607a66e33';

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
 * Get the EAS project ID with multiple fallback options
 */
function getProjectId(): string {
  // Try multiple sources for the projectId
  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEasConfig = (Constants as any).easConfig?.projectId;
  const fromManifest = (Constants as any).manifest?.extra?.eas?.projectId;

  console.log('[PushNotifications] ProjectId sources:', {
    fromExpoConfig,
    fromEasConfig,
    fromManifest,
    fallback: EAS_PROJECT_ID,
  });

  return fromExpoConfig || fromEasConfig || fromManifest || EAS_PROJECT_ID;
}

/**
 * Request notification permissions and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('[PushNotifications] Starting registration...');
  console.log('[PushNotifications] Device.isDevice:', Device.isDevice);
  console.log('[PushNotifications] Platform:', Platform.OS);
  console.log('[PushNotifications] Constants.appOwnership:', Constants.appOwnership);

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[PushNotifications] Must use physical device for Push Notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[PushNotifications] Existing permission status:', existingStatus);
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    console.log('[PushNotifications] Requesting permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[PushNotifications] New permission status:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted, status:', finalStatus);
    return null;
  }

  try {
    // Get the Expo push token with the correct projectId
    const projectId = getProjectId();
    console.log('[PushNotifications] Using Project ID:', projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    pushToken = tokenData.data;
    console.log('[PushNotifications] Got push token:', pushToken);

    // Register with backend
    const platform = Platform.OS as 'ios' | 'android';
    console.log('[PushNotifications] Registering token with backend...');
    const response = await notificationsApi.registerToken(pushToken, platform);
    console.log('[PushNotifications] Backend response:', JSON.stringify(response));

    return pushToken;
  } catch (error: any) {
    console.error('[PushNotifications] Error registering for push notifications:', error);
    console.error('[PushNotifications] Error details:', error?.response?.data || error?.message);
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
