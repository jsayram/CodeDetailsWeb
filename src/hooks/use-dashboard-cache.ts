import { useState, useEffect } from "react";

const CACHE_KEY_PREFIX = "dashboard_cache_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export function useDashboardCache<T>(
  key: string,
  fetchFn: (forceRefresh?: boolean) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let mounted = true;
    let fetchController: AbortController | null = null;

    async function loadData() {
      console.log(`[useDashboardCache] 🎬 loadData called for "${key}" (mounted: ${mounted}, isFetching: ${isFetching})`);
      
      // Prevent duplicate fetches
      if (isFetching) {
        console.log(`[useDashboardCache] ⏭️ Skipping duplicate fetch for "${key}" - already fetching`);
        return;
      }

      try {
        setIsFetching(true);
        fetchController = new AbortController();
        const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
        let hasValidCache = false;
        
        // Try to load from cache first
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const { data: cachedData, timestamp }: CacheData<T> = JSON.parse(cached);
              const age = Date.now() - timestamp;
              
              if (age < CACHE_DURATION) {
                // Cache is still valid, use it immediately
                hasValidCache = true;
                console.log(`[useDashboardCache] ✅ Using cached data for "${key}" (age: ${Math.round(age / 1000)}s) - NO SERVER CALL NEEDED`);
                if (mounted) {
                  setData(cachedData);
                  setLoading(false);
                }
                
                // Still fetch fresh data in background
                console.log(`[useDashboardCache] 🔄 Fetching fresh data in background for "${key}"`);
                await fetchAndCache(false);
                return;
              } else {
                console.log(`[useDashboardCache] ⏰ Cache expired for "${key}" (age: ${Math.round(age / 1000)}s, max: ${CACHE_DURATION / 1000}s)`);
              }
            } catch (e) {
              // Invalid cache, remove it
              console.log(`[useDashboardCache] ❌ Invalid cache for "${key}", removing`);
              localStorage.removeItem(cacheKey);
            }
          } else {
            console.log(`[useDashboardCache] 📭 No cache found for "${key}"`);
          }
        }

        // No valid cache, show loading state and fetch fresh data
        if (!hasValidCache && mounted) {
          setLoading(true);
        }
        console.log(`[useDashboardCache] 🔍 Fetching fresh data for "${key}"`);
        await fetchAndCache(false);
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setIsFetching(false);
        }
        fetchController = null;
      }
    }

    async function fetchAndCache(forceRefresh: boolean) {
      try {
        console.log(`[useDashboardCache] 🌐 Fetching from server for "${key}" (forceRefresh: ${forceRefresh})`);
        const freshData = await fetchFn(forceRefresh);
        
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
            console.log(`[useDashboardCache] 💾 Data cached for "${key}"`);
          }
        }
      } catch (err) {
        console.error(`[useDashboardCache] ⚠️ Error fetching data for "${key}":`, err);
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (fetchController) {
        fetchController.abort();
      }
    };
  }, dependencies);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    
    console.log(`[useDashboardCache] 🔄 Manual refresh triggered for "${key}"`);
    
    try {
      const freshData = await fetchFn(true); // Force refresh on server
      setData(freshData);
      
      // Update cache
      if (typeof window !== "undefined") {
        const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
        const cacheData: CacheData<T> = {
          data: freshData,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`[useDashboardCache] ✅ Manual refresh complete for "${key}"`);
      }
    } catch (err) {
      console.error(`[useDashboardCache] ⚠️ Manual refresh failed for "${key}":`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    if (typeof window !== "undefined") {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
      console.log(`[useDashboardCache] 🗑️ Cache cleared for "${key}"`);
    }
  };

  return { data, loading, error, refresh, clearCache };
}
