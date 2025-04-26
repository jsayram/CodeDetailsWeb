import { NextRequest, NextResponse } from "next/server";
import { eq, and, SQL, inArray } from "drizzle-orm";
import { executeQuery } from "@/db/server";
import { getUserProjects, getProject } from "@/app/actions/projects";
import { projects } from "@/db/schema/projects";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { ProjectCategory } from "@/constants/project-categories";

// GET handler for retrieving projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("showAll") === "true";
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");
    const category = searchParams.get("category") as ProjectCategory | null;
    const tag = searchParams.get("tag");
    const showFavorites = searchParams.get("showFavorites") === "true";

    console.log(
      `🔍 API Request - Projects:
       - Category: ${category || "any"}
       - User: ${userId || "anonymous"}
       - Tag: ${tag || "any"}
       - Show All: ${showAll}
       - Show Favorites: ${showFavorites}`
    );

    // If a specific slug is provided, return that project
    if (slug) {
      console.log(`🔍 Fetching project by slug: ${slug}`);
      const result = await getProject(slug);
      if (!result.success) {
        return NextResponse.json(result, { status: 404 });
      }
      return NextResponse.json(result);
    }

    // If a specific user ID is provided and showFavorites is true, return their favorite projects
    if (userId && showFavorites) {
      console.log(`👤 Fetching favorite projects for user: ${userId}`);
      const userProjects = await executeQuery(async (db) => {
        const userProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.user_id, userId))
          .limit(1);

        if (!userProfile.length) {
          return [];
        }

        const profileId = userProfile[0].id;

        // Get all projects that the user has favorited
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

        const favoriteProjects = await projectsQuery;

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

        // Mark all projects as favorited since these are the user's favorites
        return favoriteProjects.map(({ project, profile }) => ({
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
      });

      return NextResponse.json({ success: true, data: userProjects });
    }

    // If a specific user ID is provided and not showing favorites, return their projects
    if (userId && !showAll) {
      console.log(`👤 Fetching projects for user: ${userId}`);
      const userProjects = await getUserProjects(userId);
      return NextResponse.json({ success: true, data: userProjects });
    }

    // Get projects with tags in a single query for better performance
    const projectsWithTags = await executeQuery(async (db) => {
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
        .from(projects)
        .leftJoin(profiles, eq(profiles.user_id, projects.user_id));

      const conditions: SQL[] = [];

      if (!showAll && userId) {
        conditions.push(eq(projects.user_id, userId));
      }
      
      if (category) {
        conditions.push(eq(projects.category, category));
      }

      // Get all projects that match our conditions
      const filteredProjects = conditions.length > 0
        ? await projectsQuery.where(and(...conditions))
        : await projectsQuery;

      // If we have a userId, get their favorites to mark favorited projects
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

      // Get tags for all projects in a single query
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

      // Combine projects with their tags and profile data
      return filteredProjects.map(({ project, profile }) => ({
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
    });

    return NextResponse.json({
      success: true,
      data: projectsWithTags,
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
