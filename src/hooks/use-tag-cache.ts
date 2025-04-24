import { useEffect, useState, useCallback } from 'react';
import { TagInfo } from '@/db/operations/tag-operations';
import { searchTagsAction } from '@/app/actions/tags';
import { usePathname } from 'next/navigation';

let globalTagCache: TagInfo[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTagCache(invalidateOnPathChange = true) {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const addTagToCache = useCallback((tag: TagInfo) => {
    if (!globalTagCache.some(t => t.id === tag.id)) {
      globalTagCache = [...globalTagCache, tag];
      setTags(globalTagCache);
    }
  }, []);

  const refreshCache = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTags = await searchTagsAction('');
      globalTagCache = fetchedTags;
      lastFetchTime = Date.now();
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      const now = Date.now();
      // Force refresh if cache is empty or expired
      if (globalTagCache.length === 0 || now - lastFetchTime >= CACHE_DURATION) {
        await refreshCache();
      } else {
        setTags(globalTagCache);
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [refreshCache, invalidateOnPathChange && pathname]); // Only include pathname in deps if invalidateOnPathChange is true

  return { 
    tags, 
    isLoading, 
    addTagToCache,
    refreshCache 
  };
}