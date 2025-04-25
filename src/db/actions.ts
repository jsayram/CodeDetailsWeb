"use server";

import { executeQuery } from "./server";
import { projects } from "./schema/projects";
import { profiles } from "./schema/profiles";
import { project_tags } from "./schema/project_tags";
import { tags } from "./schema/tags";
import { favorites } from "./schema/favorites";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, and, isNull, or, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Server-side function to create a new project
 */
export async function createProjectServer(
  project: InsertProject
): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    // Create the project
    const [createdProject] = await db
      .insert(projects)
      .values(project)
      .returning();

    // If there are tags, associate them with the project
    if (project.tags && project.tags.length > 0) {
      // For each tag, either get it or create it if it doesn't exist
      for (const tagName of project.tags) {
        // Check if tag exists
        let tagId = null;
        const existingTags = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.name, tagName.trim()));

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          // Create the tag
          const [createdTag] = await db
            .insert(tags)
            .values({ name: tagName.trim() })
            .returning({ id: tags.id });
          tagId = createdTag.id;
        }

        // Create a relation between project and tag
        await db.insert(project_tags).values({
          project_id: createdProject.id,
          tag_id: tagId,
        });
      }
    }

    // Return the created project with tags
    const projectWithTags = {
      ...createdProject,
      tags: project.tags || [],
    };

    return projectWithTags;
  });
}

/**
 * Helper function to get tag names for a project
 */
export async function getProjectTagNames(projectId: string): Promise<string[]> {
  return await executeQuery(async (db) => {
    return (
      await db
        .select({ tagName: tags.name })
        .from(project_tags)
        .innerJoin(tags, eq(project_tags.tag_id, tags.id))
        .where(eq(project_tags.project_id, projectId))
    ).map((tag) => tag.tagName);
  });
}

/**
 * Server-side function to get a project by slug
 */
export async function getProjectBySlugServer(
  slug: string
): Promise<SelectProject | null> {
  return await executeQuery(async (db) => {
    const projectData = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), isNull(projects.deleted_at)));

    if (!projectData.length) {
      return null;
    }

    const tags = await getProjectTagNames(projectData[0].id);
    return { ...projectData[0], tags };
  });
}

/**
 * Server-side function to soft delete a project
 */
export async function deleteProjectServer(id: string): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    // Update the project to set deleted_at timestamp
    const [updatedProject] = await db
      .update(projects)
      .set({ 
        deleted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Remove all favorites for this project since it's being sent to graveyard
    await db
      .delete(favorites)
      .where(eq(favorites.project_id, id));

    // Get the tags associated with the project
    const tags = await getProjectTagNames(id);

    // Return the soft-deleted project with its tags
    return { ...updatedProject, tags };
  });
}

/**
 * Server-side function to update a project
 */
export async function updateProjectServer(
  id: string,
  project: Partial<InsertProject>
): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    // Update the project
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...project,
        updated_at: new Date(), // Set updated_at to current time
      })
      .where(eq(projects.id, id))
      .returning();

    // If tags are provided, update the project_tags
    if (project.tags !== undefined) {
      // Remove all existing project_tags
      await db.delete(project_tags).where(eq(project_tags.project_id, id));

      // Add new project_tags
      for (const tagName of project.tags) {
        // Check if tag exists
        let tagId = null;
        const existingTags = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.name, tagName.trim()));

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          // Create the tag
          const [createdTag] = await db
            .insert(tags)
            .values({ name: tagName.trim() })
            .returning({ id: tags.id });
          tagId = createdTag.id;
        }

        // Create a relation between project and tag
        await db.insert(project_tags).values({
          project_id: updatedProject.id,
          tag_id: tagId,
        });
      }
    }

    // Get the current tags for the project
    const currentTags = await getProjectTagNames(id);

    // Return the updated project with tags
    return { ...updatedProject, tags: currentTags };
  });
}

/**
 * Server-side function to get all projects accessible to a user
 * Updated to include deleted projects
 */
export async function getAccessibleProjectsServer(
  userId: string,
  userTier?: string // Kept for backward compatibility but not used for filtering
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    console.log(`Finding projects for user ID: ${userId}`);

    // Get all projects with profile data and tags in a single query
    const projectsData = await db
      .select({
        project: projects,
        profile: {
          username: profiles.username,
          email_address: profiles.email_address,
          profile_image_url: profiles.profile_image_url
        },
        tags: sql<string[]>`array_agg(${tags.name})`
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
      .leftJoin(tags, eq(tags.id, project_tags.tag_id))
      .groupBy(projects.id, profiles.username, profiles.email_address, profiles.profile_image_url)
      .orderBy(desc(projects.created_at));

    // Map the results to the expected format
    return projectsData.map(({ project, profile, tags }) => ({
      ...project,
      tags: tags?.filter(Boolean) || [], // Filter out null values and provide empty array fallback
      owner_username: profile?.username || null,
      owner_email: profile?.email_address || null,
      owner_profile_image_url: profile?.profile_image_url || null
    }));
  });
}

/**
 * Server-side function to get projects created by a specific user
 */
export async function getUserProjectsServer(
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    // Get projects with profile data and tags in a single query
    const projectsData = await db
      .select({
        project: projects,
        profile: {
          username: profiles.username,
          email_address: profiles.email_address,
          profile_image_url: profiles.profile_image_url
        },
        tags: sql<string[]>`array_agg(${tags.name})`
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
      .leftJoin(tags, eq(tags.id, project_tags.tag_id))
      .where(eq(projects.user_id, userId))
      .groupBy(projects.id, profiles.username, profiles.email_address, profiles.profile_image_url)
      .orderBy(desc(projects.created_at));

    // Map the results to the expected format
    return projectsData.map(({ project, profile, tags }) => ({
      ...project,
      tags: tags?.filter(Boolean) || [], // Filter out null values and provide empty array fallback
      owner_username: profile?.username || null,
      owner_email: profile?.email_address || null,
      owner_profile_image_url: profile?.profile_image_url || null
    }));
  });
}

/**
 * Server-side function to check if a user owns a project
 */
export async function isProjectOwner(
  projectId: string,
  userId: string
): Promise<boolean> {
  return await executeQuery(async (db) => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));

    return result[0]?.count > 0;
  });
}
