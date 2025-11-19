'use server';

import { getDashboardStats } from "@/db/operations/dashboardOperations";
import { getPendingTagSubmissions } from "./tag-submissions";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin-utils";
import { redirect } from "next/navigation";

export async function fetchAdminDashboardData() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  // Get user email from Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  // Check if user is admin
  if (!isAdmin(userEmail)) {
    redirect("/dashboard");
  }

  const [submissions, stats] = await Promise.all([
    getPendingTagSubmissions(),
    getDashboardStats(),
  ]);

  return {
    submissions,
    stats,
  };
}
