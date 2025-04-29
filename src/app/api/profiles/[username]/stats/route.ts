import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { projects } from "@/db/schema/projects";
import { project_tags } from "@/db/schema/project_tags";
import { tags } from "@/db/schema/tags";
import { eq, sql, desc, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    // Properly resolve params as a Promise
    const resolvedParams = await Promise.resolve(params);
    const username = decodeURIComponent(resolvedParams.username);

    // First lookup the profile by username
    const profile = await executeQuery(async (db) => {
      return await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);
    });

    if (!profile.length) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userId = profile[0].user_id;

    const stats = await executeQuery(async (db) => {
      // Get total projects, likes, and tags in a single query
      const [statsResult] = await db
        .select({
          totalProjects: sql<number>`count(distinct ${projects.id})`,
          totalLikes: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
          totalTags: sql<number>`count(distinct ${project_tags.tag_id})`,
        })
        .from(projects)
        .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
        .where(eq(projects.user_id, userId));

      // Get most liked project
      const [mostLikedProject] = await db
        .select({
          title: projects.title,
          favorites: projects.total_favorites,
        })
        .from(projects)
        .where(eq(projects.user_id, userId))
        .orderBy(desc(projects.total_favorites))
        .limit(1);

      // Get count of projects that have favorites
      const [projectsFavorited] = await db
        .select({
          count: sql<number>`count(distinct ${projects.id})`,
        })
        .from(projects)
        .where(
          and(
            eq(projects.user_id, userId),
            sql`${projects.total_favorites} > 0`
          )
        );

      return {
        totalProjects: Number(statsResult?.totalProjects || 0),
        totalLikes: Number(statsResult?.totalLikes || 0),
        totalTags: Number(statsResult?.totalTags || 0),
        projectsFavorited: Number(projectsFavorited?.count || 0),
        mostLikedProject: mostLikedProject
          ? {
              title: mostLikedProject.title,
              favorites: Number(mostLikedProject.favorites || 0),
            }
          : null,
        profile: {
          username: profile[0].username,
          full_name: profile[0].full_name || null,
          profile_image_url: profile[0].profile_image_url || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile stats" },
      { status: 500 }
    );
  }
}
