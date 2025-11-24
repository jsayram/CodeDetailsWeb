import { useState, useEffect } from "react";

const CACHE_KEY_PREFIX = "dashboard_cache_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export function useDashboardCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
        
        // Try to load from cache first
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const { data: cachedData, timestamp }: CacheData<T> = JSON.parse(cached);
              const age = Date.now() - timestamp;
              
              if (age < CACHE_DURATION) {
                // Cache is still valid, use it
                if (mounted) {
                  setData(cachedData);
                  setLoading(false);
                }
                
                // Still fetch fresh data in background
                fetchAndCache();
                return;
              }
            } catch (e) {
              // Invalid cache, remove it
              localStorage.removeItem(cacheKey);
            }
          }
        }

        // No valid cache, fetch fresh data
        await fetchAndCache();
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    async function fetchAndCache() {
      try {
        const freshData = await fetchFn();
        
        if (mounted) {
          setData(freshData);
          setLoading(false);
          
          // Cache the data
          if (typeof window !== "undefined") {
            const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
            const cacheData: CacheData<T> = {
              data: freshData,
              timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      
      // Update cache
      if (typeof window !== "undefined") {
        const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
        const cacheData: CacheData<T> = {
          data: freshData,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    if (typeof window !== "undefined") {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
    }
  };

  return { data, loading, error, refresh, clearCache };
}
