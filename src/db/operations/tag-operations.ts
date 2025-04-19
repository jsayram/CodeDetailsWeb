import { eq, and, inArray, sql, isNull } from "drizzle-orm";
import { executeQuery } from "../server";
import { project_tags } from "../schema/project_tags";
import { tags } from "../schema/tags";
import { projects } from "../schema/projects";
import { z } from "zod";

/**
 * Supported content types for tagging
 */
export const ContentType = z.enum([
  "project",
  "tutorial",
  "page",
  "snippet",
  // Add additional content types here as your application grows
]);

export type ContentType = z.infer<typeof ContentType>;

/**
 * Interface representing a tag with its essential properties
 */
export interface TagInfo {
  id: string;
  name: string;
}

/**
 * Associates a tag with a content item
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param contentId - The UUID of the content item
 * @param tagId - The UUID of the tag to associate
 * @param contentSlug - The slug of the content item (required for projects)
 * @returns Promise resolving to the created tag entry
 */
export async function addTagToContent(
  contentType: ContentType,
  contentId: string,
  tagId: string,
  contentSlug: string
) {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      throw new Error(`Content type ${contentType} is not supported yet`);
    }

    // Check if the tag already exists for this project
    const existingTag = await executeQuery(async (db) => {
      return await db
        .select()
        .from(project_tags)
        .where(
          and(
            eq(project_tags.project_id, contentId),
            eq(project_tags.tag_id, tagId)
          )
        );
    });

    // If the association already exists, return it
    if (existingTag && existingTag.length > 0) {
      return existingTag[0];
    }

    // Otherwise create a new association
    const result = await executeQuery(async (db) => {
      const [newTag] = await db
        .insert(project_tags)
        .values({
          project_id: contentId,
          project_slug: contentSlug,
          tag_id: tagId,
        })
        .returning();
      return newTag;
    });

    return result;
  } catch (error) {
    console.error("Error adding tag to content:", error);
    throw error;
  }
}

/**
 * Removes a tag association from a content item
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param contentId - The UUID of the content item
 * @param tagId - The UUID of the tag to remove
 * @returns Promise resolving to the number of deleted records
 */
export async function removeTagFromContent(
  contentType: ContentType,
  contentId: string,
  tagId: string
) {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      throw new Error(`Content type ${contentType} is not supported yet`);
    }

    return await executeQuery(async (db) => {
      return await db
        .delete(project_tags)
        .where(
          and(
            eq(project_tags.project_id, contentId),
            eq(project_tags.tag_id, tagId)
          )
        );
    });
  } catch (error) {
    console.error("Error removing tag from content:", error);
    throw error;
  }
}

/**
 * Gets all tags associated with a specific content item
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param contentId - The UUID of the content item
 * @returns Promise resolving to an array of tags
 */
export async function getTagsForContent(
  contentType: ContentType,
  contentId: string
): Promise<TagInfo[]> {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      console.warn(
        `Content type ${contentType} is not supported yet, returning empty tag list`
      );
      return [];
    }

    return await executeQuery(async (db) => {
      return await db
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(project_tags)
        .innerJoin(tags, eq(project_tags.tag_id, tags.id))
        .where(eq(project_tags.project_id, contentId));
    });
  } catch (error) {
    console.error("Error getting tags for content:", error);
    return [];
  }
}

/**
 * Gets all projects that have a given tag
 * Currently only supports projects
 *
 * @param tagId - The UUID of the tag to search for
 * @param contentType - Optional content type filter (currently only "project" is supported)
 * @returns Promise resolving to an array of content IDs
 */
export async function getContentIdsByTag(
  tagId: string,
  contentType?: ContentType
): Promise<{ contentId: string; contentType: string }[]> {
  try {
    // Only support projects for now
    if (contentType && contentType !== "project") {
      console.warn(
        `Content type ${contentType} is not supported yet, returning empty list`
      );
      return [];
    }

    return await executeQuery(async (db) => {
      const results = await db
        .select({
          contentId: project_tags.project_id,
        })
        .from(project_tags)
        .innerJoin(projects, eq(project_tags.project_id, projects.id))
        .where(
          and(eq(project_tags.tag_id, tagId), isNull(projects.deleted_at))
        );

      // Map results to match the expected return type
      return results.map(
        (result): { contentId: string; contentType: string } => ({
          contentId: result.contentId,
          contentType: "project", // Hardcoded since we only support projects
        })
      );
    });
  } catch (error) {
    console.error("Error getting content by tag:", error);
    return [];
  }
}

/**
 * Bulk add tags to a content item
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param contentId - The UUID of the content item
 * @param tagIds - Array of tag IDs to associate
 * @param contentSlug - The slug of the content item (required for projects)
 * @returns Promise resolving when all tags are added
 */
export async function addTagsToContent(
  contentType: ContentType,
  contentId: string,
  tagIds: string[],
  contentSlug: string
) {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      throw new Error(`Content type ${contentType} is not supported yet`);
    }

    if (!tagIds.length) return [];

    return await executeQuery(async (db) => {
      return await db.transaction(async (tx) => {
        // Get existing tag associations to avoid duplicates
        const existingTags = await tx
          .select({ tagId: project_tags.tag_id })
          .from(project_tags)
          .where(
            and(
              eq(project_tags.project_id, contentId),
              inArray(project_tags.tag_id, tagIds)
            )
          );

        const existingTagIds = new Set(existingTags.map((tag) => tag.tagId));

        // Create values array for new associations
        const values = tagIds
          .filter((tagId) => !existingTagIds.has(tagId))
          .map((tagId) => ({
            project_id: contentId,
            project_slug: contentSlug,
            tag_id: tagId,
          }));

        if (values.length === 0) return [];

        // Insert new associations within the transaction
        return await tx.insert(project_tags).values(values).returning();
      });
    });
  } catch (error) {
    console.error("Error bulk adding tags:", error);
    throw error;
  }
}

/**
 * Replace all tags for a content item with a new set of tags
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param contentId - The UUID of the content item
 * @param tagIds - Array of tag IDs that should be associated
 * @param contentSlug - The slug of the content item (required for projects)
 * @returns Promise resolving when tags are replaced
 */
export async function replaceContentTags(
  contentType: ContentType,
  contentId: string,
  tagIds: string[],
  contentSlug: string
) {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      throw new Error(`Content type ${contentType} is not supported yet`);
    }

    return await executeQuery(async (db) => {
      // Begin transaction
      return await db.transaction(async (tx) => {
        // Delete all existing tag associations
        await tx
          .delete(project_tags)
          .where(eq(project_tags.project_id, contentId));

        // Skip insert if no new tags
        if (!tagIds.length) return true;

        // Create new tag associations
        const values = tagIds.map((tagId) => ({
          project_id: contentId,
          project_slug: contentSlug,
          tag_id: tagId,
        }));

        await tx.insert(project_tags).values(values);

        return true;
      });
    });
  } catch (error) {
    console.error("Error replacing content tags:", error);
    throw error;
  }
}

/**
 * Gets popular tags for a given content type
 * Currently only supports projects
 *
 * @param contentType - Type of content (currently only "project" is supported)
 * @param limit - Maximum number of tags to return
 * @returns Promise resolving to an array of tags with usage counts
 */
export async function getPopularTagsForContentType(
  contentType: ContentType,
  limit = 10
): Promise<{ id: string; name: string; count: number }[]> {
  try {
    // Only support projects for now
    if (contentType !== "project") {
      console.warn(
        `Content type ${contentType} is not supported yet, returning empty list`
      );
      return [];
    }

    return await executeQuery(async (db) => {
      return await db
        .select({
          id: tags.id,
          name: tags.name,
          count: sql<number>`count(${project_tags.id})`.as("count"),
        })
        .from(tags)
        .innerJoin(project_tags, eq(tags.id, project_tags.tag_id))
        .groupBy(tags.id, tags.name)
        .orderBy(sql`count DESC`)
        .limit(limit);
    });
  } catch (error) {
    console.error("Error getting popular tags:", error);
    return [];
  }
}
