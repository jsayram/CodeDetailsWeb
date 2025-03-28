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
    .filter(([_, level]) => level <= userLevel)
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

/**
 * Hook that fetches a user's subscription tier from Supabase
 */
export function useUserTier(
  client: SupabaseClient | null,
  userId: string | null
): UserTierResult {
  const [userTier, setUserTier] = useState<ValidTier>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Reset when user changes
  useEffect(() => {
    hasFetched.current = false;
    setUserTier("free");
  }, [userId]);

  const fetchUserTier = useCallback(async () => {
    if (!client || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
        console.log(`User tier from database: ${data}`);
        setUserTier(data as ValidTier);
      } else {
        console.warn(
          `Invalid tier value: ${data || "none"}, defaulting to 'free'`
        );
        setUserTier("free");
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch user tier:", errorMessage);
      setError(`Failed to fetch tier: ${errorMessage}`);
      setUserTier("free");
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, [client, userId]);

  // Fetch on mount or user change
  useEffect(() => {
    if (userId && !hasFetched.current) {
      fetchUserTier();
    }
  }, [fetchUserTier, userId]);

  return { userTier, loading, error, refreshUserTier: fetchUserTier };
}
