"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// Define valid tier types
export type ValidTier = "free" | "pro" | "diamond";

// Define tier levels
const TIER_LEVELS: Record<ValidTier, number> = {
  free: 0,
  pro: 1,
  diamond: 2,
};

// Helper functions
export function isValidTier(tier: string): boolean {
  return tier in TIER_LEVELS;
}

export function canAccessTier(userTier: string, contentTier: string): boolean {
  const userLevel =
    TIER_LEVELS[isValidTier(userTier) ? (userTier as ValidTier) : "free"];
  const contentLevel =
    TIER_LEVELS[isValidTier(contentTier) ? (contentTier as ValidTier) : "free"];
  return userLevel >= contentLevel;
}

export function getAccessibleTiers(userTier: string): string[] {
  const userLevel =
    TIER_LEVELS[isValidTier(userTier) ? (userTier as ValidTier) : "free"];
  return Object.entries(TIER_LEVELS)
    .filter(([, level]) => level <= userLevel)
    .map(([tier]) => tier);
}

// Export the tier hierarchy
export const TIER_HIERARCHY = TIER_LEVELS;

// Return type for hook
type UserTierResult = {
  userTier: ValidTier;
  loading: boolean;
  error: string | null;
  refreshUserTier: () => Promise<void>;
};

// In-memory cache for user tiers to prevent redundant fetches across the app
const userTierCache: Record<string, {tier: ValidTier, timestamp: number}> = {};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes in milliseconds

/**
 * Hook that fetches a user's subscription tier from Supabase
 */
export function useUserTier(
  client: SupabaseClient | null,
  userId: string | null,
  skipFetch = false
): UserTierResult {
  const [userTier, setUserTier] = useState<ValidTier>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const requestInProgress = useRef(false);

  // Reset when user changes
  useEffect(() => {
    hasFetched.current = false;
    requestInProgress.current = false;
    
    // Check if we have a cached tier for this user
    if (userId && userTierCache[userId]) {
      const cachedData = userTierCache[userId];
      const now = Date.now();
      
      // Use cached tier if it's still valid
      if (now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`🎫 Using cached tier for user ${userId}: ${cachedData.tier}`);
        setUserTier(cachedData.tier);
        hasFetched.current = true;
        return;
      } else {
        // Clear expired cache
        console.log(`🎫 Cached tier for user ${userId} expired, will refetch`);
        delete userTierCache[userId];
      }
    }
    
    setUserTier("free");
  }, [userId]);

  const fetchUserTier = useCallback(async () => {
    // Skip if explicitly requested to do so
    if (skipFetch) {
      console.log("🎫 Skipping tier fetch as requested");
      setLoading(false);
      return;
    }
    
    // Skip if we don't have necessary data or a request is already in progress
    if (!client || !userId || requestInProgress.current) {
      setLoading(false);
      return;
    }
    
    // Skip if we already have a cached tier for this user
    if (userId && userTierCache[userId]) {
      const cachedData = userTierCache[userId];
      const now = Date.now();
      
      if (now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`🎫 Using cached tier instead of fetching: ${cachedData.tier}`);
        setUserTier(cachedData.tier);
        setLoading(false);
        hasFetched.current = true;
        return;
      }
    }

    // Set flag to prevent concurrent requests for the same data
    requestInProgress.current = true;
    setLoading(true);
    setError(null);
    
    console.log(`🎫 Fetching tier for user ${userId}...`);

    try {
      const { data, error } = await client.rpc("get_user_tier", {
        user_id_param: userId,
      });

      if (error) {
        console.error("Error fetching user tier:", error);
        setError(`Error fetching tier: ${error.message}`);
        return;
      }

      if (isValidTier(data)) {
        console.log(`🎫 User tier from database: ${data}`);
        setUserTier(data as ValidTier);
        
        // Cache the result
        userTierCache[userId] = {
          tier: data as ValidTier,
          timestamp: Date.now()
        };
      } else {
        console.warn(
          `Invalid tier value: ${data || "none"}, defaulting to 'free'`
        );
        setUserTier("free");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch user tier:", errorMessage);
      setError(`Failed to fetch tier: ${errorMessage}`);
      setUserTier("free");
    } finally {
      setLoading(false);
      hasFetched.current = true;
      requestInProgress.current = false;
    }
  }, [client, userId, skipFetch]);

  // Fetch on mount or user change, but only if not already fetched
  useEffect(() => {
    if (userId && !hasFetched.current && !requestInProgress.current) {
      fetchUserTier();
    }
  }, [fetchUserTier, userId]);

  return { userTier, loading, error, refreshUserTier: fetchUserTier };
}
