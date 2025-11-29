import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { projects } from "@/db/schema/projects";
import { desc, sql, eq, isNull } from "drizzle-orm";
import { success, databaseError } from "@/lib/api-errors";

// Next.js Route Segment Config - Cache for 5 minutes, revalidate in background
export const revalidate = 300; // 5 minutes in seconds

export async function GET() {
  try {
    const allProfiles = await executeQuery(async (db) =>
      db
        .select({
          id: profiles.id,
          user_id: profiles.user_id,
          username: profiles.username,
          full_name: profiles.full_name,
          profile_image_url: profiles.profile_image_url,
          tier: profiles.tier,
          email_address: profiles.email_address,
          created_at: profiles.created_at,
          updated_at: profiles.updated_at,
          project_count: sql<number>`COUNT(CASE WHEN ${projects.deleted_at} IS NULL THEN ${projects.id} END)`,
          total_favorites: sql<number>`COALESCE(SUM(CASE WHEN ${projects.deleted_at} IS NULL THEN ${projects.total_favorites}::numeric ELSE 0 END), 0)`,
          last_activity_date: sql<Date | null>`MAX(CASE WHEN ${projects.deleted_at} IS NULL THEN GREATEST(${projects.updated_at}, ${projects.created_at}) END)`,
        })
        .from(profiles)
        .leftJoin(projects, eq(profiles.user_id, projects.user_id))
        .groupBy(profiles.id)
        .orderBy(desc(profiles.created_at))
    );

    // Return with explicit cache headers for browser/CDN caching
    const response = success(allProfiles);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    return databaseError(error, "Failed to fetch profiles");
  }
}
