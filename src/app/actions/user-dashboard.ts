'use server';

import { getUserDashboardStats } from "@/db/operations/userDashboardOperations";
import { auth } from "@clerk/nextjs/server";

export async function fetchUserDashboardData() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  const stats = await getUserDashboardStats(userId);

  return {
    stats,
    userId,
  };
}
