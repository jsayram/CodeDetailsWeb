'use server';

import { getDashboardStats } from "@/db/operations/dashboardOperations";
import { getPendingTagSubmissions } from "./tag-submissions";

export async function fetchDashboardData() {
  const [submissions, stats] = await Promise.all([
    getPendingTagSubmissions(),
    getDashboardStats(),
  ]);

  return {
    submissions,
    stats
  };
}