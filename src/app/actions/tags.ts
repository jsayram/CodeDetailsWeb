"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TagInfo,
  addTagToContent,
  removeTagFromContent,
  getTagsForContent,
  replaceContentTags,
} from "@/db/operations/tag-operations";
import { executeQuery } from "@/db/server";
import { tags } from "@/db/schema";
import { eq, like, sql } from "drizzle-orm";

// Fixed content type for this file
const PROJECT_CONTENT_TYPE = "project" as const;

/**
 * Fetch tags for a specific project
 */
export async function fetchProjectTags(projectId: string): Promise<TagInfo[]> {
  try {
    return await getTagsForContent(PROJECT_CONTENT_TYPE, projectId);
  } catch (error) {
    console.error("Error fetching project tags:", error);
    return [];
  }
}

/**
 * Add a tag to a project
 */
export async function addTagToProjectAction(
  projectId: string,
  tagId: string,
  projectSlug: string
) {
  try {
    // Add tag to project
    await addTagToContent(PROJECT_CONTENT_TYPE, projectId, tagId, projectSlug);

    // Revalidate the project path to update UI
    revalidatePath(`/projects/${projectSlug}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error adding tag to project:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to add tag to project",
    };
  }
}

/**
 * Remove a tag from a project
 */
export async function removeTagFromProjectAction(
  projectId: string,
  tagId: string,
  projectSlug: string
) {
  try {
    // Remove tag from project
    await removeTagFromContent(PROJECT_CONTENT_TYPE, projectId, tagId);

    // Revalidate the project path to update UI
    revalidatePath(`/projects/${projectSlug}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing tag from project:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove tag from project",
    };
  }
}

/**
 * Replace all tags for a project
 */
export async function replaceProjectTagsAction(
  projectId: string,
  tagIds: string[],
  projectSlug: string
) {
  try {
    // Replace project tags
    await replaceContentTags(
      PROJECT_CONTENT_TYPE,
      projectId,
      tagIds,
      projectSlug
    );

    // Revalidate the project path to update UI
    revalidatePath(`/projects/${projectSlug}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error replacing project tags:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to replace project tags",
    };
  }
}

/**
 * Search for tags by name
 */
export async function searchTagsAction(query: string): Promise<TagInfo[]> {
  try {
    // Search for tags that match the query in name using case-insensitive pattern matching
    return await executeQuery(async (db) => {
      return await db
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(tags)
        .where(sql`${tags.name} ILIKE ${`%${query}%`}`)
        .limit(20);
    });
  } catch (error) {
    console.error("Error searching tags:", error);
    return [];
  }
}

/**
 * Create a new tag
 */
export async function createTagAction(name: string) {
  try {
    // Validate and sanitize the tag name
    const tagName = z.string().min(1).max(50).parse(name.trim());

    return await executeQuery(async (db) => {
      // Check if the tag already exists
      const existingTags = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, tagName))
        .limit(1);

      const existingTag = existingTags[0];

      if (existingTag) {
        return {
          success: true,
          id: existingTag.id,
          isNew: false,
        };
      }

      // Create the new tag
      const [newTag] = await db
        .insert(tags)
        .values({
          name: tagName,
        })
        .returning({ id: tags.id });

      return {
        success: true,
        id: newTag.id,
        isNew: true,
      };
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create tag",
    };
  }
}
