"use client";

import useSWR from "swr";
import { fetchUserDashboardData } from "@/app/actions/user-dashboard";
import { SWR_KEYS } from "@/lib/swr-fetchers";
import { UserDashboardStats } from "@/db/operations/userDashboardOperations";

interface DashboardData {
  stats: UserDashboardStats;
  userId: string;
}

/**
 * Hook for fetching and caching user dashboard stats using SWR
 *
 * Features:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate pattern
 * - Simple refresh() API for manual revalidation
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    SWR_KEYS.DASHBOARD_STATS,
    () => fetchUserDashboardData(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Keep data fresh for 2 minutes (matches server cache TTL)
      dedupingInterval: 120000,
    }
  );

  /**
   * Force refresh dashboard data from server
   * SWR handles cache clearing automatically
   */
  const refresh = async () => {
    await mutate();
  };

  return {
    data,
    loading: isLoading,
    error,
    refresh,
  };
}
