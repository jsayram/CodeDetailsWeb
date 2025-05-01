import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { projects } from "@/db/schema/projects";
import { project_tags } from "@/db/schema/project_tags";
import { eq, sql, desc, and } from "drizzle-orm";

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
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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

      // Get stats if requested
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

      return {
        profile: profileData,
        stats: {
          totalProjects: Number(statsResult?.totalProjects || 0),
          totalLikes: Number(statsResult?.totalLikes || 0),
          totalTags: Number(statsResult?.totalTags || 0),
          mostLikedProject: mostLikedProject
            ? {
                title: mostLikedProject.title,
                favorites: Number(mostLikedProject.favorites || 0),
              }
            : null,
        },
      };
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json(
      { error: "Missing userId or username" },
      { status: 400 }
    );
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
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
