"use client";

import useSWR, { mutate } from "swr";
import { SWR_KEYS } from "@/lib/swr-fetchers";
import { API_ROUTES } from "@/constants/api-routes";

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
 * Fetcher for user category counts API
 * Handles RFC 7807 error responses
 */
async function userCategoryCountsFetcher(username: string): Promise<Record<string, number>> {
  const response = await fetch(API_ROUTES.PROJECTS.SHARED_CATEGORIES(username));
  const result = await response.json();

  if (!response.ok) {
    // Handle RFC 7807 error response
    const apiError = result as ApiError;
    throw new Error(apiError.error?.detail || "Failed to fetch user category counts");
  }

  // Handle RFC 7807 success response format
  if (result.success && result.data) {
    return result.data;
  }

  return result;
}

/**
 * Hook for fetching and caching user-specific category counts using SWR
 *
 * Features:
 * - Automatic caching and deduplication per username
 * - Stale-while-revalidate pattern
 * - Returns accurate counts from database (not from filtered projects)
 * - Used by SharedProjectsGrid to properly enable/disable category options
 */
export function useUserCategoryCounts(username: string) {
  const { data, error, isLoading, isValidating } = useSWR<Record<string, number>>(
    username ? SWR_KEYS.USER_CATEGORY_COUNTS(username) : null,
    () => userCategoryCountsFetcher(username),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes before considering stale
      dedupingInterval: 300000,
    }
  );

  /**
   * Force refresh user category counts from server
   */
  const refreshCounts = async () => {
    if (username) {
      await mutate(SWR_KEYS.USER_CATEGORY_COUNTS(username));
    }
  };

  /**
   * Check if a category has projects for this user
   */
  const hasCategoryProjects = (categoryKey: string): boolean => {
    if (!data) return false;
    return (data[categoryKey] ?? 0) > 0;
  };

  return {
    categoryCounts: data ?? {},
    isLoading,
    isValidating,
    error,
    refreshCounts,
    hasCategoryProjects,
  };
}

/**
 * Invalidate user category counts cache from anywhere
 * Can be called outside of React components
 */
export function invalidateUserCategoryCountsCache(username: string) {
  mutate(SWR_KEYS.USER_CATEGORY_COUNTS(username));
}
