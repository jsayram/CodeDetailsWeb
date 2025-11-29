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
 * Fetcher for category counts API
 * Handles RFC 7807 error responses
 */
async function categoryCountsFetcher(): Promise<Record<string, number>> {
  const response = await fetch("/api/categories/counts");
  const result = await response.json();
  
  if (!response.ok) {
    // Handle RFC 7807 error response
    const apiError = result as ApiError;
    throw new Error(apiError.error?.detail || "Failed to fetch category counts");
  }
  
  // Handle RFC 7807 success response format
  if (result.success && result.data) {
    return result.data;
  }
  
  return result;
}

/**
 * Hook for fetching and caching category counts using SWR
 *
 * Features:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate pattern
 * - Returns accurate counts from database (not from paginated projects)
 */
export function useCategoryCounts() {
  const { data, error, isLoading, isValidating } = useSWR<Record<string, number>>(
    SWR_KEYS.CATEGORY_COUNTS,
    categoryCountsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes before considering stale
      dedupingInterval: 300000,
    }
  );

  /**
   * Force refresh category counts from server
   */
  const refreshCounts = async () => {
    await mutate(SWR_KEYS.CATEGORY_COUNTS);
  };

  return {
    categoryCounts: data ?? {},
    isLoading,
    isValidating,
    error,
    refreshCounts,
  };
}

/**
 * Invalidate category counts cache from anywhere
 * Can be called outside of React components
 */
export function invalidateCategoryCountsCache() {
  mutate(SWR_KEYS.CATEGORY_COUNTS);
}
