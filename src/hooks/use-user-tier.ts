"use client";

import useSWR, { mutate } from "swr";
import { ValidTier, isValidTier } from "@/services/tierServiceServer";
import { SWR_KEYS } from "@/lib/swr-fetchers";

/**
 * Fetcher for user tier API
 */
async function fetchUserTier(url: string): Promise<ValidTier> {
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Failed to fetch tier: ${response.status}`);
    return "free";
  }

  const result = await response.json();

  if (result.success && isValidTier(result.tier)) {
    return result.tier;
  }

  return "free";
}

/**
 * Hook for fetching and caching user tier using SWR
 *
 * Features:
 * - Automatic request deduplication
 * - Built-in caching
 * - No duplicate API calls for same user
 */
export function useUserTier(
  userId: string | null,
  skipFetch = false
) {
  // Use null key to skip fetching when no userId or skipFetch is true
  const shouldFetch = !skipFetch && !!userId;
  const cacheKey = shouldFetch ? SWR_KEYS.USER_TIER(userId!) : null;

  const { data, error, isLoading, isValidating } = useSWR<ValidTier>(
    cacheKey,
    fetchUserTier,
    {
      // Keep tier cached for a while
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      fallbackData: "free" as ValidTier,
    }
  );

  /**
   * Force refresh user tier from server
   */
  const refreshUserTier = async () => {
    if (cacheKey) {
      await mutate(cacheKey);
    }
  };

  return {
    userTier: data ?? ("free" as ValidTier),
    loading: isLoading,
    isValidating,
    error: error ? String(error) : null,
    refreshUserTier,
    isReady: !isLoading && !isValidating,
  };
}

/**
 * Invalidate user tier cache from anywhere
 */
export function invalidateUserTierCache(userId: string) {
  mutate(SWR_KEYS.USER_TIER(userId));
}
