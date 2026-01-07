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
 * Filter options for category counts
 */
export interface CategoryCountsFilters {
  userId?: string;
  favorites?: boolean;
  deleted?: boolean;
}

/**
 * Build URL with query params for category counts API
 */
function buildCategoryCountsUrl(filters?: CategoryCountsFilters): string {
  const baseUrl = "/api/categories/counts";
  if (!filters) return baseUrl;

  const params = new URLSearchParams();
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.favorites) params.append("favorites", "true");
  if (filters.deleted) params.append("deleted", "true");

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build SWR cache key for category counts with filters
 */
function buildCacheKey(filters?: CategoryCountsFilters): string {
  if (!filters || (!filters.userId && !filters.favorites && !filters.deleted)) {
    return SWR_KEYS.CATEGORY_COUNTS;
  }
  return `${SWR_KEYS.CATEGORY_COUNTS}:${JSON.stringify(filters)}`;
}

/**
 * Fetcher for category counts API
 * Handles RFC 7807 error responses
 */
async function categoryCountsFetcher(url: string): Promise<Record<string, number>> {
  const response = await fetch(url);
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
 * - Supports filtering by userId, favorites, deleted
 * 
 * @param filters - Optional filters for context-aware counts
 *   - No filters: Global community counts (all non-deleted projects)
 *   - userId only: User's own projects (My Projects view)
 *   - userId + favorites: User's favorited projects
 *   - userId + deleted: User's deleted projects
 */
export function useCategoryCounts(filters?: CategoryCountsFilters) {
  const url = buildCategoryCountsUrl(filters);
  const cacheKey = buildCacheKey(filters);

  const { data, error, isLoading, isValidating } = useSWR<Record<string, number>>(
    cacheKey,
    () => categoryCountsFetcher(url),
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
    await mutate(cacheKey);
  };

  /**
   * Check if a category has projects in the current context
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
 * Invalidate category counts cache from anywhere
 * Can be called outside of React components
 */
export function invalidateCategoryCountsCache(filters?: CategoryCountsFilters) {
  const cacheKey = buildCacheKey(filters);
  mutate(cacheKey);
}

/**
 * Invalidate all category counts caches (global + filtered)
 */
export function invalidateAllCategoryCountsCaches() {
  // Invalidate the base key and any filtered variants
  mutate((key) => typeof key === "string" && key.startsWith(SWR_KEYS.CATEGORY_COUNTS));
}
