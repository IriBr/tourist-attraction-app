import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  ImageBackground,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GLOBE_SIZE = SCREEN_WIDTH * 0.8;
const RADIUS = GLOBE_SIZE / 2 - 20;

interface GlobeProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
}

// City coordinates (lat, lon)
const cities = [
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Rio', lat: -22.9068, lon: -43.1729 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
];

// Earth texture - bundled locally
const EARTH_IMAGE = require('../../assets/textures/earth-map.jpg');

export function Globe({ autoRotate = true, rotationSpeed = 0.3 }: GlobeProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const animationRef = useRef<number | null>(null);
  const lastPanX = useRef(0);
  const isInteracting = useRef(false);
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1 });

  useEffect(() => {
    if (autoRotate) {
      let lastTime = Date.now();
      const animate = () => {
        if (!isInteracting.current) {
          const now = Date.now();
          const delta = now - lastTime;
          lastTime = now;
          setRotation((prev) => (prev + rotationSpeed * delta * 0.01) % 360);
        } else {
          lastTime = Date.now();
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
  }, [autoRotate, rotationSpeed]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isInteracting.current = true;
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          lastPanX.current = touches[0].pageX;
        } else if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchRef.current.initialDistance = Math.sqrt(dx * dx + dy * dy);
          pinchRef.current.initialScale = scale;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          const deltaX = touches[0].pageX - lastPanX.current;
          setRotation((prev) => prev + deltaX * 0.5);
          lastPanX.current = touches[0].pageX;
        } else if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const newScale = Math.max(0.8, Math.min(2.5, pinchRef.current.initialScale * (distance / pinchRef.current.initialDistance)));
          setScale(newScale);
        }
      },
      onPanResponderRelease: () => {
        isInteracting.current = false;
      },
    })
  ).current;

  const latLonToXY = (lat: number, lon: number, rot: number) => {
    let adjustedLon = lon - rot;
    while (adjustedLon > 180) adjustedLon -= 360;
    while (adjustedLon < -180) adjustedLon += 360;
    if (Math.abs(adjustedLon) >= 90) return null;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (adjustedLon * Math.PI) / 180;
    const x = GLOBE_SIZE / 2 + Math.sin(lonRad) * Math.cos(latRad) * RADIUS * scale;
    const y = GLOBE_SIZE / 2 - Math.sin(latRad) * RADIUS * scale;
    const depth = Math.cos(lonRad) * Math.cos(latRad);
    return { x, y, depth };
  };

  const globeRadius = RADIUS * scale;
  // Calculate percentage offset for background position
  const offsetPercent = ((rotation % 360) / 360) * 100;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Pink outer glow */}
      <View style={[styles.outerGlow, { transform: [{ scale }] }]} />

      {/* Globe with earth texture */}
      <View
        style={[
          styles.globeMask,
          {
            width: globeRadius * 2,
            height: globeRadius * 2,
            borderRadius: globeRadius,
          },
        ]}
      >
        <ImageBackground
          source={EARTH_IMAGE}
          style={{
            width: globeRadius * 4,
            height: globeRadius * 2,
            marginLeft: -(offsetPercent / 100) * globeRadius * 2,
          }}
          imageStyle={{
            resizeMode: 'cover',
          }}
        />

        {/* 3D shading overlay */}
        <View style={[StyleSheet.absoluteFill, { borderRadius: globeRadius }]}>
          <Svg width={globeRadius * 2} height={globeRadius * 2}>
            <Defs>
              <RadialGradient id="sphereShading" cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <Stop offset="40%" stopColor="rgba(255,255,255,0)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
              </RadialGradient>
            </Defs>
            <Circle cx={globeRadius} cy={globeRadius} r={globeRadius - 1} fill="url(#sphereShading)" />
          </Svg>
        </View>
      </View>

      {/* Atmosphere and glow effects */}
      <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} style={styles.glowLayer}>
        <Defs>
          <RadialGradient id="atmosphere" cx="50%" cy="50%" r="50%">
            <Stop offset="78%" stopColor="transparent" />
            <Stop offset="90%" stopColor="rgba(135, 206, 250, 0.3)" />
            <Stop offset="100%" stopColor="rgba(135, 206, 250, 0.1)" />
          </RadialGradient>
          <RadialGradient id="pinkGlow" cx="50%" cy="50%" r="52%">
            <Stop offset="85%" stopColor="transparent" />
            <Stop offset="95%" stopColor="rgba(233, 30, 99, 0.25)" />
            <Stop offset="100%" stopColor="rgba(233, 30, 99, 0.4)" />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOBE_SIZE / 2} cy={GLOBE_SIZE / 2} r={globeRadius + 10} fill="url(#atmosphere)" />
        <Circle cx={GLOBE_SIZE / 2} cy={GLOBE_SIZE / 2} r={globeRadius + 20} fill="url(#pinkGlow)" />
      </Svg>

      {/* City markers */}
      <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} style={styles.markersLayer}>
        {cities.map((city, i) => {
          const pos = latLonToXY(city.lat, city.lon, rotation);
          if (!pos || pos.depth < 0.15) return null;
          return (
            <G key={i}>
              <Circle cx={pos.x} cy={pos.y} r={8 * pos.depth * scale} fill="#e91e63" opacity={0.35 * pos.depth} />
              <Circle cx={pos.x} cy={pos.y} r={4 * pos.depth * scale} fill="#e91e63" opacity={0.9 * pos.depth} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: RADIUS * 2 + 50,
    height: RADIUS * 2 + 50,
    borderRadius: RADIUS + 25,
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  globeMask: {
    overflow: 'hidden',
    backgroundColor: '#0a3d62',
  },
  glowLayer: {
    position: 'absolute',
  },
  markersLayer: {
    position: 'absolute',
  },
});
