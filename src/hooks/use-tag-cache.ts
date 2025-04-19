import { useEffect, useState } from 'react';
import { TagInfo } from '@/db/operations/tag-operations';
import { searchTagsAction } from '@/app/actions/tags';

let globalTagCache: TagInfo[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTagCache() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      const now = Date.now();
      if (globalTagCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
        setTags(globalTagCache);
        setIsLoading(false);
        return;
      }

      try {
        const fetchedTags = await searchTagsAction('');
        globalTagCache = fetchedTags;
        lastFetchTime = now;
        setTags(fetchedTags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, isLoading };
}