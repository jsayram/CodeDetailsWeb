'use server';

import { getUserDashboardStats } from "@/db/operations/userDashboardOperations";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from 'next/cache';

// Cache user dashboard stats for 2 minutes
export const getCachedUserDashboardStats = unstable_cache(
  async (userId: string) => getUserDashboardStats(userId),
  ['user-dashboard-stats'],
  {
    revalidate: 120, // 2 minutes
    tags: ['user-dashboard']
  }
);

export async function fetchUserDashboardData() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  const stats = await getCachedUserDashboardStats(userId);

  return {
    stats,
    userId,
  };
}
