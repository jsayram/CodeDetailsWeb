"use server";

import { executeQuery } from "./server";
import { projects } from "./schema";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, sql, or } from "drizzle-orm";

/**
 * Server-side function to add a new project to the database
 */
export async function createProjectServer(
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
 * Server-side function to get a project by slug
 */
export async function getProjectBySlugServer(
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
 * Server-side function to delete a project
 */
export async function deleteProjectServer(id: string): Promise<SelectProject> {
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
 * Server-side function to get all projects accessible to a user based on their tier
 * This implements the same logic as the RPC function but using Drizzle ORM
 */
export async function getAccessibleProjectsServer(
  userId: string,
  providedTier?: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    console.log(`Finding projects for user ID: ${userId}`);

    let userTier = "free"; // Default tier

    // If a tier was explicitly provided (from getUserProjects), use it
    if (providedTier) {
      userTier = providedTier;
      console.log(`Using provided tier: ${userTier}`);
    } else {
      // Otherwise try to fetch it from the profiles table
      try {
        // Try to get the user's tier using a parameterized query for better safety
        const userProfiles = await db.execute<{ tier: string }>(
          sql`SELECT tier FROM profiles WHERE user_id = ${userId}`
        );

        // If we found a profile and it has a tier, use it
        if (userProfiles && userProfiles.length > 0 && userProfiles[0].tier) {
          userTier = userProfiles[0].tier;
        }

        console.log(`User ${userId} has tier: ${userTier} (from database)`);
      } catch (error) {
        console.error("Error getting user tier, defaulting to free:", error);
        // Continue with default 'free' tier
      }
    }

    // Build the WHERE condition based on the user's tier
    let whereCondition;

    if (userTier === "diamond") {
      // Diamond tier users can access all tiers
      whereCondition = or(
        eq(projects.tier, "free"),
        eq(projects.tier, "pro"),
        eq(projects.tier, "diamond")
      );
    } else if (userTier === "pro") {
      // Pro tier users can access free and pro content
      whereCondition = or(eq(projects.tier, "free"), eq(projects.tier, "pro"));
    } else {
      // Free tier users can only access free content
      whereCondition = eq(projects.tier, "free");
    }

    // Return projects based on the tier hierarchy
    const accessibleProjects = await db
      .select()
      .from(projects)
      .where(whereCondition);

    console.log(
      `Found ${accessibleProjects.length} accessible projects for tier ${userTier}`
    );
    return accessibleProjects;
  });
}

/**
 * Server-side function to get all free projects
 */
export async function getFreeProjectsServer(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return db.select().from(projects).where(eq(projects.tier, "free"));
  });
}
