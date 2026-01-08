import { useWindowDimensions } from 'react-native';

export type DeviceType = 'phone' | 'tablet';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveValues {
  deviceType: DeviceType;
  orientation: Orientation;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;

  // Grid columns
  gridColumns: number;

  // Sizing multipliers
  scale: number;

  // Layout constraints
  maxContentWidth: number;
  horizontalPadding: number;

  // Component sizes
  tabBarHeight: number;
  cameraButtonSize: number;
  avatarSize: number;
  thumbnailSize: number;
  cardImageHeight: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLandscape = width > height;
  const deviceType: DeviceType = isTablet ? 'tablet' : 'phone';
  const orientation: Orientation = isLandscape ? 'landscape' : 'portrait';

  // Calculate grid columns based on screen width
  const gridColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  // Scale factor for component sizes
  const scale = isTablet ? 1.25 : 1.0;

  // Max content width (prevent content from stretching too wide)
  const maxContentWidth = isTablet ? 900 : width;

  // Dynamic horizontal padding
  const horizontalPadding = isTablet ? 32 : 16;

  return {
    deviceType,
    orientation,
    isTablet,
    screenWidth: width,
    screenHeight: height,
    gridColumns,
    scale,
    maxContentWidth,
    horizontalPadding,
    tabBarHeight: isTablet ? 80 : 64,
    cameraButtonSize: isTablet ? 72 : 60,
    avatarSize: isTablet ? 120 : 100,
    thumbnailSize: isTablet ? 100 : 80,
    cardImageHeight: isTablet ? 150 : 120,
  };
}
