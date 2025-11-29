"use client";

import useSWR, { mutate } from "swr";
import { TagInfo } from "@/db/operations/tag-operations";
import { tagsFetcher, SWR_KEYS } from "@/lib/swr-fetchers";

/**
 * Hook for fetching and caching tags using SWR
 * 
 * Features:
 * - Automatic caching and deduplication
 * - LRU cache with memory management
 * - Stale-while-revalidate pattern
 * - Call refreshTags() after mutations (approval, submission, deletion)
 */
export function useTags() {
  const { data, error, isLoading, isValidating } = useSWR<TagInfo[]>(
    SWR_KEYS.TAGS,
    tagsFetcher,
    {
      // Keep data fresh but don't refetch too often
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes before considering stale
      dedupingInterval: 300000,
    }
  );

  /**
   * Force refresh tags from server
   * Call after tag approval, submission, or deletion
   */
  const refreshTags = async () => {
    await mutate(SWR_KEYS.TAGS);
  };

  /**
   * Add a tag optimistically to the cache
   * Useful for immediate UI feedback before server confirms
   */
  const addTagToCache = (tag: TagInfo) => {
    mutate(
      SWR_KEYS.TAGS,
      (currentTags: TagInfo[] | undefined) => {
        if (!currentTags) return [tag];
        if (currentTags.some((t) => t.id === tag.id)) return currentTags;
        return [...currentTags, tag];
      },
      { revalidate: false }
    );
  };

  /**
   * Invalidate the tags cache
   * Forces a fresh fetch on next access
   */
  const invalidateCache = () => {
    mutate(SWR_KEYS.TAGS, undefined, { revalidate: true });
  };

  return {
    tags: data ?? [],
    isLoading,
    isValidating,
    error,
    refreshTags,
    addTagToCache,
    invalidateCache,
    // Alias for refreshTags for consistency
    refreshCache: refreshTags,
  };
}

/**
 * Invalidate tags cache from anywhere (e.g., server actions)
 * Can be called outside of React components
 */
export function invalidateTagsCache() {
  mutate(SWR_KEYS.TAGS);
}
