import { NextRequest } from "next/server";
import { executeQuery } from "@/db/server";
import { projects } from "@/db/schema/projects";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { sql, isNull, isNotNull, eq, and, SQL } from "drizzle-orm";
import { success, databaseError } from "@/lib/api-errors";

/**
 * GET /api/categories/counts
 * Returns the count of projects per category with optional filters
 * 
 * Query params:
 * - userId: Filter by user ID (for "My Projects" view)
 * - favorites: If "true" and userId provided, count only favorited projects
 * - deleted: If "true" and userId provided, count only deleted projects
 * 
 * No params = global community counts (non-deleted projects)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const showFavorites = searchParams.get("favorites") === "true";
  const showDeleted = searchParams.get("deleted") === "true";

  try {
    const categoryCounts = await executeQuery(async (db) => {
      // Build where conditions based on filters
      const conditions: SQL<unknown>[] = [];

      if (showDeleted && userId) {
        // Deleted view: show only deleted projects for this user
        conditions.push(isNotNull(projects.deleted_at));
        conditions.push(eq(projects.user_id, userId));
      } else {
        // All other views: exclude deleted projects
        conditions.push(isNull(projects.deleted_at));
        
        if (userId && !showFavorites) {
          // My Projects view: filter by user
          conditions.push(eq(projects.user_id, userId));
        }
      }

      if (showFavorites && userId) {
        // Favorites view: join with favorites table
        // First get the profile_id for this user
        const profileResult = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (profileResult.length === 0) {
          return [];
        }

        const profileId = profileResult[0].id;

        return await db
          .select({
            category: projects.category,
            count: sql<number>`count(*)::int`,
          })
          .from(projects)
          .innerJoin(favorites, eq(favorites.project_id, projects.id))
          .where(
            and(
              eq(favorites.profile_id, profileId),
              isNull(projects.deleted_at)
            )
          )
          .groupBy(projects.category);
      }

      // Standard query for community, my projects, or deleted views
      return await db
        .select({
          category: projects.category,
          count: sql<number>`count(*)::int`,
        })
        .from(projects)
        .where(and(...conditions))
        .groupBy(projects.category);
    });

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

    const response = success(countsMap);
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    
    return response;
  } catch (error) {
    console.error("[GET /api/categories/counts] Error:", error);
    return databaseError(error, "Failed to fetch category counts");
  }
}
