"use client";

import useSWR, { mutate } from "swr";
import { SWR_KEYS } from "@/lib/swr-fetchers";

/**
 * RFC 7807 compliant error from API
 */
interface ApiError {
  success: false;
  error: {
    type: string;
    title: string;
    status: number;
    detail: string;
    code: string;
  };
}

/**
 * Profile data from /api/profiles endpoint
 */
export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  tier: string | null;
  email_address: string | null;
  created_at: string | null;
  updated_at: string | null;
  project_count: number;
  total_favorites: number;
  last_activity_date: string | null;
}

/**
 * Fetcher for profiles API
 * Handles RFC 7807 error responses
 */
async function profilesFetcher(): Promise<Profile[]> {
  const response = await fetch("/api/profiles");
  const result = await response.json();
  
  if (!response.ok) {
    // Handle RFC 7807 error response
    const apiError = result as ApiError;
    throw new Error(apiError.error?.detail || "Failed to fetch profiles");
  }
  
  // Handle RFC 7807 success response format
  if (result.success && result.data) {
    return result.data;
  }
  
  return result;
}

/**
 * Hook for fetching and caching user profiles using SWR
 *
 * Features:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate pattern
 * - Includes project_count and total_favorites from database
 */
export function useProfiles() {
  const { data, error, isLoading, isValidating } = useSWR<Profile[]>(
    SWR_KEYS.PROFILES,
    profilesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes before considering stale
      dedupingInterval: 300000,
    }
  );

  /**
   * Force refresh profiles from server
   */
  const refreshProfiles = async () => {
    await mutate(SWR_KEYS.PROFILES);
  };

  return {
    profiles: data ?? [],
    isLoading,
    isValidating,
    error,
    refreshProfiles,
  };
}

/**
 * Invalidate profiles cache from anywhere
 * Can be called outside of React components
 */
export function invalidateProfilesCache() {
  mutate(SWR_KEYS.PROFILES);
}
