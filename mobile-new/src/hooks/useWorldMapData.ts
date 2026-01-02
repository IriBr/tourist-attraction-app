import { useState, useEffect, useCallback } from 'react';
import { visitsApi, locationsApi, UserStats, LocationStats } from '../api';
import type { MapContinent, MapCountry, MapCity, MapAttraction } from '../api/locations';

// Extended types with attractions
export interface CityWithAttractions extends MapCity {
  attractions: MapAttraction[];
}

export interface CountryWithAttractions extends MapCountry {
  cities: CityWithAttractions[];
}

export interface ContinentWithAttractions extends MapContinent {
  countries: CountryWithAttractions[];
}

export interface GlobalStats {
  continents: number;
  countries: number;
  cities: number;
  attractions: number;
}

export type MapLevel = 'world' | 'continent' | 'country' | 'city';

interface UseWorldMapDataReturn {
  // Map data
  mapData: ContinentWithAttractions[];
  isLoadingMap: boolean;
  globalStats: GlobalStats;

  // Navigation state
  level: MapLevel;
  selectedContinent: ContinentWithAttractions | null;
  selectedCountry: CountryWithAttractions | null;
  selectedCity: CityWithAttractions | null;

  // Stats
  userStats: UserStats | null;
  continentStats: LocationStats | null;
  countryStats: LocationStats | null;
  cityStats: LocationStats | null;
  isLoadingStats: boolean;

  // Progress maps
  allContinentProgress: Record<string, number>;
  countryProgressMap: Record<string, number>;
  cityProgressMap: Record<string, number>;

  // Actions
  selectContinent: (continent: ContinentWithAttractions) => void;
  selectCountry: (country: CountryWithAttractions) => void;
  selectCity: (city: CityWithAttractions) => void;
  goBack: () => void;
  goToWorld: () => void;

  // City attractions
  loadCityAttractions: (cityId: string) => Promise<MapAttraction[]>;
}

export function useWorldMapData(): UseWorldMapDataReturn {
  // Map data state
  const [mapData, setMapData] = useState<ContinentWithAttractions[]>([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    continents: 0,
    countries: 0,
    cities: 0,
    attractions: 0,
  });

  // Navigation state
  const [level, setLevel] = useState<MapLevel>('world');
  const [selectedContinent, setSelectedContinent] = useState<ContinentWithAttractions | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithAttractions | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityWithAttractions | null>(null);

  // Stats state
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [continentStats, setContinentStats] = useState<LocationStats | null>(null);
  const [countryStats, setCountryStats] = useState<LocationStats | null>(null);
  const [cityStats, setCityStats] = useState<LocationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Progress maps
  const [allContinentProgress, setAllContinentProgress] = useState<Record<string, number>>({});
  const [countryProgressMap, setCountryProgressMap] = useState<Record<string, number>>({});
  const [cityProgressMap, setCityProgressMap] = useState<Record<string, number>>({});

  // Fetch initial map data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoadingMap(true);
        const [data, stats] = await Promise.all([
          locationsApi.getMapData(),
          locationsApi.getStats(),
        ]);

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

  // Fetch user stats
  useEffect(() => {
    visitsApi.getUserStats()
      .then(setUserStats)
      .catch(() => console.log('Failed to fetch user stats'));
  }, []);

  // Fetch continent progress when map data loads
  useEffect(() => {
    if (mapData.length === 0) return;

    const fetchProgress = async () => {
      const progressMap: Record<string, number> = {};
      await Promise.all(mapData.map(async (continent) => {
        try {
          const stats = await visitsApi.getContinentStats(continent.name);
          progressMap[continent.id] = stats.progress;
        } catch {
          progressMap[continent.id] = 0;
        }
      }));
      setAllContinentProgress(progressMap);
    };

    fetchProgress();
  }, [mapData]);

  // Fetch stats when continent is selected
  useEffect(() => {
    if (!selectedContinent) return;

    const fetchContinentData = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await visitsApi.getContinentStats(selectedContinent.name);
        setContinentStats(stats);
      } catch {
        console.log('Failed to fetch continent stats');
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
        } catch {
          progressMap[country.id] = 0;
        }
      }));
      setCountryProgressMap(progressMap);
    };

    fetchContinentData();
    fetchCountryProgress();
  }, [selectedContinent]);

  // Fetch stats when country is selected
  useEffect(() => {
    if (!selectedCountry) return;

    const fetchCountryData = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await visitsApi.getCountryStats(selectedCountry.name);
        setCountryStats(stats);
      } catch {
        console.log('Failed to fetch country stats');
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
        } catch {
          progressMap[city.id] = 0;
        }
      }));
      setCityProgressMap(progressMap);
    };

    fetchCountryData();
    fetchCityProgress();
  }, [selectedCountry]);

  // Fetch city stats when city is selected
  useEffect(() => {
    if (!selectedCity) return;

    const fetchCityData = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await visitsApi.getCityStats(selectedCity.name);
        setCityStats(stats);
      } catch {
        console.log('Failed to fetch city stats');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchCityData();
  }, [selectedCity]);

  // Navigation actions
  const selectContinent = useCallback((continent: ContinentWithAttractions) => {
    setSelectedContinent(continent);
    setSelectedCountry(null);
    setSelectedCity(null);
    setLevel('continent');
  }, []);

  const selectCountry = useCallback((country: CountryWithAttractions) => {
    setSelectedCountry(country);
    setSelectedCity(null);
    setLevel('country');
  }, []);

  const selectCity = useCallback((city: CityWithAttractions) => {
    setSelectedCity(city);
    setLevel('city');
  }, []);

  const goBack = useCallback(() => {
    if (level === 'city') {
      setSelectedCity(null);
      setLevel('country');
    } else if (level === 'country') {
      setSelectedCountry(null);
      setLevel('continent');
    } else if (level === 'continent') {
      setSelectedContinent(null);
      setLevel('world');
    }
  }, [level]);

  const goToWorld = useCallback(() => {
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSelectedCity(null);
    setLevel('world');
  }, []);

  // Load attractions for a city
  const loadCityAttractions = useCallback(async (cityId: string): Promise<MapAttraction[]> => {
    try {
      const attractions = await locationsApi.getCityAttractions(cityId);

      // Update the map data with attractions
      setMapData(prev => prev.map(continent => ({
        ...continent,
        countries: continent.countries.map(country => ({
          ...country,
          cities: country.cities.map(city =>
            city.id === cityId ? { ...city, attractions } : city
          ),
        })),
      })));

      return attractions;
    } catch (error) {
      console.error('Failed to load city attractions:', error);
      return [];
    }
  }, []);

  return {
    mapData,
    isLoadingMap,
    globalStats,
    level,
    selectedContinent,
    selectedCountry,
    selectedCity,
    userStats,
    continentStats,
    countryStats,
    cityStats,
    isLoadingStats,
    allContinentProgress,
    countryProgressMap,
    cityProgressMap,
    selectContinent,
    selectCountry,
    selectCity,
    goBack,
    goToWorld,
    loadCityAttractions,
  };
}
