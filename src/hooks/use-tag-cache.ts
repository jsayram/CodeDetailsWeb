import { useEffect, useState, useCallback } from 'react';
import { TagInfo } from '@/db/operations/tag-operations';
import { searchTagsAction } from '@/app/actions/tags';
import { usePathname } from 'next/navigation';

let globalTagCache: TagInfo[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 1000; // 10 seconds

export function useTagCache(invalidateOnPathChange = true) {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const invalidateCache = useCallback(() => {
    globalTagCache = [];
    lastFetchTime = 0;
  }, []);

  const addTagToCache = useCallback((tag: TagInfo) => {
    if (!globalTagCache.some(t => t.id === tag.id)) {
      globalTagCache = [...globalTagCache, tag];
      setTags(globalTagCache);
    }
  }, []);

  const refreshCache = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const now = Date.now();
      if (forceRefresh || globalTagCache.length === 0 || now - lastFetchTime >= CACHE_DURATION) {
        const fetchedTags = await searchTagsAction('');
        globalTagCache = fetchedTags;
        lastFetchTime = now;
        setTags(fetchedTags);
      } else {
        setTags(globalTagCache);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      // On error, invalidate cache to force a fresh fetch next time
      invalidateCache();
    } finally {
      setIsLoading(false);
    }
  }, [invalidateCache]);

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