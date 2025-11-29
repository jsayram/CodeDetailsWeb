import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { projects } from "@/db/schema/projects";
import { sql, isNull } from "drizzle-orm";
import { success, databaseError } from "@/lib/api-errors";

/**
 * GET /api/categories/counts
 * Returns the count of non-deleted projects per category
 */
export async function GET() {
  try {
    const categoryCounts = await executeQuery(async (db) => {
      return await db
        .select({
          category: projects.category,
          count: sql<number>`count(*)::int`,
        })
        .from(projects)
        .where(isNull(projects.deleted_at))
        .groupBy(projects.category);
    });

    // Transform array to object for easier lookup
    const countsMap = categoryCounts.reduce(
      (acc, { category, count }) => {
        acc[category] = count;
        return acc;
      },
      {} as Record<string, number>
    );

    const response = success(countsMap);
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    
    return response;
  } catch (error) {
    console.error("[GET /api/categories/counts] Error:", error);
    return databaseError(error, "Failed to fetch category counts");
  }
}
