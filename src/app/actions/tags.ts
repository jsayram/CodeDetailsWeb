"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TagInfo,
  addTagToContent,
  removeTagFromContent,
  getTagsForContent,
  replaceContentTags,
  searchTags
} from "@/db/operations/tag-operations";
import { executeQuery } from "@/db/server";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    await addTagToContent(PROJECT_CONTENT_TYPE, projectId, tagId, projectSlug);
    revalidatePath(`/projects/${projectSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding tag to project:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add tag to project",
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
    await removeTagFromContent(PROJECT_CONTENT_TYPE, projectId, tagId);
    revalidatePath(`/projects/${projectSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing tag from project:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove tag from project",
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
    await replaceContentTags(PROJECT_CONTENT_TYPE, projectId, tagIds, projectSlug);
    revalidatePath(`/projects/${projectSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Error replacing project tags:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to replace project tags",
    };
  }
}

/**
 * Search for tags by name
 */
export async function searchTagsAction(query: string): Promise<TagInfo[]> {
  try {
    return await searchTags(query);
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
    // Validate tag name
    if (!name || !name.trim()) {
      throw new Error("Tag name cannot be empty");
    }

    // Check if tag already exists (case insensitive)
    const existingTags = await searchTags(name);
    const existingTag = existingTags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTag) {
      return {
        success: true,
        id: existingTag.id,
        name: existingTag.name,
      };
    }

    // Create new tag
    const [newTag] = await executeQuery(async (db) =>
      db
        .insert(tags)
        .values({ name: name.trim() })
        .returning()
    );

    if (!newTag) {
      throw new Error("Failed to create tag");
    }

    return {
      success: true,
      id: newTag.id,
      name: newTag.name,
    };
  } catch (error) {
    console.error("Error creating tag:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create tag",
    };
  }
}
