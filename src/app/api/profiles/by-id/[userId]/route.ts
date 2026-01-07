import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { projects } from "@/db/schema/projects";
import { project_tags } from "@/db/schema/project_tags";
import { favorites } from "@/db/schema/favorites";
import { eq, sql, desc, and, or, isNull, isNotNull, ne } from "drizzle-orm";
import { success, notFound, invalidInput, databaseError } from "@/lib/api-errors";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  // Properly resolve params as a Promise
  const resolvedParams = await Promise.resolve(params);
  const userId = resolvedParams.userId;
  const url = new URL(req.url);
  const includeStats = url.searchParams.get("includeStats") === "true";

  if (!userId) {
    return invalidInput("Missing userId parameter");
  }

  try {
    const profile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.user_id, userId));

      const profileData = result[0] || null;

      if (!profileData) {
        return null;
      }

      if (!includeStats) {
        return { profile: profileData };
      }

      try {
        // Get stats if requested
        const [statsResult] = await db
          .select({
            totalProjects: sql<number>`count(distinct ${projects.id})`,
            activeProjects: sql<number>`count(distinct case when ${projects.deleted_at} is null then ${projects.id} end)`,
            graveyardProjects: sql<number>`count(distinct case when ${projects.deleted_at} is not null then ${projects.id} end)`,
            totalLikes: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
            totalTags: sql<number>`count(distinct ${project_tags.tag_id})`,
          })
          .from(projects)
          .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
          .where(eq(projects.user_id, userId));

        // Get favorites given by this user (using profile.id not user_id)
        const [favoritesGiven] = await db
          .select({
            projectsFavorited: sql<number>`count(distinct ${favorites.project_id})`,
          })
          .from(favorites)
          .where(eq(favorites.profile_id, profileData.id));

        // Get favorites received on user's projects
        const [favoritesReceived] = await db
          .select({
            projectsReceivedFavorites: sql<number>`count(*)`,
          })
          .from(favorites)
          .innerJoin(projects, eq(projects.id, favorites.project_id))
          .where(eq(projects.user_id, userId));

        // Get community projects count (favorited projects from other users)
        const [communityStats] = await db
          .select({
            communityProjects: sql<number>`count(distinct ${projects.id})`,
          })
          .from(favorites)
          .innerJoin(projects, eq(projects.id, favorites.project_id))
          .where(
            and(
              eq(favorites.profile_id, profileData.id),
              ne(projects.user_id, userId),
              isNull(projects.deleted_at)
            )
          );

        // Get most liked project
        const [mostLikedProject] = await db
          .select({
            title: projects.title,
            favorites: projects.total_favorites,
          })
          .from(projects)
          .where(
            and(
              eq(projects.user_id, userId),
              isNull(projects.deleted_at)
            )
          )
          .orderBy(desc(projects.total_favorites))
          .limit(1);

        return {
          profile: profileData,
          stats: {
            totalProjects: Number(statsResult?.totalProjects || 0),
            activeProjects: Number(statsResult?.activeProjects || 0),
            graveyardProjects: Number(statsResult?.graveyardProjects || 0),
            communityProjects: Number(communityStats?.communityProjects || 0),
            totalLikes: Number(statsResult?.totalLikes || 0),
            totalTags: Number(statsResult?.totalTags || 0),
            projectsFavorited: Number(favoritesGiven?.projectsFavorited || 0),
            projectsReceivedFavorites: Number(favoritesReceived?.projectsReceivedFavorites || 0),
            joinedDate: profileData.created_at,
            mostLikedProject: mostLikedProject
              ? {
                  title: mostLikedProject.title,
                  favorites: Number(mostLikedProject.favorites || 0),
                }
              : null,
          },
        };
      } catch (statsError: unknown) {
        const errorMessage = statsError instanceof Error ? statsError.message : String(statsError);
        console.error("Error fetching stats:", errorMessage);
        // Return profile with empty stats if stats query fails
        return {
          profile: profileData,
          stats: {
            totalProjects: 0,
            activeProjects: 0,
            graveyardProjects: 0,
            communityProjects: 0,
            totalLikes: 0,
            totalTags: 0,
            projectsFavorited: 0,
            projectsReceivedFavorites: 0,
            joinedDate: profileData.created_at,
            mostLikedProject: null,
          },
        };
      }
    });

    if (!profile) {
      return notFound("profile", { identifier: userId, identifierType: "userId" });
    }

    return success(profile);
  } catch (error) {
    return databaseError(error, "Failed to fetch profile");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const userId = resolvedParams.userId;
  const { username, profile_image_url } = await req.json();
  if (!userId || !username) {
    return invalidInput("Missing userId or username");
  }
  try {
    const updated = await executeQuery(async (db) => {
      const [result] = await db
        .update(profiles)
        .set({ username, profile_image_url, updated_at: new Date() })
        .where(eq(profiles.user_id, userId))
        .returning();
      return result;
    });
    if (!updated) {
      return notFound("profile", { identifier: userId, identifierType: "userId" });
    }
    return success({ profile: updated });
  } catch (error) {
    return databaseError(error, "Failed to update profile");
  }
}
