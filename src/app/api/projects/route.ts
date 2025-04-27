import { NextRequest, NextResponse } from "next/server";
import { eq, and, SQL, inArray, desc, sql, is } from "drizzle-orm";
import { executeQuery } from "@/db/server";
import { getProject } from "@/app/actions/projects";
import { projects } from "@/db/schema/projects";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { ProjectCategory, PROJECT_CATEGORIES } from "@/constants/project-categories";

// GET handler for retrieving projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("showAll") === "true";
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");
    const category = searchParams.get("category") as (ProjectCategory | "all" | null);
    const tag = searchParams.get("tag");
    const showFavorites = searchParams.get("showFavorites") === "true";
    const showDeleted = searchParams.get("showDeleted") === "true";
    const sortBy = searchParams.get("sortBy") || "newest";
    
    // Parse pagination params with defaults
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 0); // 0 means no limit

    console.log(
      `🔍 API Request - Projects:
       - Category: ${category || "any"}
       - User: ${userId || "anonymous"}
       - Tag: ${tag || "any"}
       - Show All: ${showAll}
       - Show Favorites: ${showFavorites}
       - Show Deleted: ${showDeleted}
       - Sort By: ${sortBy}
       - Page: ${page}
       - Limit: ${limit || "all"}`
    );

    // If a specific slug is provided, return that project
    if (slug) {
      const result = await getProject(slug);
      if (!result.success) {
        return NextResponse.json(result, { status: 404 });
      }
      return NextResponse.json(result);
    }

    // If showing favorites, handle favorites query
    if (userId && showFavorites) {
      const userProjects = await executeQuery(async (db) => {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (!userProfile.length) {
          return { data: [], total: 0 };
        }

        const profileId = userProfile[0].id;

        // Get total count first
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(favorites)
          .where(eq(favorites.profile_id, profileId))
          .execute();

        // Build base query for favorites
        const projectsQuery = db
          .select({
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
          })
          .from(favorites)
          .innerJoin(projects, eq(favorites.project_id, projects.id))
          .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
          .where(eq(favorites.profile_id, profileId));

        // Apply sorting
        switch (sortBy) {
          case "oldest":
            projectsQuery.orderBy(sql`${projects.created_at} asc`);
            break;
          case "popular":
            projectsQuery.orderBy(sql`${projects.total_favorites} desc`);
            break;
          case "newest":
          default:
            projectsQuery.orderBy(sql`${projects.created_at} desc`);
        }

        // Apply pagination
        if (limit > 0) {
          projectsQuery.limit(limit).offset((page - 1) * limit);
        }

        const favoriteProjects = await projectsQuery;

        // Get tags for favorited projects
        const allTags = await db
          .select({
            projectId: project_tags.project_id,
            tagName: tags.name,
          })
          .from(project_tags)
          .innerJoin(tags, eq(project_tags.tag_id, tags.id))
          .where(
            inArray(
              project_tags.project_id,
              favoriteProjects.map(p => p.project.id)
            )
          );

        // Group tags by project
        const tagsByProject = allTags.reduce((acc, { projectId, tagName }) => {
          if (!acc[projectId]) {
            acc[projectId] = [];
          }
          acc[projectId].push(tagName);
          return acc;
        }, {} as Record<string, string[]>);

        // Mark all projects as favorited since these are user's favorites
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

        return { data, total: count };
      });

      return NextResponse.json({
        success: true,
        data: userProjects.data,
        pagination: {
          total: userProjects.total,
          page,
          limit: limit || userProjects.total,
          totalPages: limit ? Math.ceil(userProjects.total / limit) : 1
        }
      });
    }

    // Regular projects query (including deleted if showDeleted is true)
    const projectsWithTags = await executeQuery(async (db) => {
      // Build base selection
      const selection = {
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
      };

      const conditions: SQL[] = [];

      // Handle filters
      if (!showAll && userId) {
        conditions.push(eq(projects.user_id, userId));
      }
      
      // Category filter - ensure it's only added when category is provided and not "all"
      if (category && category !== "all" && Object.keys(PROJECT_CATEGORIES).includes(category)) {
        conditions.push(eq(projects.category, category));
      }

      // Handle deleted projects filter
      if (showDeleted && userId) {
        conditions.push(
          sql<SQL>`${eq(projects.user_id, userId)} AND ${projects.deleted_at} IS NOT NULL`
        );
      } else if (!showDeleted) {
        conditions.push(sql<SQL>`${projects.deleted_at} IS NULL`);
      }

      // Get total count with conditions
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .execute();

      // Build the query
      const query = db
        .select(selection)
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
        .$dynamic();

      // Apply conditions
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      // Apply sorting
      switch (sortBy) {
        case "oldest":
          query.orderBy(sql`${projects.created_at} asc`);
          break;
        case "popular":
          query.orderBy(sql`${projects.total_favorites} desc`);
          break;
        case "newest":
        default:
          query.orderBy(sql`${projects.created_at} desc`);
      }

      // Apply pagination
      if (limit > 0) {
        query.limit(limit).offset((page - 1) * limit);
      }

      const filteredProjects = await query;

      // Get favorites if we have a userId
      let userFavoriteSet: Set<string> = new Set();
      if (userId) {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (userProfile.length) {
          const userFavorites = await db
            .select({
              projectId: favorites.project_id
            })
            .from(favorites)
            .where(eq(favorites.profile_id, userProfile[0].id));

          userFavoriteSet = new Set(userFavorites.map(f => f.projectId));
        }
      }

      // Get tags for all projects
      const allTags = await db
        .select({
          projectId: project_tags.project_id,
          tagName: tags.name,
        })
        .from(project_tags)
        .innerJoin(tags, eq(project_tags.tag_id, tags.id))
        .where(
          inArray(
            project_tags.project_id,
            filteredProjects.map(p => p.project.id)
          )
        );

      // Group tags by project
      const tagsByProject = allTags.reduce((acc, { projectId, tagName }) => {
        if (!acc[projectId]) {
          acc[projectId] = [];
        }
        acc[projectId].push(tagName);
        return acc;
      }, {} as Record<string, string[]>);

      // Combine projects with their tags and favorite status
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

      return { data, total: count };
    });

    return NextResponse.json({
      success: true,
      data: projectsWithTags.data,
      pagination: {
        total: projectsWithTags.total,
        page,
        limit: limit || projectsWithTags.total,
        totalPages: limit ? Math.ceil(projectsWithTags.total / limit) : 1
      }
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
