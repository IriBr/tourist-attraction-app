import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../store/subscriptionStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [attractionName, setAttractionName] = useState('');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Subscription state
  const {
    isPremium,
    canScan,
    scansRemaining,
    isLoading: subscriptionLoading,
    fetchStatus,
    recordScan,
  } = useSubscriptionStore();

  // Fetch subscription status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
      >
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#e91e63" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to let you capture your travel memories
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const checkScanLimit = (): boolean => {
    if (isPremium) return true;

    if (!canScan || scansRemaining <= 0) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    if (!checkScanLimit()) return;

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setShowSaveModal(true);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    if (!checkScanLimit()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      setShowSaveModal(true);
    }
  };

  const savePhoto = async () => {
    setIsProcessing(true);
    try {
      // Record the scan in the backend
      await recordScan(capturedImage || undefined, attractionName);

      Alert.alert(
        'Photo Saved!',
        `Your photo of "${attractionName || 'Attraction'}" has been saved.${
          !isPremium ? `\n\nScans remaining today: ${scansRemaining - 1}` : ''
        }`,
        [{ text: 'OK', onPress: () => resetCamera() }]
      );
    } catch (error: any) {
      if (error.message?.includes('limit')) {
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', error.message || 'Failed to save photo');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    navigation.navigate('Premium');
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setShowSaveModal(false);
    setAttractionName('');
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Capture Attraction</Text>
            {/* Scan Counter for Free Users */}
            {!isPremium && (
              <View style={styles.scanCounterContainer}>
                <Ionicons name="scan" size={14} color="#e91e63" />
                <Text style={styles.scanCounterText}>
                  {scansRemaining} scans left today
                </Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Camera Frame Guide */}
        <View style={styles.frameContainer}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameTopRight]} />
          <View style={[styles.frameCorner, styles.frameBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameBottomRight]} />
        </View>

        {/* Bottom Controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 100 }]}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </CameraView>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetCamera}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {/* Preview Image */}
            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            )}

            {/* Attraction Name Input */}
            <Text style={styles.modalLabel}>Name this attraction</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Eiffel Tower"
              placeholderTextColor="#666"
              value={attractionName}
              onChangeText={setAttractionName}
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetCamera} disabled={isProcessing}>
                <Text style={styles.cancelButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={savePhoto} disabled={isProcessing}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.upgradeModalOverlay}>
          <View style={styles.upgradeModalContent}>
            <View style={styles.upgradeIconContainer}>
              <Ionicons name="star" size={48} color="#FFD700" />
            </View>
            <Text style={styles.upgradeTitle}>Scan Limit Reached</Text>
            <Text style={styles.upgradeDescription}>
              You've used all 3 free scans for today. Upgrade to Premium for unlimited scans and access to all attractions!
            </Text>

            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.upgradeFeatureText}>Unlimited daily scans</Text>
              </View>
              <View style={styles.upgradeFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.upgradeFeatureText}>Access all attractions</Text>
              </View>
              <View style={styles.upgradeFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.upgradeFeatureText}>Priority support</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Ionicons name="star" size={20} color="#fff" />
              <Text style={styles.upgradeButtonText}>View Premium Plans</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.upgradeLaterButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.upgradeLaterText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  frameContainer: {
    flex: 1,
    margin: 40,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#e91e63',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  frameTopRight: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    left: undefined,
    right: 0,
  },
  frameBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    top: undefined,
    bottom: 0,
  },
  frameBottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    top: undefined,
    left: undefined,
    bottom: 0,
    right: 0,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e91e63',
  },
  placeholderButton: {
    width: 50,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#e91e63',
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Scan counter styles
  scanCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  scanCounterText: {
    color: '#e91e63',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Upgrade modal styles
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  upgradeModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  upgradeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  upgradeFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  upgradeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeFeatureText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
  },
  upgradeButton: {
    backgroundColor: '#e91e63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  upgradeLaterButton: {
    paddingVertical: 12,
  },
  upgradeLaterText: {
    color: '#888',
    fontSize: 14,
  },
});
