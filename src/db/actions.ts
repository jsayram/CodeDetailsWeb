"use server";

import { executeQuery } from "./server";
import { projects } from "./schema";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, sql, or, not, and } from "drizzle-orm";

/**
 * Helper function to check if a project with the given slug already exists
 */
export async function checkSlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  return await executeQuery(async (db) => {
    const query = db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(
        excludeId
          ? and(eq(projects.slug, slug), not(eq(projects.id, excludeId)))
          : eq(projects.slug, slug)
      );

    const result = await query;
    return result[0].count > 0;
  });
}

/**
 * Helper function to check if a project with the given title already exists
 */
export async function checkTitleExists(
  title: string,
  excludeId?: string
): Promise<boolean> {
  return await executeQuery(async (db) => {
    const query = db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(
        excludeId
          ? and(eq(projects.title, title), not(eq(projects.id, excludeId)))
          : eq(projects.title, title)
      );

    const result = await query;
    return result[0].count > 0;
  });
}

/**
 * Server-side function to add a new project to the database
 */
export async function createProjectServer(
  project: InsertProject
): Promise<SelectProject> {
  // Check for duplicate slug
  const slugExists = await checkSlugExists(project.slug);
  if (slugExists) {
    throw new Error(`A project with slug "${project.slug}" already exists`);
  }

  // Check for duplicate title
  const titleExists = await checkTitleExists(project.title);
  if (titleExists) {
    throw new Error(`A project with title "${project.title}" already exists`);
  }

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
 * Server-side function to update a project
 */
export async function updateProjectServer(
  id: string,
  project: Partial<InsertProject>
): Promise<SelectProject> {
  // Check for duplicate slug if slug is being updated
  if (project.slug) {
    const slugExists = await checkSlugExists(project.slug, id);
    if (slugExists) {
      throw new Error(`A project with slug "${project.slug}" already exists`);
    }
  }

  // Check for duplicate title if title is being updated
  if (project.title) {
    const titleExists = await checkTitleExists(project.title, id);
    if (titleExists) {
      throw new Error(`A project with title "${project.title}" already exists`);
    }
  }

  return await executeQuery(async (db) => {
    const result = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Project not found or could not be updated");
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

/**
 * Server-side function to get all pro tier projects
 */
export async function getProProjectsServer(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return db.select().from(projects).where(eq(projects.tier, "pro"));
  });
}

/**
 * Server-side function to get all diamond tier projects
 */
export async function getDiamondProjectsServer(): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return db.select().from(projects).where(eq(projects.tier, "diamond"));
  });
}

/**
 * Server-side function to get projects by specific tier
 */
export async function getProjectsByTierServer(
  tier: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    return db.select().from(projects).where(eq(projects.tier, tier));
  });
}
