import { useEffect, useState, useCallback, useRef } from 'react';
import { TagInfo } from '@/db/operations/tag-operations';
import { searchTagsAction } from '@/app/actions/tags';

// Cache structure - no expiration, invalidate only on mutations
interface CacheEntry {
  data: TagInfo[];
  timestamp: number;
}

let globalTagCache: CacheEntry | null = null;

// Export function to invalidate cache from server actions
// Call this after tag approval, submission, or deletion
export function invalidateGlobalTagCache() {
  globalTagCache = null;
}

export function useTagCache() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const invalidateCache = useCallback(() => {
    globalTagCache = null;
    hasFetchedRef.current = false;
  }, []);

  const addTagToCache = useCallback((tag: TagInfo) => {
    if (globalTagCache && !globalTagCache.data.some(t => t.id === tag.id)) {
      const updatedTags = [...globalTagCache.data, tag];
      globalTagCache = {
        data: updatedTags,
        timestamp: Date.now(),
      };
      setTags(updatedTags);
    }
  }, []);

  // Force refresh - call this after tag mutations (approval, submission, deletion)
  const refreshCache = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Only fetch if forced or no cache exists
      if (forceRefresh || !globalTagCache) {
        const fetchedTags = await searchTagsAction('');
        globalTagCache = {
          data: fetchedTags,
          timestamp: Date.now(),
        };
        setTags(fetchedTags);
      } else {
        // Use cached data
        setTags(globalTagCache.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      invalidateCache();
    } finally {
      setIsLoading(false);
    }
  }, [invalidateCache]);

  // Only fetch once on mount if cache is empty
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshCache(false);
    }
  }, [refreshCache]);

  return {
    tags,
    isLoading,
    addTagToCache,
    refreshCache,
    invalidateCache
  };
}