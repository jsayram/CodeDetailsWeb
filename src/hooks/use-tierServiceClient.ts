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
  const isFetching = useRef(false);

  const fetchUserTier = useCallback(async () => {
    // Skip if explicitly requested to do so
    if (skipFetch || !userId || isFetching.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    isFetching.current = true;

    try {
      const data = await fetchCachedUserTier(userId);

      if (isValidTier(data)) {
        console.log(`🎫 User tier fetched: ${data}`);
        setUserTier(data);
      } else {
        console.warn(
          `Invalid tier value: ${data || "none"}, defaulting to 'free'`
        );
        setUserTier("free");
      }

      setIsReady(true);
      hasFetched.current = true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch user tier:", errorMessage);
      setError(`Failed to fetch tier: ${errorMessage}`);
      setUserTier("free");
      setIsReady(true);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
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
