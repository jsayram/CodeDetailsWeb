import { NextRequest, NextResponse } from "next/server";
import { eq, and, SQL, inArray, desc, sql } from "drizzle-orm";
import { executeQuery } from "@/db/server";
import { getProject } from "@/app/actions/projects";
import { projects } from "@/db/schema/projects";
import { tags as tagsTable } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { ProjectCategory, PROJECT_CATEGORIES } from "@/constants/project-categories";

// Helper function to build base project selection
const buildProjectSelection = () => ({
  project: {
    id: projects.id,
    title: projects.title,
    slug: projects.slug,
    description: projects.description,
    category: projects.category,
    created_at: projects.created_at,
    updated_at: projects.updated_at,
    user_id: projects.user_id,
    deleted_at: projects.deleted_at,
    total_favorites: projects.total_favorites
  },
  profile: {
    username: profiles.username,
    email_address: profiles.email_address,
    profile_image_url: profiles.profile_image_url,
    full_name: profiles.full_name
  }
});

// Helper function to apply sorting
const applySorting = (query: any, sortBy: string) => {
  switch (sortBy) {
    case "oldest":
      return query.orderBy(sql`${projects.created_at} asc`);
    case "popular":
      return query.orderBy(sql`${projects.total_favorites} desc`);
    case "newest":
    default:
      return query.orderBy(sql`${projects.created_at} desc`);
  }
};

// Helper function to get project tags
const getProjectTags = async (db: any, projectIds: string[]) => {
  const allTags = await db
    .select({
      projectId: project_tags.project_id,
      tagName: tagsTable.name,
    })
    .from(project_tags)
    .innerJoin(tagsTable, eq(project_tags.tag_id, tagsTable.id))
    .where(inArray(project_tags.project_id, projectIds));

  return allTags.reduce((acc: Record<string, string[]>, { projectId, tagName }: { projectId: string; tagName: string }) => {
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(tagName);
    return acc;
  }, {} as Record<string, string[]>);
};

// Helper function to get user favorites
const getUserFavorites = async (db: any, userId: string) => {
  const userProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.user_id, userId))
    .limit(1);

  if (!userProfile.length) return new Set<string>();

  const userFavorites = await db
    .select({ projectId: favorites.project_id })
    .from(favorites)
    .where(eq(favorites.profile_id, userProfile[0].id));

  return new Set(userFavorites.map((f: { projectId: string }) => f.projectId));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("showAll") === "true";
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");
    const category = searchParams.get("category") as (ProjectCategory | "all" | null);
    const tags = searchParams.getAll("tags");
    const showFavorites = searchParams.get("showFavorites") === "true";
    const showDeleted = searchParams.get("showDeleted") === "true";
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 0);

    // Log request parameters
    console.log(
      `🔍 API Request - Projects:
       - Category: ${category || "any"}
       - User: ${userId || "anonymous"}
       - Tags: ${tags.length ? tags.join(", ") : "any"}
       - Show All: ${showAll}
       - Show Favorites: ${showFavorites}
       - Show Deleted: ${showDeleted}
       - Sort By: ${sortBy}
       - Page: ${page}
       - Limit: ${limit || "all"}`
    );

    // Handle single project request by slug
    if (slug) {
      const result = await getProject(slug);
      if (!result.success) return NextResponse.json(result, { status: 404 });
      return NextResponse.json(result);
    }

    return await executeQuery(async (db) => {
      // Handle favorites query
      if (userId && showFavorites) {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (!userProfile.length) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 }
          });
        }

        const profileId = userProfile[0].id;

        // Get projects filtered by tags if specified
        let tagCondition: SQL | undefined;
        if (tags.length > 0) {
          const matchingTags = await db
            .select()
            .from(tagsTable)
            .where(inArray(tagsTable.name, tags));

          if (matchingTags.length > 0) {
            const tagIds = matchingTags.map(t => t.id);
            
            // Find projects that have ALL specified tags using a subquery
            tagCondition = sql`${projects.id} IN (
              SELECT ${project_tags.project_id}
              FROM ${project_tags}
              WHERE ${project_tags.tag_id} IN (${sql.join(tagIds)})
              GROUP BY ${project_tags.project_id}
              HAVING count(*) = ${tagIds.length}
            )`;
          } else {
            // If no matching tags found, return empty result
            return NextResponse.json({
              success: true,
              data: [],
              pagination: { total: 0, page, limit, totalPages: 0 }
            });
          }
        }

        // Get total count for favorites
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(favorites)
          .where(
            and(
              eq(favorites.profile_id, profileId),
              ...(tagCondition ? [tagCondition] : [])
            )
          );

        // Build and execute favorites query with tag filtering
        let query = db
          .select(buildProjectSelection())
          .from(favorites)
          .innerJoin(projects, eq(favorites.project_id, projects.id))
          .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
          .where(
            and(
              eq(favorites.profile_id, profileId),
              ...(category && category !== "all" ? [eq(projects.category, category)] : []),
              ...(tagCondition ? [tagCondition] : [])
            )
          );

        query = applySorting(query, sortBy);

        if (limit > 0) {
          query.limit(limit).offset((page - 1) * limit);
        }

        const favoriteProjects = await query;
        const projectIds = favoriteProjects.map(p => p.project.id);
        const tagsByProject = await getProjectTags(db, projectIds);

        const data = favoriteProjects.map(({ project, profile }) => ({
          ...project,
          tags: tagsByProject[project.id] || [],
          profile: {
            username: profile?.username || null,
            email_address: profile?.email_address || null,
            profile_image_url: profile?.profile_image_url || null,
            full_name: profile?.full_name || null
          },
          isFavorite: true
        }));

        return NextResponse.json({
          success: true,
          data,
          pagination: {
            total: count,
            page,
            limit: limit || count,
            totalPages: limit ? Math.ceil(count / limit) : 1
          }
        });
      }

      // Regular projects query
      const conditions: SQL[] = [];

      if (!showAll && userId) {
        conditions.push(eq(projects.user_id, userId));
      }

      if (category && category !== "all" && Object.keys(PROJECT_CATEGORIES).includes(category)) {
        conditions.push(eq(projects.category, category));
      }

      // Add tag filtering using Drizzle syntax
      if (tags.length > 0) {
        const matchingTags = await db
          .select()
          .from(tagsTable)
          .where(inArray(tagsTable.name, tags));

        if (matchingTags.length > 0) {
          const tagIds = matchingTags.map(t => t.id);
          
          // Find projects that have ALL specified tags using Drizzle SQL builder
          conditions.push(
            sql`${projects.id} IN (
              SELECT ${project_tags.project_id}
              FROM ${project_tags}
              WHERE ${project_tags.tag_id} IN (${sql.join(tagIds)})
              GROUP BY ${project_tags.project_id}
              HAVING count(*) = ${tagIds.length}
            )`
          );
        } else {
          // If no matching tags found, ensure no results
          conditions.push(sql`FALSE`);
        }
      }

      if (showDeleted && userId) {
        conditions.push(sql`${eq(projects.user_id, userId)} AND ${projects.deleted_at} IS NOT NULL`);
      } else if (!showDeleted) {
        conditions.push(sql`${projects.deleted_at} IS NULL`);
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Build main query
      let query = db
        .select(buildProjectSelection())
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
        .$dynamic();

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = applySorting(query, sortBy);

      if (limit > 0) {
        query = query.limit(limit).offset((page - 1) * limit);
      }

      const filteredProjects = await query;
      const projectIds = filteredProjects.map(p => p.project.id);
      const tagsByProject = await getProjectTags(db, projectIds);
      const userFavoriteSet = userId ? await getUserFavorites(db, userId) : new Set();

      const data = filteredProjects.map(({ project, profile }) => ({
        ...project,
        tags: tagsByProject[project.id] || [],
        profile: {
          username: profile?.username || null,
          email_address: profile?.email_address || null,
          profile_image_url: profile?.profile_image_url || null,
          full_name: profile?.full_name || null
        },
        isFavorite: userFavoriteSet.has(project.id)
      }));

      return NextResponse.json({
        success: true,
        data,
        pagination: {
          total: count,
          page,
          limit: limit || count,
          totalPages: limit ? Math.ceil(count / limit) : 1
        }
      });
    });
  } catch (error) {
    console.error("Error in projects API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}
