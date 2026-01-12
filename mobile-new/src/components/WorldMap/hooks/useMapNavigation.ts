import { useState, useRef, useCallback } from 'react';
import MapView, { Region } from 'react-native-maps';

export type MapLevel = 'world' | 'continent' | 'country' | 'city';

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const WORLD_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 180,
};

export function useMapNavigation() {
  const mapRef = useRef<MapView>(null);
  const [level, setLevel] = useState<MapLevel>('world');
  const [selectedContinent, setSelectedContinent] = useState<MapLocation | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<MapLocation | null>(null);
  const [selectedCity, setSelectedCity] = useState<MapLocation | null>(null);

  const animateToRegion = useCallback((region: Region) => {
    mapRef.current?.animateToRegion(region, 500);
  }, []);

  const navigateToContinent = useCallback((continent: MapLocation) => {
    setSelectedContinent(continent);
    setLevel('continent');
    animateToRegion({
      latitude: continent.latitude,
      longitude: continent.longitude,
      latitudeDelta: continent.latitudeDelta,
      longitudeDelta: continent.longitudeDelta,
    });
  }, [animateToRegion]);

  const navigateToCountry = useCallback((country: MapLocation) => {
    setSelectedCountry(country);
    setLevel('country');
    animateToRegion({
      latitude: country.latitude,
      longitude: country.longitude,
      latitudeDelta: country.latitudeDelta,
      longitudeDelta: country.longitudeDelta,
    });
  }, [animateToRegion]);

  const navigateToCity = useCallback((city: MapLocation) => {
    setSelectedCity(city);
    setLevel('city');
    animateToRegion({
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  }, [animateToRegion]);

  const navigateBack = useCallback(() => {
    if (level === 'city') {
      setSelectedCity(null);
      setLevel('country');
      if (selectedCountry) {
        animateToRegion({
          latitude: selectedCountry.latitude,
          longitude: selectedCountry.longitude,
          latitudeDelta: selectedCountry.latitudeDelta,
          longitudeDelta: selectedCountry.longitudeDelta,
        });
      }
    } else if (level === 'country') {
      setSelectedCountry(null);
      setLevel('continent');
      if (selectedContinent) {
        animateToRegion({
          latitude: selectedContinent.latitude,
          longitude: selectedContinent.longitude,
          latitudeDelta: selectedContinent.latitudeDelta,
          longitudeDelta: selectedContinent.longitudeDelta,
        });
      }
    } else if (level === 'continent') {
      setSelectedContinent(null);
      setLevel('world');
      animateToRegion(WORLD_REGION);
    }
  }, [level, selectedContinent, selectedCountry, animateToRegion]);

  const getBreadcrumb = useCallback(() => {
    const parts = ['World'];
    if (selectedContinent) parts.push(selectedContinent.name);
    if (selectedCountry) parts.push(selectedCountry.name);
    if (selectedCity) parts.push(selectedCity.name);
    return parts.join(' > ');
  }, [selectedContinent, selectedCountry, selectedCity]);

  return {
    mapRef,
    level,
    selectedContinent,
    selectedCountry,
    selectedCity,
    worldRegion: WORLD_REGION,
    navigateToContinent,
    navigateToCountry,
    navigateToCity,
    navigateBack,
    getBreadcrumb,
    setSelectedCity,
  };
}
