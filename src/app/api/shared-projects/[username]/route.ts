import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { eq, and, isNull, desc, asc, SQL, sql } from "drizzle-orm";
import { projects } from "@/db/schema/projects";
import { profiles } from "@/db/schema/profiles";
import { project_tags } from "@/db/schema/project_tags";
import { tags } from "@/db/schema/tags";
import { usernameHistory } from "@/db/schema/username-history";
import { PROJECTS_PER_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { serverError, success } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const username = params.username.toLowerCase();

  // Get parameters from URL
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Number(searchParams.get("limit") || PROJECTS_PER_PAGE);
  const offset = (page - 1) * limit;
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy") || "newest";

  try {
    const result = await executeQuery(async (db) => {
      // First check if this username exists in profiles
      const profileCheck = await db
        .select({ username: profiles.username })
        .from(profiles)
        .where(eq(sql`lower(${profiles.username})`, username))
        .limit(1);
      
      // If no profile found, check username history for redirect
      if (profileCheck.length === 0) {
        const historyRecord = await db
          .select()
          .from(usernameHistory)
          .where(eq(sql`lower(${usernameHistory.old_username})`, username))
          .limit(1);
        
        if (historyRecord.length) {
          // Found in history - look up current username by user_id
          const currentProfile = await db
            .select({ username: profiles.username })
            .from(profiles)
            .where(eq(profiles.user_id, historyRecord[0].user_id))
            .limit(1);
          
          if (currentProfile.length) {
            return {
              redirect: true,
              oldUsername: username,
              currentUsername: currentProfile[0].username,
            };
          }
        }
        
        // Not found at all
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      // Build where conditions
      const whereConditions = [
        eq(sql`lower(${profiles.username})`, username),
        isNull(projects.deleted_at),
      ];

      // Add category filter if specified
      if (category) {
        whereConditions.push(eq(projects.category, category));
      }

      // Get total count first
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
        .where(and(...whereConditions));

      // Determine sort order
      let orderBy: SQL<unknown>[] = [];
      switch (sortBy) {
        case "oldest":
          orderBy = [asc(projects.created_at)];
          break;
        case "popular":
          orderBy = [desc(projects.total_favorites), desc(projects.created_at)];
          break;
        case "newest":
        default:
          orderBy = [desc(projects.created_at)];
          break;
      }

      // Get paginated projects
      const sharedProjects = await db
        .select({
          project: {
            id: projects.id,
            title: projects.title,
            slug: projects.slug,
            description: projects.description,
            category: projects.category,
            created_at: projects.created_at,
            updated_at: projects.updated_at,
            total_favorites: projects.total_favorites,
          },
          profile: {
            username: profiles.username,
            profile_image_url: profiles.profile_image_url,
            full_name: profiles.full_name,
          },
          tags: sql<string[]>`array_agg(distinct ${tags.name})`,
        })
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
        .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
        .leftJoin(tags, eq(tags.id, project_tags.tag_id))
        .where(and(...whereConditions))
        .groupBy(
          projects.id,
          profiles.username,
          profiles.profile_image_url,
          profiles.full_name
        )
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      return {
        data: sharedProjects,
        pagination: {
          total: Number(count),
          page,
          limit,
          totalPages: Math.ceil(Number(count) / limit),
        },
      };
    });

    // Handle redirect responses specially (need to maintain backward compatibility)
    if ("redirect" in result && result.redirect) {
      return NextResponse.json(result);
    }

    return success(result);
  } catch (error) {
    console.error("Error fetching shared projects:", error);
    return serverError(error, "Failed to fetch shared projects");
  }
}
