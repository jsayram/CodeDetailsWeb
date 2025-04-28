import { useEffect, useState, useCallback } from 'react';
import { TagInfo } from '@/db/operations/tag-operations';
import { searchTagsAction } from '@/app/actions/tags';
import { usePathname } from 'next/navigation';

// Cache structure with expiration
interface CacheEntry {
  data: TagInfo[];
  timestamp: number;
  visited: boolean;
}

interface TagCache {
  [key: string]: CacheEntry;
}

let globalTagCache: TagCache = {};
const CACHE_DURATION = 60 * 1000; // 1 minute cache duration

export function useTagCache(invalidateOnPathChange = true) {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const invalidateCache = useCallback(() => {
    globalTagCache = {};
  }, []);

  const addTagToCache = useCallback((tag: TagInfo) => {
    const cacheKey = '';  // Empty key for global tag list
    const existingEntry = globalTagCache[cacheKey];
    if (!existingEntry?.data.some(t => t.id === tag.id)) {
      const updatedTags = existingEntry ? [...existingEntry.data, tag] : [tag];
      globalTagCache[cacheKey] = {
        data: updatedTags,
        timestamp: Date.now(),
        visited: true
      };
      setTags(updatedTags);
    }
  }, []);

  const refreshCache = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const cacheKey = '';  // Empty key for global tag list
      const now = Date.now();
      const cached = globalTagCache[cacheKey];

      if (forceRefresh || 
          !cached || 
          now - cached.timestamp >= CACHE_DURATION) {
        const fetchedTags = await searchTagsAction('');
        globalTagCache[cacheKey] = {
          data: fetchedTags,
          timestamp: now,
          visited: true
        };
        setTags(fetchedTags);
      } else {
        setTags(cached.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      invalidateCache();
    } finally {
      setIsLoading(false);
    }
  }, [invalidateCache]);

  // Refresh cache when component mounts or path changes (if enabled)
  useEffect(() => {
    refreshCache();
  }, [refreshCache, invalidateOnPathChange && pathname]);

  return {
    tags,
    isLoading,
    addTagToCache,
    refreshCache,
    invalidateCache
  };
}