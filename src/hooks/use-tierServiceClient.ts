"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidTier, isValidTier } from "@/services/tierServiceServer";
import { fetchCachedUserTier } from "@/lib/ProjectsCacheUtils";

// Return type for hook
type UserTierResult = {
  userTier: ValidTier;
  loading: boolean;
  error: string | null;
  refreshUserTier: () => Promise<void>;
  isReady: boolean;
};

// Global fetching state to prevent duplicate calls across all hook instances
const globalFetchingState = new Map<string, Promise<ValidTier>>();

/**
 * Hook that fetches a user's subscription tier
 */
export function useUserTier(
  client: SupabaseClient | null,
  userId: string | null,
  skipFetch = false
): UserTierResult {
  const [userTier, setUserTier] = useState<ValidTier>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasFetched = useRef(false);

  const fetchUserTier = useCallback(async () => {
    // Skip if explicitly requested to do so
    if (skipFetch || !userId) {
      setLoading(false);
      return;
    }

    const cacheKey = `tier-${userId}`;

    // Check if there's already a fetch in progress for this user
    if (globalFetchingState.has(cacheKey)) {
      console.log(`🎫 ⏭️ Skipping duplicate tier fetch for user ${userId}`);
      setLoading(true);
      try {
        const tier = await globalFetchingState.get(cacheKey)!;
        setUserTier(tier);
        setIsReady(true);
        hasFetched.current = true;
      } catch (err) {
        setUserTier("free");
        setIsReady(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Create a promise for this fetch and store it globally
    const fetchPromise = (async () => {
      console.log(`🎫 Fetching tier for user ${userId}...`);
      const result = await fetchCachedUserTier(userId);

      // Clean up the global state after fetch completes
      globalFetchingState.delete(cacheKey);

      if (!result.success) {
        console.error("Failed to fetch user tier:", result.error);
        return "free" as ValidTier;
      }

      if (isValidTier(result.data)) {
        console.log(`🎫 User tier fetched: ${result.data}`);
        return result.data;
      } else {
        console.warn(
          `Invalid tier value: ${result.data || "none"}, defaulting to 'free'`
        );
        return "free" as ValidTier;
      }
    })();

    globalFetchingState.set(cacheKey, fetchPromise);

    const tier = await fetchPromise;
    setUserTier(tier);
    setIsReady(true);
    hasFetched.current = true;
    setLoading(false);
  }, [userId, skipFetch]);

  // Fetch on mount or user change
  useEffect(() => {
    if (!userId || hasFetched.current) {
      if (!userId) {
        setUserTier("free");
        setIsReady(true);
      }
      return;
    }

    fetchUserTier();
  }, [userId, fetchUserTier]);

  return {
    userTier,
    loading,
    error,
    refreshUserTier: fetchUserTier,
    isReady,
  };
}
