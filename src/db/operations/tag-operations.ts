import { eq, and, inArray, sql, isNull, like, desc } from "drizzle-orm";
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
]);

export type ContentType = z.infer<typeof ContentType>;

/**
 * Interface representing a tag with its essential properties
 */
export interface TagInfo {
  id: string;
  name: string;
}

// Cache structure for tag queries
const tagQueryCache = new Map<string, { tags: TagInfo[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all tags matching a search query, with caching
 */
export async function searchTags(query: string = ''): Promise<TagInfo[]> {
  const cacheKey = query.toLowerCase();
  const now = Date.now();
  const cached = tagQueryCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.tags;
  }

  const tags = await executeQuery(async (db) => {
    const baseQuery = db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .orderBy(tags.name);

    if (query) {
      return await baseQuery.where(like(tags.name, `%${query}%`));
    }
    
    return await baseQuery;
  });

  tagQueryCache.set(cacheKey, { tags, timestamp: now });
  return tags;
}

/**
 * Get tags for a specific content item
 */
export async function getTagsForContent(
  contentType: ContentType,
  contentId: string
): Promise<TagInfo[]> {
  return await executeQuery(async (db) => {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .innerJoin(project_tags, eq(project_tags.tag_id, tags.id))
      .where(eq(project_tags.project_id, contentId))
      .orderBy(tags.name);
  });
}

/**
 * Add a tag to a content item
 */
export async function addTagToContent(
  contentType: ContentType,
  contentId: string,
  tagId: string,
  contentSlug: string
): Promise<void> {
  await executeQuery(async (db) => {
    // Check if the association already exists
    const existing = await db
      .select()
      .from(project_tags)
      .where(
        and(
          eq(project_tags.project_id, contentId),
          eq(project_tags.tag_id, tagId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(project_tags).values({
        project_id: contentId,
        project_slug: contentSlug,
        tag_id: tagId,
      });
    }
  });

  // Clear cache after modification
  tagQueryCache.clear();
}

/**
 * Remove a tag from a content item
 */
export async function removeTagFromContent(
  contentType: ContentType,
  contentId: string,
  tagId: string
): Promise<void> {
  await executeQuery(async (db) => {
    await db
      .delete(project_tags)
      .where(
        and(
          eq(project_tags.project_id, contentId),
          eq(project_tags.tag_id, tagId)
        )
      );
  });

  // Clear cache after modification
  tagQueryCache.clear();
}

/**
 * Replace all tags for a content item
 */
export async function replaceContentTags(
  contentType: ContentType,
  contentId: string,
  tagIds: string[],
  contentSlug: string
): Promise<void> {
  await executeQuery(async (db) => {
    // Get existing tags
    const existingTags = await db
      .select()
      .from(project_tags)
      .where(
        and(
          eq(project_tags.project_id, contentId),
          inArray(project_tags.tag_id, tagIds)
        )
      );

    const existingTagIds = new Set(existingTags.map((tag) => tag.tag_id));

    // Create values array for new associations
    const newAssociations = tagIds
      .filter((tagId) => !existingTagIds.has(tagId))
      .map((tagId) => ({
        project_id: contentId,
        project_slug: contentSlug,
        tag_id: tagId,
      }));

    // Remove tags that are no longer needed
    await db
      .delete(project_tags)
      .where(
        and(
          eq(project_tags.project_id, contentId),
          sql`${project_tags.tag_id} NOT IN ${tagIds}`
        )
      );

    // Add new associations if any
    if (newAssociations.length > 0) {
      await db.insert(project_tags).values(newAssociations);
    }
  });

  // Clear cache after modification
  tagQueryCache.clear();
}
