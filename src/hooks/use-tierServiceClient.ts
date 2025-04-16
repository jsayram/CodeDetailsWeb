"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidTier, isValidTier } from "@/services/tierServiceServer";
import { getUserTier as fetchUserTierAction } from "@/app/actions/user-tier";
import {
  loadCachedUserTier,
  cacheUserTier,
  isUserTierRequestInProgress,
  setUserTierRequestInProgress,
  USER_TIER_FETCH_DEBOUNCE,
} from "@/lib/ProjectsCacheUtils";

// Return type for hook
type UserTierResult = {
  userTier: ValidTier;
  loading: boolean;
  error: string | null;
  refreshUserTier: () => Promise<void>;
  isReady: boolean; // Add a ready state that indicates tier is properly loaded
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
  const [isReady, setIsReady] = useState(false); // Track when tier info is ready
  const hasFetched = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isBrowser = typeof window !== "undefined";

  // Check cached data and update state accordingly
  const checkCachedTier = useCallback(
    (userId: string | null) => {
      // Clear any existing fetching timeouts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      // Reset the fetch state when user changes
      hasFetched.current = false;
      setUserTierRequestInProgress(false);

      if (!userId) {
        setUserTier("free");
        setIsReady(true); // Mark as ready with default tier
        return false;
      }

      // Check if we have a cached tier for this user
      const cachedTier = loadCachedUserTier(isBrowser, userId);
      if (cachedTier) {
        console.log(`🎫 Found cached tier for user ${userId}: ${cachedTier}`);
        setUserTier(cachedTier);
        hasFetched.current = true;
        setIsReady(true); // Mark as ready since we have valid tier info
        return true; // Cache hit
      }

      return false; // No valid cache found
    },
    [isBrowser]
  );

  // Reset and check cache when user changes
  useEffect(() => {
    checkCachedTier(userId);
  }, [userId, checkCachedTier]);

  const fetchUserTier = useCallback(async () => {
    // Skip if explicitly requested to do so
    if (skipFetch) {
      console.log("🎫 Skipping tier fetch as requested");
      setLoading(false);
      return;
    }

    // Skip if no user ID or if a request is already in progress
    if (!userId || isUserTierRequestInProgress()) {
      setLoading(false);
      return;
    }

    // Check cache first - this avoids unnecessary fetches
    if (checkCachedTier(userId)) {
      return; // Use cached data if available
    }

    // Set flag to prevent concurrent requests for the same data
    setUserTierRequestInProgress(true);
    setLoading(true);
    setError(null);

    console.log(`🎫 Fetching tier for user ${userId}...`);

    try {
      // Use server action instead of RPC call
      const data = await fetchUserTierAction(userId);

      if (isValidTier(data)) {
        console.log(`🎫 User tier from database: ${data}`);
        setUserTier(data as ValidTier);

        // Cache the result
        cacheUserTier(data as ValidTier, isBrowser, userId);
        setIsReady(true); // Mark as ready once we have the tier
      } else {
        console.warn(
          `Invalid tier value: ${data || "none"}, defaulting to 'free'`
        );
        setUserTier("free");
        setIsReady(true); // Still mark as ready with default tier
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch user tier:", errorMessage);
      setError(`Failed to fetch tier: ${errorMessage}`);
      setUserTier("free");
      setIsReady(true); // Mark as ready even on error, with default tier
    } finally {
      setLoading(false);
      hasFetched.current = true;
      setUserTierRequestInProgress(false);
    }
  }, [userId, skipFetch, checkCachedTier, isBrowser]);

  // Fetch on mount or user change, but only if not already fetched
  useEffect(() => {
    if (!userId || hasFetched.current || isUserTierRequestInProgress()) {
      return; // Skip if no user ID, already fetched, or in progress
    }

    // Add debouncing to prevent multiple calls in rapid succession
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchUserTier();
    }, USER_TIER_FETCH_DEBOUNCE);

    // Clean up timeout
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [fetchUserTier, userId]);

  return { userTier, loading, error, refreshUserTier: fetchUserTier, isReady };
}
