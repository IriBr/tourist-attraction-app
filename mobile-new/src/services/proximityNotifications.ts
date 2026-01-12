import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert, Linking } from 'react-native';
import { attractionsApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const PROXIMITY_RADIUS_METERS = 100;
const NOTIFICATION_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes per attraction
const LAST_NOTIFIED_KEY = 'proximity_last_notified';
const PERMISSION_PROMPT_KEY = 'proximity_permission_prompted';

// Track if we've already prompted for permissions this session
let hasPromptedThisSession = false;

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

// Track which attractions we've recently notified about
let lastNotifiedAttractions: Map<string, number> = new Map();

async function loadNotificationHistory() {
  try {
    const stored = await AsyncStorage.getItem(LAST_NOTIFIED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      lastNotifiedAttractions = new Map(Object.entries(parsed));
    }
  } catch (e) {
    console.error('Failed to load notification history:', e);
  }
}

async function saveNotificationHistory() {
  try {
    const obj = Object.fromEntries(lastNotifiedAttractions);
    await AsyncStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save notification history:', e);
  }
}

function shouldNotifyForAttraction(attractionId: string): boolean {
  const lastNotified = lastNotifiedAttractions.get(attractionId);
  if (!lastNotified) return true;
  return Date.now() - lastNotified > NOTIFICATION_COOLDOWN_MS;
}

function markAttractionNotified(attractionId: string) {
  lastNotifiedAttractions.set(attractionId, Date.now());
  saveNotificationHistory();
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  console.log('[ProximityNotifications] Background task triggered');

  if (error) {
    console.error('[ProximityNotifications] Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    console.log('[ProximityNotifications] Received locations:', locations?.length || 0);

    if (locations && locations.length > 0) {
      const location = locations[0];
      console.log('[ProximityNotifications] Checking location:', location.coords.latitude, location.coords.longitude);

      try {
        await checkNearbyAttractions(location.coords.latitude, location.coords.longitude);
      } catch (err) {
        console.error('[ProximityNotifications] Error checking nearby attractions:', err);
      }
    }
  }
});

async function checkNearbyAttractions(latitude: number, longitude: number) {
  try {
    console.log('[ProximityNotifications] Fetching nearby unvisited attractions...');
    const nearbyAttractions = await attractionsApi.getNearbyUnvisited(
      latitude,
      longitude,
      PROXIMITY_RADIUS_METERS,
      5
    );

    console.log('[ProximityNotifications] Found', nearbyAttractions.length, 'nearby unvisited attractions');

    for (const attraction of nearbyAttractions) {
      console.log('[ProximityNotifications] Checking attraction:', attraction.name, attraction.id);
      if (shouldNotifyForAttraction(attraction.id)) {
        console.log('[ProximityNotifications] Sending notification for:', attraction.name);
        await sendProximityNotification(attraction);
        markAttractionNotified(attraction.id);
        break; // Only send one notification at a time
      } else {
        console.log('[ProximityNotifications] Skipping (cooldown):', attraction.name);
      }
    }
  } catch (error: any) {
    console.error('[ProximityNotifications] Failed to check nearby attractions:', error?.message || error);
    console.error('[ProximityNotifications] Error details:', error?.response?.data || error);
  }
}

async function sendProximityNotification(attraction: { id: string; name: string; shortDescription?: string }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You're near ${attraction.name}!`,
      body: attraction.shortDescription || 'Open the camera to scan and mark your visit.',
      data: { attractionId: attraction.id, action: 'openCamera' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

export async function checkPermissions(): Promise<boolean> {
  // Check notification permissions
  const { status: notificationStatus } = await Notifications.getPermissionsAsync();
  if (notificationStatus !== 'granted') {
    return false;
  }

  // Check foreground location permission
  const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return false;
  }

  // Check background location permission
  const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    return false;
  }

  return true;
}

export async function requestPermissions(): Promise<boolean> {
  // First check if we already have all permissions
  const alreadyGranted = await checkPermissions();
  if (alreadyGranted) {
    console.log('All permissions already granted');
    return true;
  }

  // Check if we've already prompted this session - don't spam the user
  if (hasPromptedThisSession) {
    console.log('Already prompted for permissions this session');
    return false;
  }

  // Check if user has previously dismissed the permission prompt
  const previouslyPrompted = await AsyncStorage.getItem(PERMISSION_PROMPT_KEY);
  if (previouslyPrompted === 'dismissed') {
    console.log('User previously dismissed permission prompt');
    return false;
  }

  hasPromptedThisSession = true;

  // Request notification permissions
  const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
  if (notificationStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Request foreground location permission first
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    console.log('Foreground location permission not granted');
    return false;
  }

  // Request background location permission
  // On iOS 13+, this shows a follow-up dialog after foreground permission is granted
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    console.log('Background location permission not granted');

    // On iOS, guide user to Settings to enable "Always" permission - but only once
    if (Platform.OS === 'ios' && previouslyPrompted !== 'shown') {
      await AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'shown');
      Alert.alert(
        'Enable "Always" Location Access',
        'To receive notifications when you\'re near attractions, please enable "Always" location access in Settings.\n\nGo to: Settings → Location → Select "Always"',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'dismissed')
          },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings()
          },
        ]
      );
    }
    return false;
  }

  // Clear the prompt flag since user granted permission
  await AsyncStorage.removeItem(PERMISSION_PROMPT_KEY);
  return true;
}

// Function to prompt user to enable Always permission from Settings (for manual trigger)
export async function promptForAlwaysPermission(): Promise<void> {
  const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    Alert.alert(
      'Enable Background Location',
      'To get notified when you\'re near attractions you haven\'t visited, please enable "Always" location access.\n\nTap "Open Settings", then select Location → Always.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings()
        },
      ]
    );
  }
}

// Reset permission prompt (for testing or when user wants to be prompted again)
export async function resetPermissionPrompt(): Promise<void> {
  hasPromptedThisSession = false;
  await AsyncStorage.removeItem(PERMISSION_PROMPT_KEY);
}

export async function startProximityTracking(): Promise<boolean> {
  await loadNotificationHistory();

  const hasPermissions = await requestPermissions();
  if (!hasPermissions) {
    return false;
  }

  // Check if already running
  const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isTaskRegistered) {
    console.log('Proximity tracking already running');
    return true;
  }

  // Start background location updates
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60000, // Check every 60 seconds
    distanceInterval: 30, // Or when moved 30 meters
    deferredUpdatesInterval: 60000,
    deferredUpdatesDistance: 30,
    showsBackgroundLocationIndicator: true,
    foregroundService: Platform.OS === 'android' ? {
      notificationTitle: 'Wandr',
      notificationBody: 'Tracking nearby attractions',
      notificationColor: '#0D9488',
    } : undefined,
  });

  console.log('Proximity tracking started');
  return true;
}

export async function stopProximityTracking(): Promise<void> {
  const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isTaskRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('Proximity tracking stopped');
  }
}

export async function isProximityTrackingEnabled(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
}

// For manual checks (e.g., when app is in foreground)
export async function checkCurrentLocationForAttractions(): Promise<void> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await checkNearbyAttractions(location.coords.latitude, location.coords.longitude);
  } catch (error) {
    console.error('Failed to get current location:', error);
  }
}

// Set up notification response handler
export function setupNotificationHandler(onOpenCamera: (attractionId?: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.action === 'openCamera') {
      onOpenCamera(data.attractionId as string);
    }
  });

  return () => subscription.remove();
}
