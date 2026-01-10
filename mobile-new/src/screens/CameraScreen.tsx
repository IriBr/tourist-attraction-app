import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { verificationApi, VerifyResponse, AttractionSummary } from '../api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { useResponsive } from '../hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { isTablet, maxContentWidth, scale } = useResponsive();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Subscription state
  const {
    isPremium,
    canScan,
    scansRemaining,
    fetchStatus,
  } = useSubscriptionStore();

  // Local scans remaining (updated from verification response)
  const [localScansRemaining, setLocalScansRemaining] = useState<number | null>(null);

  // Fetch subscription status on mount
  useEffect(() => {
    fetchStatus();
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const status = await verificationApi.getStatus();
      setLocalScansRemaining(status.scansRemaining);
    } catch (error) {
      console.log('Failed to load verification status:', error);
    }
  };

  const displayScansRemaining = localScansRemaining ?? scansRemaining;

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
        colors={colors.gradientDark}
        style={styles.container}
      >
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={colors.secondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to let you capture your travel memories
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Continue</Text>
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

    if (!canScan || displayScansRemaining <= 0) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    if (!checkScanLimit()) return;

    if (cameraRef.current) {
      setIsProcessing(true);
      try {
        // Get current location for camera mode
        let location: { lat: number; lng: number } | null = null;
        try {
          // Check if we already have permission
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            const response = await Location.requestForegroundPermissionsAsync();
            status = response.status;
          }
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            location = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            };
          }
        } catch (locError) {
          console.log('Could not get location:', locError);
        }

        // Capture photo with base64
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });

        if (photo && photo.base64) {
          setCapturedImage(photo.uri);
          setCapturedBase64(photo.base64);
          setCapturedLocation(location);
          // Verify immediately
          await verifyImage(photo.base64, location);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    if (!checkScanLimit()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && result.assets[0].base64) {
      setCapturedImage(result.assets[0].uri);
      setCapturedBase64(result.assets[0].base64);
      setCapturedLocation(null); // No location for gallery uploads
      setIsProcessing(true);
      // Verify immediately - no location triggers global search
      await verifyImage(result.assets[0].base64, null);
    }
  };

  const verifyImage = async (base64: string, location: { lat: number; lng: number } | null) => {
    try {
      const response = await verificationApi.verify({
        image: base64,
        latitude: location?.lat,
        longitude: location?.lng,
        radiusMeters: 50000, // 50km radius for camera mode
      });

      setVerificationResult(response);
      setLocalScansRemaining(response.scansRemaining);
      setShowResultModal(true);
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error.response?.status === 429) {
        setShowUpgradeModal(true);
      } else {
        Alert.alert(
          'Verification Failed',
          error.response?.data?.error?.message || 'Could not verify the image. Please try again.'
        );
      }
      resetCamera();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSuggestion = async () => {
    if (!verificationResult?.suggestion) return;

    setIsProcessing(true);
    try {
      const response = await verificationApi.confirmSuggestion(verificationResult.suggestion.id);

      if (response.alreadyVisited) {
        Alert.alert(
          'Already Visited',
          `You've already visited ${response.attraction.name}!`,
          [{ text: 'OK', onPress: () => resetCamera() }]
        );
      } else {
        Alert.alert(
          'Visit Recorded!',
          `Congratulations! You've collected ${response.attraction.name}!`,
          [
            {
              text: 'View Details',
              onPress: () => {
                resetCamera();
                navigation.navigate('AttractionDetail', { id: response.attraction.id });
              },
            },
            { text: 'OK', onPress: () => resetCamera() },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to confirm visit');
    } finally {
      setIsProcessing(false);
      setShowResultModal(false);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    navigation.navigate('Premium');
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setCapturedBase64(null);
    setCapturedLocation(null);
    setShowResultModal(false);
    setVerificationResult(null);
  };

  const renderResultContent = () => {
    if (!verificationResult) return null;

    // High confidence match - already created visit
    if (verificationResult.matched && verificationResult.attraction) {
      return (
        <View style={styles.resultContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.resultTitle}>
            {verificationResult.alreadyVisited ? 'Already Visited!' : 'Match Found!'}
          </Text>
          <Text style={styles.resultAttractionName}>{verificationResult.attraction.name}</Text>
          <Text style={styles.resultLocation}>
            {verificationResult.attraction.city}, {verificationResult.attraction.country}
          </Text>
          {verificationResult.explanation && (
            <Text style={styles.resultExplanation}>{verificationResult.explanation}</Text>
          )}
          <Text style={styles.confidenceText}>
            Confidence: {Math.round((verificationResult.confidence || 0) * 100)}%
          </Text>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                resetCamera();
                navigation.navigate('AttractionDetail', { id: verificationResult.attraction!.id });
              }}
            >
              <Text style={styles.primaryButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetCamera}>
              <Text style={styles.secondaryButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Medium confidence - requires confirmation
    if (verificationResult.requiresConfirmation && verificationResult.suggestion) {
      return (
        <View style={styles.resultContent}>
          <View style={styles.questionIconContainer}>
            <Ionicons name="help-circle" size={60} color={colors.secondary} />
          </View>
          <Text style={styles.resultTitle}>Is this...?</Text>
          <Text style={styles.resultAttractionName}>{verificationResult.suggestion.name}</Text>
          <Text style={styles.resultLocation}>
            {verificationResult.suggestion.city}, {verificationResult.suggestion.country}
          </Text>
          {verificationResult.explanation && (
            <Text style={styles.resultExplanation}>{verificationResult.explanation}</Text>
          )}
          <Text style={styles.confidenceText}>
            Confidence: {Math.round((verificationResult.confidence || 0) * 100)}%
          </Text>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={resetCamera}
              disabled={isProcessing}
            >
              <Text style={styles.secondaryButtonText}>No, Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConfirmSuggestion}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Yes, That's It!</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // No match
    return (
      <View style={styles.resultContent}>
        <View style={styles.noMatchIconContainer}>
          <Ionicons name="close-circle" size={60} color="#FF5252" />
        </View>
        <Text style={styles.resultTitle}>No Match Found</Text>
        <Text style={styles.noMatchText}>
          {verificationResult.message || "We couldn't identify a known attraction in this image."}
        </Text>
        {verificationResult.explanation && (
          <Text style={styles.resultExplanation}>{verificationResult.explanation}</Text>
        )}

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={resetCamera}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
            <Text style={styles.headerTitle}>Verify Attraction</Text>
            {/* Scan Counter for Free Users */}
            {!isPremium && (
              <View style={styles.scanCounterContainer}>
                <Ionicons name="scan" size={14} color={colors.secondary} />
                <Text style={styles.scanCounterText}>
                  {displayScansRemaining} scans left today
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
        <View style={[
          styles.frameContainer,
          isTablet && {
            maxWidth: 500,
            alignSelf: 'center',
            marginHorizontal: 80,
          },
        ]}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameTopRight]} />
          <View style={[styles.frameCorner, styles.frameBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameBottomRight]} />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={colors.secondary} />
              <Text style={styles.processingText}>Analyzing image...</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 100 }]}>
          <TouchableOpacity
            style={[styles.galleryButton, isTablet && { width: 60, height: 60, borderRadius: 30 }]}
            onPress={pickImage}
            disabled={isProcessing}
          >
            <Ionicons name="images" size={isTablet ? 32 : 28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled,
              isTablet && { width: 96, height: 96, borderRadius: 48 },
            ]}
            onPress={takePicture}
            disabled={isProcessing}
          >
            <View style={[styles.captureButtonInner, isTablet && { width: 72, height: 72, borderRadius: 36 }]} />
          </TouchableOpacity>

          <View style={[styles.placeholderButton, isTablet && { width: 60, height: 60 }]} />
        </View>
      </CameraView>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetCamera}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            isTablet && { maxWidth: 500, alignSelf: 'center', width: '100%', borderRadius: 24 },
          ]}>
            <View style={styles.modalHandle} />

            {/* Preview Image */}
            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            )}

            {renderResultContent()}

            {!isPremium && (
              <Text style={styles.scansRemainingText}>
                {displayScansRemaining} scans remaining today
              </Text>
            )}
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
              You've used all your free scans for today. Upgrade to Premium for 50 scans per day!
            </Text>

            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.upgradeFeatureText}>50 daily scans</Text>
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
    backgroundColor: colors.secondary,
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
    borderColor: colors.secondary,
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
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  processingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
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
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
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
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  resultContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noMatchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  resultAttractionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  resultExplanation: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  noMatchText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scansRemainingText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  // Scan counter styles
  scanCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  scanCounterText: {
    color: colors.secondary,
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
    backgroundColor: colors.secondary,
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
