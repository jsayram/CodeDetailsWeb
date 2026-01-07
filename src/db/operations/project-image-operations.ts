/**
 * Project Image Operations
 * Database CRUD operations for project images
 */

import { executeQuery } from "../server";
import { project_images, InsertProjectImage, SelectProjectImage, ImageType } from "../schema/project_images";
import { eq, and, isNull, desc } from "drizzle-orm";

/**
 * Create a new project image record
 */
export async function createProjectImage(
  imageData: InsertProjectImage
): Promise<SelectProjectImage> {
  return await executeQuery(async (db) => {
    const result = await db
      .insert(project_images)
      .values(imageData)
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create project image");
    }

    return result[0];
  });
}

/**
 * Get all images for a project (excluding deleted)
 */
export async function getProjectImages(
  projectId: string,
  imageType?: ImageType
): Promise<SelectProjectImage[]> {
  return await executeQuery(async (db) => {
    // Build where conditions
    const whereConditions = imageType
      ? and(
          eq(project_images.project_id, projectId),
          eq(project_images.image_type, imageType),
          isNull(project_images.deleted_at)
        )
      : and(
          eq(project_images.project_id, projectId),
          isNull(project_images.deleted_at)
        );

    const result = await db
      .select()
      .from(project_images)
      .where(whereConditions)
      .orderBy(project_images.display_order, project_images.created_at);

    return result;
  });
}

/**
 * Get cover image for a project
 */
export async function getProjectCoverImage(
  projectId: string
): Promise<SelectProjectImage | null> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(project_images)
      .where(
        and(
          eq(project_images.project_id, projectId),
          eq(project_images.image_type, "cover"),
          isNull(project_images.deleted_at)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  });
}

/**
 * Get a single project image by ID
 */
export async function getProjectImageById(
  imageId: string
): Promise<SelectProjectImage | null> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(project_images)
      .where(eq(project_images.id, imageId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  });
}

/**
 * Update a project image
 */
export async function updateProjectImage(
  imageId: string,
  updates: Partial<InsertProjectImage>
): Promise<SelectProjectImage> {
  return await executeQuery(async (db) => {
    const result = await db
      .update(project_images)
      .set(updates)
      .where(eq(project_images.id, imageId))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to update project image");
    }

    return result[0];
  });
}

/**
 * Soft delete a project image
 */
export async function softDeleteProjectImage(
  imageId: string
): Promise<boolean> {
  return await executeQuery(async (db) => {
    const result = await db
      .update(project_images)
      .set({ deleted_at: new Date() })
      .where(eq(project_images.id, imageId))
      .returning();

    return result.length > 0;
  });
}

/**
 * Permanently delete a project image
 */
export async function permanentlyDeleteProjectImage(
  imageId: string
): Promise<boolean> {
  return await executeQuery(async (db) => {
    const result = await db
      .delete(project_images)
      .where(eq(project_images.id, imageId))
      .returning();

    return result.length > 0;
  });
}

/**
 * Count images by type for a project
 */
export async function countProjectImagesByType(
  projectId: string,
  imageType: ImageType
): Promise<number> {
  return await executeQuery(async (db) => {
    const result = await db
      .select()
      .from(project_images)
      .where(
        and(
          eq(project_images.project_id, projectId),
          eq(project_images.image_type, imageType),
          isNull(project_images.deleted_at)
        )
      );

    return result.length;
  });
}

/**
 * Reorder project images
 */
export async function reorderProjectImages(
  imageOrders: { imageId: string; order: number }[]
): Promise<boolean> {
  return await executeQuery(async (db) => {
    // Update display_order for each image
    const updates = imageOrders.map(({ imageId, order }) =>
      db
        .update(project_images)
        .set({ display_order: order })
        .where(eq(project_images.id, imageId))
    );

    await Promise.all(updates);
    return true;
  });
}

/**
 * Delete all images for a project (when project is deleted)
 */
export async function deleteAllProjectImages(
  projectId: string
): Promise<number> {
  return await executeQuery(async (db) => {
    const result = await db
      .delete(project_images)
      .where(eq(project_images.project_id, projectId))
      .returning();

    return result.length;
  });
}
