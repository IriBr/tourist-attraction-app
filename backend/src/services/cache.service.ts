import { Redis } from 'ioredis';

// Cache TTL values in seconds
const TTL = {
  CONTINENTS: 3600,      // 1 hour - rarely changes
  COUNTRIES: 3600,       // 1 hour - rarely changes
  CITIES: 1800,          // 30 minutes - occasionally changes
  MAP_DATA: 1800,        // 30 minutes - full map hierarchy
  STATS: 300,            // 5 minutes - aggregated stats
};

const CACHE_KEYS = {
  CONTINENTS: 'locations:continents',
  COUNTRIES: 'locations:countries',
  CITIES: 'locations:cities',
  MAP_DATA: 'locations:map-data',
  STATS: 'locations:stats',
  CONTINENT: (id: string) => `locations:continent:${id}`,
  COUNTRY: (id: string) => `locations:country:${id}`,
  CITY: (id: string) => `locations:city:${id}`,
};

class CacheService {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('[Cache] REDIS_URL not configured, caching disabled');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Cache] Connected to Redis');
      });

      this.client.on('error', (err: Error) => {
        console.error('[Cache] Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('[Cache] Redis connection closed');
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      console.log('[Cache] Redis connection verified');
    } catch (error) {
      console.error('[Cache] Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  private async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Cache] Error getting ${key}:`, error);
      return null;
    }
  }

  private async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`[Cache] Error setting ${key}:`, error);
    }
  }

  private async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting ${key}:`, error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  }

  // ============ LOCATION CACHE METHODS ============

  async getContinents<T>(): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.CONTINENTS);
  }

  async setContinents(data: any): Promise<void> {
    await this.set(CACHE_KEYS.CONTINENTS, data, TTL.CONTINENTS);
  }

  async getCountries<T>(): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.COUNTRIES);
  }

  async setCountries(data: any): Promise<void> {
    await this.set(CACHE_KEYS.COUNTRIES, data, TTL.COUNTRIES);
  }

  async getCities<T>(): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.CITIES);
  }

  async setCities(data: any): Promise<void> {
    await this.set(CACHE_KEYS.CITIES, data, TTL.CITIES);
  }

  async getMapData<T>(): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.MAP_DATA);
  }

  async setMapData(data: any): Promise<void> {
    await this.set(CACHE_KEYS.MAP_DATA, data, TTL.MAP_DATA);
  }

  async getStats<T>(): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.STATS);
  }

  async setStats(data: any): Promise<void> {
    await this.set(CACHE_KEYS.STATS, data, TTL.STATS);
  }

  async getContinent<T>(id: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.CONTINENT(id));
  }

  async setContinent(id: string, data: any): Promise<void> {
    await this.set(CACHE_KEYS.CONTINENT(id), data, TTL.CONTINENTS);
  }

  async getCountry<T>(id: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.COUNTRY(id));
  }

  async setCountry(id: string, data: any): Promise<void> {
    await this.set(CACHE_KEYS.COUNTRY(id), data, TTL.COUNTRIES);
  }

  async getCity<T>(id: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.CITY(id));
  }

  async setCity(id: string, data: any): Promise<void> {
    await this.set(CACHE_KEYS.CITY(id), data, TTL.CITIES);
  }

  // ============ CACHE INVALIDATION ============

  async invalidateLocations(): Promise<void> {
    await this.delByPattern('locations:*');
    console.log('[Cache] Invalidated all location caches');
  }

  async invalidateContinent(id: string): Promise<void> {
    await Promise.all([
      this.del(CACHE_KEYS.CONTINENT(id)),
      this.del(CACHE_KEYS.CONTINENTS),
      this.del(CACHE_KEYS.MAP_DATA),
    ]);
  }

  async invalidateCountry(id: string): Promise<void> {
    await Promise.all([
      this.del(CACHE_KEYS.COUNTRY(id)),
      this.del(CACHE_KEYS.COUNTRIES),
      this.del(CACHE_KEYS.MAP_DATA),
    ]);
  }

  async invalidateCity(id: string): Promise<void> {
    await Promise.all([
      this.del(CACHE_KEYS.CITY(id)),
      this.del(CACHE_KEYS.CITIES),
      this.del(CACHE_KEYS.MAP_DATA),
    ]);
  }
}

export const cacheService = new CacheService();
