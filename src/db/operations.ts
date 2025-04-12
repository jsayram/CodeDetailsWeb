"use server";

import { executeQuery } from "./server";
import { projects } from "./schema";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, sql } from "drizzle-orm";

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
 * Get all projects accessible to a user based on their tier level
 * @param userTierLevel The user's tier level (0=free, 1=pro, 2=diamond)
 * @returns Array of projects accessible to the user
 */
export async function getAccessibleProjects(
  userTierLevel: number
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    // This query gets all projects where the project's tier level is <= the user's tier level
    return db
      .select()
      .from(projects)
      .where(
        sql`${projects.tier}::text IN (
          SELECT tier FROM (
            VALUES ('free', 0), ('pro', 1), ('diamond', 2)
          ) AS t(tier, level)
          WHERE level <= ${userTierLevel}
        )`
      );
  });
}

/**
 * Get all free tier projects
 * @returns Array of free projects
 */
export async function getFreeProjects(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return db.select().from(projects).where(eq(projects.tier, "free"));
  });
}

/**
 * Get project count by tier
 * @param tier The tier to count projects for
 * @returns Number of projects in the specified tier
 */
export async function getProjectCountByTier(tier: string): Promise<number> {
  return await executeQuery(async (db) => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.tier, tier));

    return result[0]?.count || 0;
  });
}
