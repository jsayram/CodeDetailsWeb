import { eq, and, inArray, sql, like, desc } from "drizzle-orm";
import { executeQuery } from "../server";
import { project_tags } from "../schema/project_tags";
import { tags as tagsTable } from "../schema/tags";
import { projects } from "../schema/projects";
import { z } from "zod";

export const ContentType = z.enum([
  "project",
  "tutorial",
  "page",
  "snippet",
]);

export type ContentType = z.infer<typeof ContentType>;

export interface TagInfo {
  id: string;
  name: string;
  count?: number; // Optional count for tag usage statistics
}

// Cache structure for tag queries with improved typing
const tagQueryCache = new Map<string, { tags: TagInfo[]; timestamp: number }>();
// Promise cache to prevent duplicate queries (cache stampede fix)
const pendingQueries = new Map<string, Promise<TagInfo[]>>();
const CACHE_DURATION = 30 * 1000; // 30 seconds instead of 5 minutes

// Helper to get cached tags or fetch from database
async function getOrFetchTags(query: string = ''): Promise<TagInfo[]> {
  const cacheKey = query.toLowerCase();
  const now = Date.now();
  const cached = tagQueryCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.tags;
  }

  // Check if query is already pending (prevents cache stampede)
  const pending = pendingQueries.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create and cache the query promise
  const queryPromise = executeQuery(async (db) => {
    const baseQuery = db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        count: sql<number>`COUNT(DISTINCT CASE WHEN ${project_tags.project_id} IS NOT NULL AND projects.deleted_at IS NULL THEN ${project_tags.project_id} ELSE NULL END)::int`
      })
      .from(tagsTable)
      .leftJoin(project_tags, eq(project_tags.tag_id, tagsTable.id))
      .leftJoin(projects, eq(project_tags.project_id, projects.id))
      .groupBy(tagsTable.id, tagsTable.name)
      .orderBy(desc(sql<number>`COUNT(DISTINCT CASE WHEN ${project_tags.project_id} IS NOT NULL AND projects.deleted_at IS NULL THEN ${project_tags.project_id} ELSE NULL END)`), desc(tagsTable.name))
      .limit(100); // Limit results to prevent returning thousands of tags

    if (query) {
      return await baseQuery.where(sql`${tagsTable.name} ILIKE ${`%${query}%`}`);
    }
    
    return await baseQuery;
  }).then(tags => {
    // Update cache with results
    tagQueryCache.set(cacheKey, { tags, timestamp: Date.now() });
    // Remove from pending queries
    pendingQueries.delete(cacheKey);
    return tags;
  }).catch(error => {
    // Remove from pending queries on error
    pendingQueries.delete(cacheKey);
    throw error;
  });

  // Store pending query
  pendingQueries.set(cacheKey, queryPromise);
  
  return queryPromise;
}

// Optimized tag search with caching
export async function searchTags(query: string = ''): Promise<TagInfo[]> {
  return getOrFetchTags(query);
}

// Optimized get tags for content using a single query
export async function getTagsForContent(
  contentType: ContentType,
  contentId: string
): Promise<TagInfo[]> {
  return await executeQuery(async (db) => {
    return await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
      })
      .from(tagsTable)
      .innerJoin(project_tags, eq(project_tags.tag_id, tagsTable.id))
      .where(eq(project_tags.project_id, contentId))
      .orderBy(desc(tagsTable.name))
      .limit(100); // Limit results per content
  });
}

// Helper to find or create tags in batch
export async function findOrCreateTags(tagNames: string[]): Promise<TagInfo[]> {
  return await executeQuery(async (db) => {
    return await db.transaction(async (tx) => {
      const uniqueNames = [...new Set(tagNames.map(name => name.trim()))];
      
      // First, try to find existing tags
      const existingTags = await tx
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
        })
        .from(tagsTable)
        .where(inArray(tagsTable.name, uniqueNames))
        .limit(100); // Limit batch size

      const existingTagNames = new Set(existingTags.map(tag => tag.name));
      const newTagNames = uniqueNames.filter(name => !existingTagNames.has(name));

      // Create new tags in batch if needed
      if (newTagNames.length > 0) {
        const newTags = await tx
          .insert(tagsTable)
          .values(newTagNames.map(name => ({ name })))
          .returning({
            id: tagsTable.id,
            name: tagsTable.name,
          });

        // Combine existing and new tags
        return [...existingTags, ...newTags];
      }

      return existingTags;
    });
  });
}

// Optimized replace content tags using batch operations with transaction
export async function replaceContentTags(
  contentType: ContentType,
  contentId: string,
  tagIds: string[]
): Promise<void> {
  await executeQuery(async (db) => {
    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete existing associations
      await tx
        .delete(project_tags)
        .where(eq(project_tags.project_id, contentId));

      // Create new associations in batch
      if (tagIds.length > 0) {
        await tx.insert(project_tags).values(
          tagIds.map(tagId => ({
            project_id: contentId,
            tag_id: tagId,
          }))
        );
      }
    });
  });

  // Clear cache after modification
  tagQueryCache.clear();
}

// Add a single tag to content with transaction
export async function addTagToContent(
  contentType: ContentType,
  contentId: string,
  tagId: string
): Promise<void> {
  await executeQuery(async (db) => {
    await db.transaction(async (tx) => {
      const existing = await tx
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
        await tx.insert(project_tags).values({
          project_id: contentId,
          tag_id: tagId,
        });
      }
    });
  });

  tagQueryCache.clear();
}

// Remove a single tag from content
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

  tagQueryCache.clear();
}
