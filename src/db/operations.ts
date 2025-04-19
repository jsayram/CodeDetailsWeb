"use server";

import { executeQuery } from "./server";
import {
  projects,
  profiles,
  likes,
  favorites,
  project_tags,
  tags,
} from "./schema";
import { InsertProject, SelectProject } from "./schema/projects";
import { SelectProfile } from "./schema/profiles";
import { SelectLike } from "./schema/likes";
import { SelectFavorite } from "./schema/favorites";
import { eq, sql, desc, and, isNull } from "drizzle-orm";
import { ProjectCategory } from "@/constants/project-categories";

/**
 * Server-side only database operations
 * These functions should only be used in server components or API routes
 */

/**
 * Adds a new project to the database
 * @param project The project data to add
 * @returns The newly created project
 */
export async function addProject(
  project: InsertProject
): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    const result = await db.insert(projects).values(project).returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create project");
    }

    return result[0];
  });
}

/**
 * Gets a project by slug
 * @param slug The project slug to look up
 * @returns The project or null if not found
 */
export async function getProjectBySlug(
  slug: string
): Promise<SelectProject | null> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), isNull(projects.deleted_at)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  });
}

/**
 * Soft delete a project by setting deleted_at timestamp
 * @param id The project ID to soft delete
 * @returns The soft deleted project
 */
export async function deleteProject(id: string): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    const result = await db
      .update(projects)
      .set({ 
        deleted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(projects.id, id))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Project not found or could not be deleted");
    }

    return result[0];
  });
}

/**
 * Get all projects
 * @returns An array of all projects
 */
export async function getAllProjects(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return await db.select().from(projects).where(isNull(projects.deleted_at));
  });
}

/**
 * Get all projects with a specific category
 * @param category The category to filter projects by
 * @returns An array of projects with the specified category
 */
export async function getProjectsByCategory(
  category: ProjectCategory
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.category, category), isNull(projects.deleted_at))
      );
  });
}

/**
 * Get all projects by user ID
 * @param userId The user ID to filter projects by
 * @returns An array of projects with the specified user ID
 */
export async function getProjectsByUserId(
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return await db
      .select()
      .from(projects)
      .where(and(eq(projects.user_id, userId), isNull(projects.deleted_at)));
  });
}

/**
 * Get all most recent projects
 * @returns An array of the most recent projects
 */
export async function getRecentProjects(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return await db
      .select()
      .from(projects)
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.created_at))
      .limit(5);
  });
}

/**
 * Get all projects with a specific category and user ID
 * @param category The category to filter projects by
 * @param userId The user ID to filter projects by
 * @returns An array of projects with the specified category and user ID
 */
export async function getProjectsByCategoryAndUserId(
  category: ProjectCategory,
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.category, category),
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      );
  });
}

/**
 * Get profile data for a logged-on user
 * @param userId The user ID to filter profile by
 * @returns The profile or null if not found
 */
export async function getProfileByUserId(
  userId: string
): Promise<SelectProfile | null> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  });
}

/**
 * Get all likes for a project
 * @param projectId The project ID to get likes for
 * @returns An array of likes for the project
 */
export async function getProjectLikes(
  projectId: string
): Promise<SelectLike[]> {
  return await executeQuery(async (db) => {
    return await db.select().from(likes).where(eq(likes.project_id, projectId));
  });
}

/**
 * Add a like to a project
 * @param projectId The project ID to like
 * @param profileId The profile ID liking the project
 * @returns The created like
 */
export async function addProjectLike(
  projectId: string,
  profileId: string
): Promise<SelectLike> {
  return await executeQuery(async (db) => {
    // Check if like already exists
    const existingLike = await db
      .select()
      .from(likes)
      .where(
        and(eq(likes.project_id, projectId), eq(likes.profile_id, profileId))
      )
      .limit(1);

    if (existingLike.length > 0) {
      return existingLike[0];
    }

    // Create new like
    const [newLike] = await db
      .insert(likes)
      .values({
        project_id: projectId,
        profile_id: profileId,
      })
      .returning();

    return newLike;
  });
}

/**
 * Remove a like from a project
 * @param projectId The project ID to unlike
 * @param profileId The profile ID unliking the project
 * @returns The number of likes removed (0 or 1)
 */
export async function removeProjectLike(
  projectId: string,
  profileId: string
): Promise<number> {
  return await executeQuery(async (db) => {
    const result = await db
      .delete(likes)
      .where(
        and(eq(likes.project_id, projectId), eq(likes.profile_id, profileId))
      );

    return result.length;
  });
}

/**
 * Get all favorites for a project
 * @param projectId The project ID to get favorites for
 * @returns An array of favorites for the project
 */
export async function getProjectFavorites(
  projectId: string
): Promise<SelectFavorite[]> {
  return await executeQuery(async (db) => {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.project_id, projectId));
  });
}

/**
 * Add a favorite to a project
 * @param projectId The project ID to favorite
 * @param profileId The profile ID favoriting the project
 * @returns The created favorite
 */
export async function addProjectFavorite(
  projectId: string,
  profileId: string
): Promise<SelectFavorite> {
  return await executeQuery(async (db) => {
    // Check if favorite already exists
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.project_id, projectId),
          eq(favorites.profile_id, profileId)
        )
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      return existingFavorite[0];
    }

    // Create new favorite
    const [newFavorite] = await db
      .insert(favorites)
      .values({
        project_id: projectId,
        profile_id: profileId,
      })
      .returning();

    return newFavorite;
  });
}

/**
 * Remove a favorite from a project
 * @param projectId The project ID to unfavorite
 * @param profileId The profile ID unfavoriting the project
 * @returns The number of favorites removed (0 or 1)
 */
export async function removeProjectFavorite(
  projectId: string,
  profileId: string
): Promise<number> {
  return await executeQuery(async (db) => {
    const result = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.project_id, projectId),
          eq(favorites.profile_id, profileId)
        )
      );

    return result.length;
  });
}

/**
 * Get all projects with a specific tag
 * @param tagName The name of the tag to filter projects by
 * @returns An array of projects with the specified tag
 */
export async function getProjectsByTag(
  tagName: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const projectsWithTags = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        difficulty: projects.difficulty,
        category: projects.category,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
        user_id: projects.user_id,
        deleted_at: projects.deleted_at,
      })
      .from(projects)
      .innerJoin(project_tags, eq(projects.id, project_tags.project_id))
      .innerJoin(tags, eq(project_tags.tag_id, tags.id))
      .where(and(eq(tags.name, tagName), isNull(projects.deleted_at)))
      .orderBy(desc(projects.created_at));

    // Get tags for each project
    const projectsWithAllTags = await Promise.all(
      projectsWithTags.map(async (project) => {
        const tags = await getProjectTagNames(project.id);
        return { ...project, tags };
      })
    );

    return projectsWithAllTags;
  });
}
