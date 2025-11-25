'use server';

import { getUserDashboardStats } from "@/db/operations/userDashboardOperations";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache, revalidateTag } from 'next/cache';

// Cache user dashboard stats for 2 minutes
export const getCachedUserDashboardStats = unstable_cache(
  async (userId: string) => {
    console.log('[getCachedUserDashboardStats] 🗄️ Querying database for user:', userId);
    const result = await getUserDashboardStats(userId);
    console.log('[getCachedUserDashboardStats] ✅ Database query complete');
    return result;
  },
  ['user-dashboard-stats'],
  {
    revalidate: 120, // 2 minutes
    tags: ['user-dashboard']
  }
);

export async function fetchUserDashboardData(forceRefresh = false) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  // If force refresh is requested, revalidate the cache first
  if (forceRefresh) {
    console.log('[fetchUserDashboardData] 🔄 Force refresh - revalidating server cache');
    revalidateTag('user-dashboard');
  } else {
    console.log('[fetchUserDashboardData] 📦 Checking Next.js server cache...');
  }

  const stats = await getCachedUserDashboardStats(userId);
  console.log('[fetchUserDashboardData] ✅ Data returned from server');

  return {
    stats,
    userId,
  };
}
