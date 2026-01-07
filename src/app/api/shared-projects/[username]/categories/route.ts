import { NextRequest } from "next/server";
import { executeQuery } from "@/db/server";
import { eq, and, isNull, sql } from "drizzle-orm";
import { projects } from "@/db/schema/projects";
import { profiles } from "@/db/schema/profiles";
import { success, notFound, serverError } from "@/lib/api-errors";

/**
 * GET /api/shared-projects/[username]/categories
 * Returns the count of non-deleted projects per category for a specific user
 * Used by SharedProjectsGrid to show which categories the user has projects in
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const username = params.username.toLowerCase();

  try {
    const result = await executeQuery(async (db) => {
      // First verify the user exists
      const profileCheck = await db
        .select({ username: profiles.username })
        .from(profiles)
        .where(eq(sql`lower(${profiles.username})`, username))
        .limit(1);

      if (profileCheck.length === 0) {
        return { notFound: true };
      }

      // Get category counts for this user
      const categoryCounts = await db
        .select({
          category: projects.category,
          count: sql<number>`count(*)::int`,
        })
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
        .where(
          and(
            eq(sql`lower(${profiles.username})`, username),
            isNull(projects.deleted_at)
          )
        )
        .groupBy(projects.category);

      // Transform array to object for easier lookup
      const countsMap = categoryCounts.reduce(
        (acc, { category, count }) => {
          if (category) {
            acc[category] = count;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      return { counts: countsMap };
    });

    if ("notFound" in result && result.notFound) {
      return notFound("user", { identifier: username });
    }

    const response = success(result.counts);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    console.error("[GET /api/shared-projects/[username]/categories] Error:", error);
    return serverError(error, "Failed to fetch user category counts");
  }
}
