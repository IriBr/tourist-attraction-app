import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { visitsApi, locationsApi, UserStats, LocationStats } from '../api';
import type { MapContinent, MapCountry, MapCity, MapAttraction } from '../api/locations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Navigation levels
type MapLevel = 'world' | 'continent' | 'country' | 'city';

// Extended types for the component (with attractions added dynamically)
interface CityWithAttractions extends MapCity {
  attractions: MapAttraction[];
}

interface CountryWithAttractions extends MapCountry {
  cities: CityWithAttractions[];
}

interface ContinentWithAttractions extends MapContinent {
  countries: CountryWithAttractions[];
}

interface WorldMapProps {
  onContinentSelect?: (continent: string) => void;
  onAttractionPress?: (attractionName: string, cityName: string) => void;
}

export function WorldMap({ onContinentSelect, onAttractionPress }: WorldMapProps) {
  const mapRef = useRef<MapView>(null);

  // Map data from API
  const [mapData, setMapData] = useState<ContinentWithAttractions[]>([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [globalStats, setGlobalStats] = useState({ continents: 0, countries: 0, cities: 0, attractions: 0 });

  // Navigation state
  const [level, setLevel] = useState<MapLevel>('world');
  const [selectedContinent, setSelectedContinent] = useState<ContinentWithAttractions | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithAttractions | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityWithAttractions | null>(null);

  // Sheet visibility state
  const [showContinentSheet, setShowContinentSheet] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  const [showCountriesSheet, setShowCountriesSheet] = useState(false);
  const [showContinentStatsSheet, setShowContinentStatsSheet] = useState(false);
  const [showCitiesSheet, setShowCitiesSheet] = useState(false);
  const [showCountryStatsSheet, setShowCountryStatsSheet] = useState(false);
  const [showAttractionsSheet, setShowAttractionsSheet] = useState(false);
  const [showCityStatsSheet, setShowCityStatsSheet] = useState(false);

  // Real stats from API
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [continentStats, setContinentStats] = useState<LocationStats | null>(null);
  const [countryStats, setCountryStats] = useState<LocationStats | null>(null);
  const [cityStats, setCityStats] = useState<LocationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [allContinentProgress, setAllContinentProgress] = useState<Record<string, number>>({});
  const [countryProgressMap, setCountryProgressMap] = useState<Record<string, number>>({});
  const [cityProgressMap, setCityProgressMap] = useState<Record<string, number>>({});

  // Fetch map data on mount
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoadingMap(true);
        const [data, stats] = await Promise.all([
          locationsApi.getMapData(),
          locationsApi.getStats(),
        ]);

        // Convert to our extended type with empty attractions arrays
        const dataWithAttractions: ContinentWithAttractions[] = data.map(continent => ({
          ...continent,
          countries: continent.countries.map(country => ({
            ...country,
            cities: country.cities.map(city => ({
              ...city,
              attractions: [] as MapAttraction[],
            })),
          })),
        }));

        setMapData(dataWithAttractions);
        setGlobalStats(stats);
      } catch (error) {
        console.error('Failed to fetch map data:', error);
      } finally {
        setIsLoadingMap(false);
      }
    };

    fetchMapData();
  }, []);

  // Fetch user stats and continent progress on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const stats = await visitsApi.getUserStats();
        setUserStats(stats);
      } catch (error) {
        console.log('Failed to fetch user stats:', error);
      }
    };

    fetchUserStats();
  }, []);

  // Fetch continent progress when map data is loaded
  useEffect(() => {
    if (mapData.length === 0) return;

    const fetchAllContinentProgress = async () => {
      const progressMap: Record<string, number> = {};

      await Promise.all(mapData.map(async (continent) => {
        try {
          const stats = await visitsApi.getContinentStats(continent.name);
          progressMap[continent.id] = stats.progress;
        } catch (error) {
          progressMap[continent.id] = 0;
        }
      }));

      setAllContinentProgress(progressMap);
    };

    fetchAllContinentProgress();
  }, [mapData]);

  // Fetch continent stats and country progress when continent is selected
  useEffect(() => {
    if (selectedContinent) {
      const fetchContinentStats = async () => {
        setIsLoadingStats(true);
        try {
          const stats = await visitsApi.getContinentStats(selectedContinent.name);
          setContinentStats(stats);
        } catch (error) {
          console.log('Failed to fetch continent stats:', error);
        } finally {
          setIsLoadingStats(false);
        }
      };

      const fetchCountryProgress = async () => {
        const progressMap: Record<string, number> = {};
        await Promise.all(selectedContinent.countries.map(async (country) => {
          try {
            const stats = await visitsApi.getCountryStats(country.name);
            progressMap[country.id] = stats.progress;
          } catch (error) {
            progressMap[country.id] = 0;
          }
        }));
        setCountryProgressMap(progressMap);
      };

      fetchContinentStats();
      fetchCountryProgress();
    }
  }, [selectedContinent]);

  // Fetch country stats and city progress when country is selected
  useEffect(() => {
    if (selectedCountry) {
      const fetchCountryStats = async () => {
        setIsLoadingStats(true);
        try {
          const stats = await visitsApi.getCountryStats(selectedCountry.name);
          setCountryStats(stats);
        } catch (error) {
          console.log('Failed to fetch country stats:', error);
        } finally {
          setIsLoadingStats(false);
        }
      };

      const fetchCityProgress = async () => {
        const progressMap: Record<string, number> = {};
        await Promise.all(selectedCountry.cities.map(async (city) => {
          try {
            const stats = await visitsApi.getCityStats(city.name);
            progressMap[city.id] = stats.progress;
          } catch (error) {
            progressMap[city.id] = 0;
          }
        }));
        setCityProgressMap(progressMap);
      };

      fetchCountryStats();
      fetchCityProgress();
    }
  }, [selectedCountry]);

  // Fetch city stats and attractions when city is selected
  useEffect(() => {
    if (selectedCity) {
      const fetchCityData = async () => {
        setIsLoadingStats(true);
        try {
          const [stats, attractionsData] = await Promise.all([
            visitsApi.getCityStats(selectedCity.name),
            locationsApi.getAttractionsInCity(selectedCity.id),
          ]);
          setCityStats(stats);

          // Update the selected city with attractions
          setSelectedCity(prev => prev ? {
            ...prev,
            attractions: attractionsData.attractions || [],
          } : null);
        } catch (error) {
          console.log('Failed to fetch city data:', error);
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchCityData();
    }
  }, [selectedCity?.id]);

  const worldRegion: Region = {
    latitude: 20,
    longitude: 0,
    latitudeDelta: 120,
    longitudeDelta: 180,
  };

  const animateToRegion = (region: Region) => {
    mapRef.current?.animateToRegion(region, 500);
  };

  const handleContinentPress = (continent: ContinentWithAttractions) => {
    setShowContinentSheet(false);
    setSelectedContinent(continent);
    setLevel('continent');
    onContinentSelect?.(continent.name);
    animateToRegion({
      latitude: continent.latitude,
      longitude: continent.longitude,
      latitudeDelta: continent.latitudeDelta,
      longitudeDelta: continent.longitudeDelta,
    });
  };

  const handleCountryPress = (country: CountryWithAttractions) => {
    setSelectedCountry(country);
    setLevel('country');
    animateToRegion({
      latitude: country.latitude,
      longitude: country.longitude,
      latitudeDelta: country.latitudeDelta,
      longitudeDelta: country.longitudeDelta,
    });
  };

  const handleCityPress = (city: CityWithAttractions) => {
    setSelectedCity(city);
    setLevel('city');
    animateToRegion({
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  };

  const handleBack = () => {
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
      animateToRegion(worldRegion);
    }
  };

  const getBreadcrumb = () => {
    const parts = ['World'];
    if (selectedContinent) parts.push(selectedContinent.name);
    if (selectedCountry) parts.push(selectedCountry.name);
    if (selectedCity) parts.push(selectedCity.name);
    return parts.join(' > ');
  };

  const renderMarkers = () => {
    if (isLoadingMap) return null;

    if (level === 'world') {
      return mapData.map((continent) => (
        <Marker
          key={continent.id}
          coordinate={{ latitude: continent.latitude, longitude: continent.longitude }}
          onPress={() => handleContinentPress(continent)}
          pinColor={continent.color}
        >
          <View style={[styles.continentMarker, { backgroundColor: continent.color || '#4CAF50' }]}>
            <Text style={styles.continentMarkerText}>{continent.name}</Text>
          </View>
        </Marker>
      ));
    }

    if (level === 'continent' && selectedContinent) {
      return selectedContinent.countries.map((country) => (
        <Marker
          key={country.id}
          coordinate={{ latitude: country.latitude, longitude: country.longitude }}
          onPress={() => handleCountryPress(country)}
        >
          <View style={[styles.countryMarker, { backgroundColor: selectedContinent.color || '#4CAF50' }]}>
            <Text style={styles.countryMarkerText}>{country.code}</Text>
          </View>
        </Marker>
      ));
    }

    if (level === 'country' && selectedCountry) {
      return selectedCountry.cities.map((city) => (
        <Marker
          key={city.id}
          coordinate={{ latitude: city.latitude, longitude: city.longitude }}
          onPress={() => handleCityPress(city)}
        >
          <View style={styles.cityMarker}>
            <Ionicons name="location" size={24} color="#e91e63" />
            <Text style={styles.cityMarkerText}>{city.name}</Text>
          </View>
        </Marker>
      ));
    }

    if (level === 'city' && selectedCity) {
      return selectedCity.attractions.map((attraction) => (
        <Marker
          key={attraction.id}
          coordinate={{ latitude: attraction.latitude, longitude: attraction.longitude }}
          title={attraction.name}
          description={attraction.shortDescription}
          onPress={() => onAttractionPress?.(attraction.name, selectedCity.name)}
        >
          <View style={styles.attractionMarker}>
            <Ionicons name="star" size={20} color="#FFD700" />
          </View>
        </Marker>
      ));
    }

    return null;
  };

  const renderBottomPanel = () => {
    if (isLoadingMap) return null;

    if (level === 'city' && selectedCity && selectedContinent) {
      return (
        <View style={styles.worldBottomBar}>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowCityStatsSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: `${selectedContinent.color}25` }]}>
              <Ionicons name="stats-chart" size={22} color={selectedContinent.color} />
            </View>
            <Text style={styles.worldActionText}>{selectedCity.name} Stats</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowAttractionsSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
              <Ionicons name="star" size={22} color="#FFD700" />
            </View>
            <Text style={styles.worldActionText}>Explore Attractions</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      );
    }

    if (level === 'country' && selectedCountry && selectedContinent) {
      return (
        <View style={styles.worldBottomBar}>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowCountryStatsSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: `${selectedContinent.color}25` }]}>
              <Ionicons name="stats-chart" size={22} color={selectedContinent.color} />
            </View>
            <Text style={styles.worldActionText}>{selectedCountry.name} Stats</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowCitiesSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
              <Ionicons name="business" size={22} color="#2196F3" />
            </View>
            <Text style={styles.worldActionText}>Explore Cities</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      );
    }

    if (level === 'continent' && selectedContinent) {
      return (
        <View style={styles.worldBottomBar}>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowContinentStatsSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: `${selectedContinent.color}25` }]}>
              <Ionicons name="stats-chart" size={22} color={selectedContinent.color} />
            </View>
            <Text style={styles.worldActionText}>{selectedContinent.name} Stats</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.worldActionButton}
            onPress={() => setShowCountriesSheet(true)}
          >
            <View style={[styles.worldActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <Ionicons name="flag" size={22} color="#4CAF50" />
            </View>
            <Text style={styles.worldActionText}>Explore Countries</Text>
            <Ionicons name="chevron-up" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      );
    }

    // World level - Show action buttons
    return (
      <View style={styles.worldBottomBar}>
        <TouchableOpacity
          style={styles.worldActionButton}
          onPress={() => setShowStatsSheet(true)}
        >
          <View style={[styles.worldActionIcon, { backgroundColor: 'rgba(233, 30, 99, 0.15)' }]}>
            <Ionicons name="stats-chart" size={22} color="#e91e63" />
          </View>
          <Text style={styles.worldActionText}>Travel Stats</Text>
          <Ionicons name="chevron-up" size={18} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.worldActionButton}
          onPress={() => setShowContinentSheet(true)}
        >
          <View style={[styles.worldActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
            <Ionicons name="compass" size={22} color="#4CAF50" />
          </View>
          <Text style={styles.worldActionText}>Explore Continents</Text>
          <Ionicons name="chevron-up" size={18} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoadingMap) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading map data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {level !== 'world' && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.breadcrumb} numberOfLines={1}>{getBreadcrumb()}</Text>
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={worldRegion}
        mapType="standard"
      >
        {renderMarkers()}
      </MapView>

      {/* Bottom Panel */}
      {renderBottomPanel()}

      {/* Continent Bottom Sheet */}
      <Modal
        visible={showContinentSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContinentSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowContinentSheet(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Explore Continents</Text>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={() => setShowContinentSheet(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={mapData}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.sheetContent}
              renderItem={({ item }) => {
                const progress = allContinentProgress[item.id] ?? 0;

                return (
                  <TouchableOpacity
                    style={[styles.continentSheetCard, { borderColor: item.color || '#4CAF50' }]}
                    onPress={() => handleContinentPress(item)}
                  >
                    <View style={[styles.continentSheetIcon, { backgroundColor: item.color || '#4CAF50' }]}>
                      <Ionicons name="earth" size={24} color="#fff" />
                    </View>
                    <Text style={styles.continentSheetName}>{item.name}</Text>
                    <Text style={styles.continentSheetCount}>{item.countryCount} countries</Text>
                    <Text style={styles.continentSheetCities}>
                      {item.countries.reduce((acc, c) => acc + c.cityCount, 0)} cities
                    </Text>
                    <View style={styles.continentProgressContainer}>
                      <View style={styles.continentProgressBar}>
                        <View style={[styles.continentProgressFill, { width: `${progress}%`, backgroundColor: item.color || '#4CAF50' }]} />
                      </View>
                      <Text style={styles.continentProgressText}>{progress.toFixed(0)}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Travel Stats Bottom Sheet */}
      <Modal
        visible={showStatsSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatsSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowStatsSheet(false)}
          />
          <View style={styles.statsSheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Your Travel Stats</Text>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={() => setShowStatsSheet(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.statsSheetContent}>
              <View style={styles.statsSheetRow}>
                <View style={styles.statsSheetCard}>
                  <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(233, 30, 99, 0.15)' }]}>
                    <Ionicons name="globe-outline" size={32} color="#e91e63" />
                  </View>
                  <Text style={styles.statsSheetValue}>{userStats?.continentsVisited ?? 0}</Text>
                  <Text style={styles.statsSheetLabel}>Continents</Text>
                  <Text style={styles.statsSheetSubLabel}>out of {globalStats.continents}</Text>
                </View>
                <View style={styles.statsSheetCard}>
                  <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                    <Ionicons name="flag-outline" size={32} color="#4CAF50" />
                  </View>
                  <Text style={styles.statsSheetValue}>{userStats?.countriesVisited ?? 0}</Text>
                  <Text style={styles.statsSheetLabel}>Countries</Text>
                  <Text style={styles.statsSheetSubLabel}>out of {globalStats.countries}</Text>
                </View>
              </View>
              <View style={styles.statsSheetRow}>
                <View style={styles.statsSheetCard}>
                  <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                    <Ionicons name="business-outline" size={32} color="#2196F3" />
                  </View>
                  <Text style={styles.statsSheetValue}>{userStats?.citiesVisited ?? 0}</Text>
                  <Text style={styles.statsSheetLabel}>Cities</Text>
                  <Text style={styles.statsSheetSubLabel}>out of {globalStats.cities}</Text>
                </View>
                <View style={styles.statsSheetCard}>
                  <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                    <Ionicons name="star-outline" size={32} color="#FFD700" />
                  </View>
                  <Text style={styles.statsSheetValue}>{userStats?.totalVisits ?? 0}</Text>
                  <Text style={styles.statsSheetLabel}>Attractions</Text>
                  <Text style={styles.statsSheetSubLabel}>out of {globalStats.attractions}</Text>
                </View>
              </View>
              <View style={styles.statsProgressSection}>
                <Text style={styles.statsProgressTitle}>Your Progress</Text>
                <View style={styles.statsProgressBar}>
                  <View style={[styles.statsProgressFill, { width: `${((userStats?.totalVisits ?? 0) / Math.max(globalStats.attractions, 1)) * 100}%` }]} />
                </View>
                <Text style={styles.statsProgressText}>
                  {(((userStats?.totalVisits ?? 0) / Math.max(globalStats.attractions, 1)) * 100).toFixed(1)}% of the world explored
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Continent Stats Bottom Sheet */}
      {selectedContinent && (
        <Modal
          visible={showContinentStatsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowContinentStatsSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowContinentStatsSheet(false)}
            />
            <View style={styles.statsSheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{selectedContinent.name} Stats</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowContinentStatsSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.statsSheetContent}>
                {isLoadingStats ? (
                  <ActivityIndicator size="large" color={selectedContinent.color} style={{ marginVertical: 40 }} />
                ) : (
                  <>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: `${selectedContinent.color}25` }]}>
                          <Ionicons name="flag-outline" size={32} color={selectedContinent.color} />
                        </View>
                        <Text style={styles.statsSheetValue}>{selectedContinent.countryCount}</Text>
                        <Text style={styles.statsSheetLabel}>Countries</Text>
                        <Text style={styles.statsSheetSubLabel}>to explore</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                          <Ionicons name="business-outline" size={32} color="#2196F3" />
                        </View>
                        <Text style={styles.statsSheetValue}>
                          {selectedContinent.countries.reduce((acc, c) => acc + c.cityCount, 0)}
                        </Text>
                        <Text style={styles.statsSheetLabel}>Cities</Text>
                        <Text style={styles.statsSheetSubLabel}>to visit</Text>
                      </View>
                    </View>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                          <Ionicons name="star-outline" size={32} color="#FFD700" />
                        </View>
                        <Text style={styles.statsSheetValue}>
                          {continentStats?.totalAttractions ?? 0}
                        </Text>
                        <Text style={styles.statsSheetLabel}>Attractions</Text>
                        <Text style={styles.statsSheetSubLabel}>to discover</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                          <Ionicons name="checkmark-circle-outline" size={32} color="#9C27B0" />
                        </View>
                        <Text style={styles.statsSheetValue}>{continentStats?.visitedAttractions ?? 0}</Text>
                        <Text style={styles.statsSheetLabel}>Visited</Text>
                        <Text style={styles.statsSheetSubLabel}>so far</Text>
                      </View>
                    </View>
                    {/* Progress Section */}
                    <View style={styles.statsProgressSection}>
                      <Text style={styles.statsProgressTitle}>Your Progress in {selectedContinent.name}</Text>
                      <View style={styles.statsProgressBar}>
                        <View style={[styles.statsProgressFill, {
                          width: `${continentStats?.progress ?? 0}%`,
                          backgroundColor: selectedContinent.color
                        }]} />
                      </View>
                      <Text style={styles.statsProgressText}>
                        {(continentStats?.progress ?? 0).toFixed(1)}% of {selectedContinent.name} explored
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Countries Bottom Sheet */}
      {selectedContinent && (
        <Modal
          visible={showCountriesSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountriesSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowCountriesSheet(false)}
            />
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Countries in {selectedContinent.name}</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowCountriesSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={selectedContinent.countries}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.sheetContent}
                renderItem={({ item }) => {
                  const progress = countryProgressMap[item.id] ?? 0;
                  return (
                    <TouchableOpacity
                      style={[styles.continentSheetCard, { borderColor: selectedContinent.color }]}
                      onPress={() => {
                        setShowCountriesSheet(false);
                        handleCountryPress(item);
                      }}
                    >
                      <View style={[styles.continentSheetIcon, { backgroundColor: selectedContinent.color }]}>
                        <Text style={styles.countrySheetCode}>{item.code}</Text>
                      </View>
                      <Text style={styles.continentSheetName}>{item.name}</Text>
                      <Text style={styles.continentSheetCount}>{item.cityCount} cities</Text>
                      <View style={styles.continentProgressContainer}>
                        <View style={styles.continentProgressBar}>
                          <View style={[styles.continentProgressFill, { width: `${progress}%`, backgroundColor: selectedContinent.color }]} />
                        </View>
                        <Text style={styles.continentProgressText}>{progress.toFixed(0)}%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Country Stats Bottom Sheet */}
      {selectedCountry && selectedContinent && (
        <Modal
          visible={showCountryStatsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryStatsSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowCountryStatsSheet(false)}
            />
            <View style={styles.statsSheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{selectedCountry.name} Stats</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowCountryStatsSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.statsSheetContent}>
                {isLoadingStats ? (
                  <ActivityIndicator size="large" color={selectedContinent.color} style={{ marginVertical: 40 }} />
                ) : (
                  <>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                          <Ionicons name="business-outline" size={32} color="#2196F3" />
                        </View>
                        <Text style={styles.statsSheetValue}>{selectedCountry.cityCount}</Text>
                        <Text style={styles.statsSheetLabel}>Cities</Text>
                        <Text style={styles.statsSheetSubLabel}>to visit</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                          <Ionicons name="star-outline" size={32} color="#FFD700" />
                        </View>
                        <Text style={styles.statsSheetValue}>
                          {countryStats?.totalAttractions ?? 0}
                        </Text>
                        <Text style={styles.statsSheetLabel}>Attractions</Text>
                        <Text style={styles.statsSheetSubLabel}>to discover</Text>
                      </View>
                    </View>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                          <Ionicons name="checkmark-circle-outline" size={32} color="#9C27B0" />
                        </View>
                        <Text style={styles.statsSheetValue}>{countryStats?.visitedAttractions ?? 0}</Text>
                        <Text style={styles.statsSheetLabel}>Visited</Text>
                        <Text style={styles.statsSheetSubLabel}>so far</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: `${selectedContinent.color}25` }]}>
                          <Ionicons name="flag-outline" size={32} color={selectedContinent.color} />
                        </View>
                        <Text style={styles.statsSheetValue}>{selectedCountry.code}</Text>
                        <Text style={styles.statsSheetLabel}>Country</Text>
                        <Text style={styles.statsSheetSubLabel}>{selectedContinent.name}</Text>
                      </View>
                    </View>
                    {/* Progress Section */}
                    <View style={styles.statsProgressSection}>
                      <Text style={styles.statsProgressTitle}>Your Progress in {selectedCountry.name}</Text>
                      <View style={styles.statsProgressBar}>
                        <View style={[styles.statsProgressFill, {
                          width: `${countryStats?.progress ?? 0}%`,
                          backgroundColor: selectedContinent.color
                        }]} />
                      </View>
                      <Text style={styles.statsProgressText}>
                        {(countryStats?.progress ?? 0).toFixed(1)}% of {selectedCountry.name} explored
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Cities Bottom Sheet */}
      {selectedCountry && selectedContinent && (
        <Modal
          visible={showCitiesSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCitiesSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowCitiesSheet(false)}
            />
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Cities in {selectedCountry.name}</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowCitiesSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={selectedCountry.cities}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.sheetContent}
                renderItem={({ item }) => {
                  const progress = cityProgressMap[item.id] ?? 0;
                  return (
                    <TouchableOpacity
                      style={[styles.continentSheetCard, { borderColor: selectedContinent.color }]}
                      onPress={() => {
                        setShowCitiesSheet(false);
                        handleCityPress(item);
                      }}
                    >
                      <View style={[styles.continentSheetIcon, { backgroundColor: selectedContinent.color }]}>
                        <Ionicons name="location" size={24} color="#fff" />
                      </View>
                      <Text style={styles.continentSheetName}>{item.name}</Text>
                      <Text style={styles.continentSheetCount}>{item.attractionCount} attractions</Text>
                      <View style={styles.continentProgressContainer}>
                        <View style={styles.continentProgressBar}>
                          <View style={[styles.continentProgressFill, { width: `${progress}%`, backgroundColor: selectedContinent.color }]} />
                        </View>
                        <Text style={styles.continentProgressText}>{progress.toFixed(0)}%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* City Stats Bottom Sheet */}
      {selectedCity && selectedContinent && selectedCountry && (
        <Modal
          visible={showCityStatsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCityStatsSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowCityStatsSheet(false)}
            />
            <View style={styles.statsSheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{selectedCity.name} Stats</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowCityStatsSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.statsSheetContent}>
                {isLoadingStats ? (
                  <ActivityIndicator size="large" color={selectedContinent.color} style={{ marginVertical: 40 }} />
                ) : (
                  <>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                          <Ionicons name="star-outline" size={32} color="#FFD700" />
                        </View>
                        <Text style={styles.statsSheetValue}>{cityStats?.totalAttractions ?? selectedCity.attractionCount}</Text>
                        <Text style={styles.statsSheetLabel}>Attractions</Text>
                        <Text style={styles.statsSheetSubLabel}>to discover</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                          <Ionicons name="checkmark-circle-outline" size={32} color="#9C27B0" />
                        </View>
                        <Text style={styles.statsSheetValue}>{cityStats?.visitedAttractions ?? 0}</Text>
                        <Text style={styles.statsSheetLabel}>Visited</Text>
                        <Text style={styles.statsSheetSubLabel}>so far</Text>
                      </View>
                    </View>
                    <View style={styles.statsSheetRow}>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: `${selectedContinent.color}25` }]}>
                          <Ionicons name="flag-outline" size={32} color={selectedContinent.color} />
                        </View>
                        <Text style={styles.statsSheetValue}>{selectedCountry.code}</Text>
                        <Text style={styles.statsSheetLabel}>Country</Text>
                        <Text style={styles.statsSheetSubLabel}>{selectedCountry.name}</Text>
                      </View>
                      <View style={styles.statsSheetCard}>
                        <View style={[styles.statsSheetIconContainer, { backgroundColor: 'rgba(233, 30, 99, 0.15)' }]}>
                          <Ionicons name="globe-outline" size={32} color="#e91e63" />
                        </View>
                        <Text style={styles.statsSheetValue}>{selectedContinent.name.substring(0, 3)}</Text>
                        <Text style={styles.statsSheetLabel}>Continent</Text>
                        <Text style={styles.statsSheetSubLabel}>{selectedContinent.name}</Text>
                      </View>
                    </View>
                    {/* Progress Section */}
                    <View style={styles.statsProgressSection}>
                      <Text style={styles.statsProgressTitle}>Your Progress in {selectedCity.name}</Text>
                      <View style={styles.statsProgressBar}>
                        <View style={[styles.statsProgressFill, {
                          width: `${cityStats?.progress ?? 0}%`,
                          backgroundColor: selectedContinent.color
                        }]} />
                      </View>
                      <Text style={styles.statsProgressText}>
                        {(cityStats?.progress ?? 0).toFixed(1)}% of {selectedCity.name} explored
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Attractions Bottom Sheet */}
      {selectedCity && selectedContinent && (
        <Modal
          visible={showAttractionsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAttractionsSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowAttractionsSheet(false)}
            />
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Attractions in {selectedCity.name}</Text>
                <TouchableOpacity
                  style={styles.sheetCloseButton}
                  onPress={() => setShowAttractionsSheet(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {isLoadingStats && selectedCity.attractions.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.emptyStateText}>Loading attractions...</Text>
                </View>
              ) : selectedCity.attractions.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="lock-closed" size={48} color="#888" />
                  <Text style={styles.emptyStateText}>No attractions available</Text>
                  <Text style={styles.emptyStateSubText}>Upgrade to Premium to see all attractions</Text>
                </View>
              ) : (
                <FlatList
                  data={selectedCity.attractions}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.sheetContent}
                  renderItem={({ item }) => {
                    const attractionFromApi = cityStats?.attractions?.find(a => a.name === item.name);
                    const isVisited = attractionFromApi?.isVisited ?? false;
                    return (
                      <TouchableOpacity
                        style={[styles.attractionSheetCard, { borderColor: isVisited ? '#4CAF50' : selectedContinent.color }]}
                        onPress={() => {
                          setShowAttractionsSheet(false);
                          onAttractionPress?.(item.name, selectedCity.name);
                        }}
                      >
                        <View style={[styles.continentSheetIcon, { backgroundColor: isVisited ? '#4CAF50' : 'rgba(255, 215, 0, 0.3)' }]}>
                          {isVisited ? (
                            <Ionicons name="checkmark" size={24} color="#fff" />
                          ) : (
                            <Ionicons name="star" size={24} color="#FFD700" />
                          )}
                        </View>
                        <Text style={styles.continentSheetName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.attractionSheetRating}>★ {item.averageRating?.toFixed(1) || 'N/A'}</Text>
                        <View style={styles.continentProgressContainer}>
                          <View style={[styles.attractionVisitedBadge, { backgroundColor: isVisited ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.1)' }]}>
                            <Text style={[styles.attractionVisitedText, { color: isVisited ? '#4CAF50' : '#888' }]}>
                              {isVisited ? 'Visited' : 'Not visited'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e63',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breadcrumb: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  continentMarker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  continentMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryMarkerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cityMarker: {
    alignItems: 'center',
  },
  cityMarkerText: {
    color: '#e91e63',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  attractionMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  attractionSheetCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
  },
  attractionSheetRating: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  attractionVisitedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  attractionVisitedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
  emptyStateSubText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    padding: 12,
  },
  continentSheetCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
  },
  continentSheetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  continentSheetName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  continentSheetCount: {
    color: '#888',
    fontSize: 12,
  },
  continentSheetCities: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  countrySheetCode: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continentProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  continentProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  continentProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  continentProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 32,
  },
  // World level bottom bar styles
  worldBottomBar: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  worldActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  worldActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  worldActionText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Stats sheet styles
  statsSheetContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  statsSheetContent: {
    padding: 16,
  },
  statsSheetRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statsSheetCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  statsSheetIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsSheetValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsSheetLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statsSheetSubLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  statsProgressSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginHorizontal: 6,
  },
  statsProgressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsProgressFill: {
    height: '100%',
    backgroundColor: '#e91e63',
    borderRadius: 4,
  },
  statsProgressText: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
