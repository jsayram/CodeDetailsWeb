import { executeQuery } from "@/db/server";
import { sql, eq } from "drizzle-orm";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { SelectTag } from "@/db/schema/tags";

/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

/**
 * Get all tags for a project
 * @param projectId The project ID to get tags for
 * @returns Array of tag objects with name and id
 */
export async function getProjectTags(projectId: string): Promise<SelectTag[]> {
  return executeQuery(async (db) =>
    db
      .select({
        id: tags.id,
        name: tags.name,
        created_at: tags.created_at,
        updated_at: tags.updated_at,
      })
      .from(tags)
      .innerJoin(project_tags, eq(project_tags.tag_id, tags.id))
      .where(eq(project_tags.project_id, projectId))
      .orderBy(tags.name)
  );
}

/**
 * Set tags for a project (replacing any existing ones)
 * @param projectId The project ID to set tags for
 * @param projectSlug The project slug to set tags for
 * @param tagNames Array of tag names to associate with the project
 */
export async function setProjectTags(
  projectId: string,
  projectSlug: string,
  tagNames: string[]
): Promise<void> {
  await executeQuery(async (db) => {
    // First, remove all existing tags
    await db.delete(project_tags).where(eq(project_tags.project_id, projectId));

    // Skip processing if no tags were provided
    if (!tagNames || tagNames.length === 0) return;

    // Process each tag
    for (const tagName of tagNames) {
      // Skip empty tag names
      if (!tagName.trim()) continue;

      // Find or create the tag
      let tagId: string;

      // Try to find existing tag
      const existingTag = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, tagName.trim()))
        .limit(1);

      if (existingTag.length > 0) {
        // Use existing tag
        tagId = existingTag[0].id;
      } else {
        // Create new tag
        const [newTag] = await db
          .insert(tags)
          .values({
            name: tagName.trim(),
          })
          .returning({ id: tags.id });

        tagId = newTag.id;
      }

      // Create association
      await db.insert(project_tags).values({
        project_id: projectId,
        project_slug: projectSlug,
        tag_id: tagId,
      });
    }
  });
}

/* @returns Array of all tags in the system
 */
export async function getAllTags(): Promise<SelectTag[]> {
  return executeQuery(async (db) => db.select().from(tags).orderBy(tags.name));
}

/**

/**
 * Get tag names for a project - convenient utility for backward compatibility
 * @param projectId Project ID to get tag names for 
 * @returns Array of tag names
 */
export async function getProjectTagNames(projectId: string): Promise<string[]> {
  const projectTags = await getProjectTags(projectId);
  return projectTags.map((tag) => tag.name);
}
