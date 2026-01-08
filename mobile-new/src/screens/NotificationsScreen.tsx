import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme';
import { useResponsive } from '../hooks';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { maxContentWidth, horizontalPadding } = useResponsive();

  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'nearby',
      title: 'Nearby Attractions',
      description: 'Get notified when you\'re near an attraction you haven\'t visited',
      enabled: true,
    },
    {
      id: 'badges',
      title: 'Badge Achievements',
      description: 'Get notified when you earn a new badge',
      enabled: true,
    },
    {
      id: 'updates',
      title: 'New Attractions',
      description: 'Get notified when new attractions are added in your area',
      enabled: false,
    },
    {
      id: 'reminders',
      title: 'Weekly Summary',
      description: 'Receive a weekly summary of your exploration progress',
      enabled: false,
    },
  ]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);

    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, please go to Settings and allow notifications for Wandr.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const toggleSetting = (id: string) => {
    if (permissionStatus !== 'granted') {
      requestPermissions();
      return;
    }

    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <LinearGradient colors={colors.gradientDark} style={styles.container}>
      <View style={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingHorizontal: horizontalPadding,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        },
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <TouchableOpacity style={styles.permissionBanner} onPress={requestPermissions}>
            <View style={styles.permissionIcon}>
              <Ionicons name="notifications-off" size={24} color="#ff4757" />
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionDesc}>Tap to enable notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        )}

        {/* Notification Settings */}
        <View style={styles.settingsContainer}>
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.settingItem,
                index === settings.length - 1 && styles.settingItemLast,
              ]}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDesc}>{setting.description}</Text>
              </View>
              <Switch
                value={setting.enabled && permissionStatus === 'granted'}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.secondary }}
                thumbColor="#fff"
                ios_backgroundColor="rgba(255,255,255,0.1)"
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#888" />
          <Text style={styles.infoText}>
            Notification preferences are stored locally on your device.
          </Text>
        </View>
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
  },
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
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    color: '#ff4757',
    fontSize: 15,
    fontWeight: '600',
  },
  permissionDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  settingsContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});
