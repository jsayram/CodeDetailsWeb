"use server";

import { executeQuery } from "./server";
import { projects } from "./schema";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, sql, desc, and } from "drizzle-orm";

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
      .where(eq(projects.slug, slug))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  });
}

/**
 * Delete a project
 * @param id The project ID to delete
 * @returns The deleted project
 */
export async function deleteProject(id: string): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    const result = await db
      .delete(projects)
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
    const result = await db.select().from(projects);
    return result;
  });
}


/**
 * Get all projects with a specific difficulty level
 * @param difficulty The difficulty level to filter projects by
 * @returns An array of projects with the specified difficulty level
 */
export async function getProjectsByDifficulty(
  difficulty: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.difficulty, difficulty));

    return result;
  });
}

//create a function to get all projects by user id
export async function getProjectsByUserId(  
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.user_id, userId));

    return result;
  });
}

//get all most recent projects
export async function getRecentProjects(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.created_at))
      .limit(5);

    return result;
  });
}

/**
 * Get all projects with a specific difficulty level and user ID
 * @param difficulty The difficulty level to filter projects by
 * @param userId The user ID to filter projects by
 * @returns An array of projects with the specified difficulty level and user ID
 */
export async function getProjectsByDifficultyAndUserId(
  difficulty: string,
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.difficulty, difficulty),
          eq(projects.user_id, userId)
        )
      );

    return result;
  });
}
