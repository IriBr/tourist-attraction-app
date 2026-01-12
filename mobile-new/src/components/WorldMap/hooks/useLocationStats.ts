import { useState, useEffect } from 'react';
import { visitsApi, LocationStats } from '../../../api';

interface UseLocationStatsOptions {
  type: 'continent' | 'country' | 'city';
  name: string | null;
  enabled?: boolean;
}

export function useLocationStats({ type, name, enabled = true }: UseLocationStatsOptions) {
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!name || !enabled) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let result: LocationStats;
        switch (type) {
          case 'continent':
            result = await visitsApi.getContinentStats(name);
            break;
          case 'country':
            result = await visitsApi.getCountryStats(name);
            break;
          case 'city':
            result = await visitsApi.getCityStats(name);
            break;
        }
        setStats(result);
      } catch (err) {
        console.log(`Failed to fetch ${type} stats:`, err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [type, name, enabled]);

  return { stats, isLoading, error };
}
