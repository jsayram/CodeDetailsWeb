"use server";

import { executeQuery } from "./server";
import { projects } from "./schema/projects";
import { profiles } from "./schema/profiles";
import { project_tags } from "./schema/project_tags";
import { tags } from "./schema/tags";
import { InsertProject, SelectProject } from "./schema/projects";
import { eq, and, isNull, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Server-side function to create a new project
 */
export async function createProjectServer(
  project: InsertProject
): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    // Create the project
    const [createdProject] = await db.insert(projects).values(project).returning();

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
          project_slug: createdProject.slug,
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
export async function getProjectTagNames(
  projectId: string
): Promise<string[]> {
  return await executeQuery(async (db) => {
    const projectTags = await db
      .select({
        tagName: tags.name,
      })
      .from(project_tags)
      .innerJoin(tags, eq(project_tags.tag_id, tags.id))
      .where(eq(project_tags.project_id, projectId));

    return projectTags.map((tag) => tag.tagName);
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
      .where(eq(projects.slug, slug));

    if (!projectData.length) {
      return null;
    }

    const tags = await getProjectTagNames(projectData[0].id);

    return { ...projectData[0], tags };
  });
}

/**
 * Server-side function to delete a project
 */
export async function deleteProjectServer(id: string): Promise<SelectProject> {
  return await executeQuery(async (db) => {
    // First, get the project to return it later
    const projectData = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!projectData.length) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Get the tags associated with the project before deleting
    const tags = await getProjectTagNames(id);

    // Explicitly delete project_tags entries first to ensure they're removed
    // This should be redundant with cascade delete but will ensure they're deleted
    await db.delete(project_tags).where(eq(project_tags.project_id, id));
    
    // Then delete the project
    await db.delete(projects).where(eq(projects.id, id));

    // Return the deleted project with tags
    return { ...projectData[0], tags };
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
          project_slug: updatedProject.slug,
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
 * Updated to not filter by tier anymore - all projects are accessible
 */
export async function getAccessibleProjectsServer(
  userId: string,
  userTier?: string // Kept for backward compatibility but not used for filtering
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    console.log(`Finding projects for user ID: ${userId}`);

    // Get all projects that are not soft-deleted
    const allProjects = await db.select().from(projects).where(isNull(projects.deleted_at));

    // Fetch tags and owner info for each project and map to the final structure
    const projectsWithTagsAndOwner = await Promise.all(
      allProjects.map(async (projectData) => {
        const tags = await getProjectTagNames(projectData.id);
        
        // Get profile information for the project's creator
        let ownerProfile = null;
        if (projectData.user_id) {
          const ownerProfiles = await db
            .select()
            .from(profiles)
            .where(eq(profiles.user_id, projectData.user_id));
          
          ownerProfile = ownerProfiles.length > 0 ? ownerProfiles[0] : null;
        }
        
        return {
          ...projectData,
          tags,
          owner_username: ownerProfile?.username || null,
          owner_email: ownerProfile?.email_address || null,
          owner_profile_image_url: ownerProfile?.profile_image_url || null
        };
      })
    );

    console.log(`Found ${projectsWithTagsAndOwner.length} projects`);
    return projectsWithTagsAndOwner;
  });
}

/**
 * Server-side function to get projects created by a specific user
 */
export async function getUserProjectsServer(
  userId: string
): Promise<SelectProject[]> {
  return await executeQuery(async (db) => {
    const userProjects = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.user_id, userId),
        isNull(projects.deleted_at)
      ));

    // Fetch tags and owner profile info for each project
    const projectsWithTagsAndOwner = await Promise.all(
      userProjects.map(async (projectData) => {
        const tags = await getProjectTagNames(projectData.id);
        
        // Get profile information for the project's creator
        let ownerProfile = null;
        if (projectData.user_id) {
          const ownerProfiles = await db
            .select()
            .from(profiles)
            .where(eq(profiles.user_id, projectData.user_id));
          
          ownerProfile = ownerProfiles.length > 0 ? ownerProfiles[0] : null;
        }
        
        return {
          ...projectData,
          tags,
          owner_username: ownerProfile?.username || null,
          owner_email: ownerProfile?.email_address || null,
          owner_profile_image_url: ownerProfile?.profile_image_url || null
        };
      })
    );

    return projectsWithTagsAndOwner;
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
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.user_id, userId)
        )
      );

    return result[0]?.count > 0;
  });
}
