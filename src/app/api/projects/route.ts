import { NextRequest, NextResponse } from "next/server";
import { eq, and, SQL, inArray, desc, sql } from "drizzle-orm";
import { executeQuery, DrizzleClient } from "@/db/server";
import { getProject } from "@/app/actions/projects";
import { projects } from "@/db/schema/projects";
import { serverError, notFound, success, invalidInput } from "@/lib/api-errors";
import { tags as tagsTable } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { projectQuerySchema, parseSearchParams, type ProjectQueryInput } from "@/types/schemas/project";
import { ZodError } from "zod";

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
    total_favorites: projects.total_favorites,
  },
  profile: {
    username: profiles.username,
    email_address: profiles.email_address,
    profile_image_url: profiles.profile_image_url,
    full_name: profiles.full_name,
  },
});

// Helper function to apply sorting - returns void as it mutates the query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applySorting = (query: { orderBy: (...args: any[]) => any }, sortBy: string) => {
  switch (sortBy) {
    case "oldest":
      return query.orderBy(sql`${projects.created_at} asc`);
    case "recently-edited":
      return query.orderBy(sql`${projects.updated_at} desc`);
    case "popular":
      return query.orderBy(sql`${projects.total_favorites} desc`);
    case "alphabetical":
      return query.orderBy(sql`LOWER(${projects.title}) asc`);
    case "alphabetical-desc":
      return query.orderBy(sql`LOWER(${projects.title}) desc`);
    case "most-tagged":
      return query.orderBy(sql`(
        SELECT COUNT(*)
        FROM project_tags pt
        WHERE pt.project_id = ${projects.id}
      ) desc`);
    case "least-favorited":
      return query.orderBy(sql`${projects.total_favorites} asc`);
    case "trending":
      return query.orderBy(sql`(
        SELECT COUNT(*)
        FROM favorites f
        WHERE f.project_id = ${projects.id}
          AND f.created_at > NOW() - INTERVAL '7 days'
      ) desc, ${projects.total_favorites} desc`);
    case "random":
      return query.orderBy(sql`RANDOM()`);
    case "newest":
    default:
      return query.orderBy(sql`${projects.created_at} desc`);
  }
};

// Helper function to get project tags
const getProjectTags = async (db: DrizzleClient, projectIds: string[]) => {
  const allTags = await db
    .select({
      projectId: project_tags.project_id,
      tagName: tagsTable.name,
    })
    .from(project_tags)
    .innerJoin(tagsTable, eq(project_tags.tag_id, tagsTable.id))
    .where(inArray(project_tags.project_id, projectIds));

  return allTags.reduce(
    (
      acc: Record<string, string[]>,
      { projectId, tagName }: { projectId: string; tagName: string }
    ) => {
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(tagName);
      return acc;
    },
    {} as Record<string, string[]>
  );
};

// Helper function to get user favorites
const getUserFavorites = async (db: DrizzleClient, userId: string) => {
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
    // Set JSON content type header
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters using Zod schema
    const rawParams = parseSearchParams(searchParams);
    // Handle tags array specially since getAll returns array
    rawParams.tags = searchParams.getAll("tags");
    
    const validatedParams: ProjectQueryInput = projectQuerySchema.parse(rawParams);
    
    const {
      showAll,
      userId,
      slug,
      category,
      username,
      tags = [],
      showFavorites,
      showDeleted,
      sortBy,
      page,
      limit,
    } = validatedParams;

    // Log request parameters for debugging
    console.log(
      `🔍 API Request - Projects:
       - Category: ${category || "any"}
       - User: ${userId || "anonymous"}
       - Username: ${username || "any"}
       - Tags: ${tags.length > 0 ? tags.join(", ") : "any"}
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
      return new NextResponse(
        JSON.stringify(
          result.success
            ? result
            : { success: false, error: "Project not found" }
        ),
        { status: result.success ? 200 : 404, headers }
      );
    }

    const result = await executeQuery(async (db) => {
      const conditions: SQL[] = [];

      // Handle username filter first since it's independent of auth
      if (username) {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.username, username))
          .limit(1);

        if (userProfile.length > 0) {
          conditions.push(eq(projects.user_id, userProfile[0].user_id));
        } else {
          // Return empty result if username not found
          return {
            success: true,
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
          };
        }
      }

      // Handle favorites query (requires authentication)
      if (userId && showFavorites) {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (!userProfile.length) {
          return {
            success: true,
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
          };
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
            const tagIds = matchingTags.map((t) => t.id);

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
            return {
              success: true,
              data: [],
              pagination: { total: 0, page, limit, totalPages: 0 },
            };
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
              ...(category && category !== "all"
                ? [eq(projects.category, category)]
                : []),
              ...(tagCondition ? [tagCondition] : [])
            )
          );

        query = applySorting(query, sortBy);

        if (limit > 0) {
          query.limit(limit).offset((page - 1) * limit);
        }

        const favoriteProjects = await query;
        const projectIds = favoriteProjects.map((p) => p.project.id);
        const tagsByProject = await getProjectTags(db, projectIds);

        const data = favoriteProjects.map(({ project, profile }) => ({
          ...project,
          tags: tagsByProject[project.id] || [],
          profile: {
            username: profile?.username || null,
            email_address: profile?.email_address || null,
            profile_image_url: profile?.profile_image_url || null,
            full_name: profile?.full_name || null,
          },
          isFavorite: true,
        }));

        return {
          success: true,
          data,
          pagination: {
            total: count,
            page,
            limit: limit || count,
            totalPages: limit ? Math.ceil(count / limit) : 1,
          },
        };
      }

      // Add other filters
      if (!showAll && userId) {
        conditions.push(eq(projects.user_id, userId));
      }

      if (
        category &&
        category !== "all" &&
        Object.keys(PROJECT_CATEGORIES).includes(category)
      ) {
        conditions.push(eq(projects.category, category));
      }

      // Add tag filtering using Drizzle syntax
      if (tags.length > 0) {
        const matchingTags = await db
          .select()
          .from(tagsTable)
          .where(inArray(tagsTable.name, tags));

        if (matchingTags.length > 0) {
          const tagIds = matchingTags.map((t) => t.id);

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

      // Handle deleted state
      if (showDeleted && userId) {
        conditions.push(
          sql`${eq(projects.user_id, userId)} AND ${
            projects.deleted_at
          } IS NOT NULL`
        );
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
      const projectIds = filteredProjects.map((p) => p.project.id);
      const tagsByProject = await getProjectTags(db, projectIds);
      const userFavoriteSet = userId
        ? await getUserFavorites(db, userId)
        : new Set();

      const data = filteredProjects.map(({ project, profile }) => ({
        ...project,
        tags: tagsByProject[project.id] || [],
        profile: {
          username: profile?.username || null,
          email_address: profile?.email_address || null,
          profile_image_url: profile?.profile_image_url || null,
          full_name: profile?.full_name || null,
        },
        isFavorite: userFavoriteSet.has(project.id),
      }));

      return {
        success: true,
        data,
        pagination: {
          total: count,
          page,
          limit: limit || count,
          totalPages: limit ? Math.ceil(count / limit) : 1,
        },
      };
    });

    // Ensure we always return a response with headers
    return new NextResponse(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    // Handle Zod validation errors specifically
    if (error instanceof ZodError) {
      return invalidInput(error.errors.map(e => e.message).join(", "));
    }
    return serverError();
  }
}
