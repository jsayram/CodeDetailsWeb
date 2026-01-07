'use server';

import { getDashboardStats } from "@/db/operations/dashboardOperations";
import { getPendingTagSubmissions } from "./tag-submissions";
import { unstable_cache } from 'next/cache';

// Cache general dashboard stats for 3 minutes
export const getCachedDashboardStats = unstable_cache(
  async () => getDashboardStats(),
  ['dashboard-stats'],
  {
    revalidate: 180, // 3 minutes
    tags: ['dashboard']
  }
);

// Cache tag submissions for 1 minute (more frequently changing)
export const getCachedTagSubmissions = unstable_cache(
  async () => getPendingTagSubmissions(),
  ['dashboard-tag-submissions'],
  {
    revalidate: 60, // 1 minute
    tags: ['dashboard', 'tag-submissions']
  }
);

export async function fetchDashboardData() {
  const [submissions, stats] = await Promise.all([
    getCachedTagSubmissions(),
    getCachedDashboardStats(),
  ]);

  return {
    submissions,
    stats
  };
}