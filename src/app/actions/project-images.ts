"use server";

/**
 * Project Images Server Actions
 * RFC 7807 compliant server actions for managing project images
 */

import { auth } from "@clerk/nextjs/server";
import {
  createProjectImage,
  getProjectImages,
  getProjectCoverImage,
  getProjectImageById,
  updateProjectImage,
  softDeleteProjectImage,
  permanentlyDeleteProjectImage,
  reorderProjectImages,
  countProjectImagesByType,
} from "@/db/operations/project-image-operations";
import { getProjectById } from "@/app/actions/projects";
import {
  InsertProjectImage,
  SelectProjectImage,
  ImageType,
  IMAGE_TYPES,
} from "@/db/schema/project_images";
import {
  type ActionResult,
  actionSuccess,
  unauthorizedError,
  notFoundError,
  validationError,
  serverError,
  forbiddenError,
} from "@/lib/action-errors";

// =============================================================================
// Types
// =============================================================================

export interface ImageUploadInput {
  projectId: string;
  storagePath: string;
  storageUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  imageType: ImageType;
  altText?: string;
  caption?: string;
}

export interface ImageUpdateInput {
  altText?: string;
  caption?: string;
  imageType?: ImageType;
  displayOrder?: number;
}

// =============================================================================
// Image Limits by Type
// =============================================================================

const IMAGE_LIMITS: Record<ImageType, number> = {
  cover: 1, // Only 1 cover image allowed
  screenshot: 20, // Up to 20 screenshots
  diagram: 10, // Up to 10 diagrams
  logo: 1, // Only 1 logo
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Verify user owns the project
 */
async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<{ owned: boolean; project?: Awaited<ReturnType<typeof getProjectById>> }> {
  const project = await getProjectById(projectId);

  if (!project) {
    return { owned: false };
  }

  return {
    owned: project.user_id === userId,
    project,
  };
}

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Create a new project image record after upload
 */
export async function createProjectImageAction(
  input: ImageUploadInput
): Promise<ActionResult<SelectProjectImage>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to upload images");
    }

    // Validate image type
    if (!IMAGE_TYPES.includes(input.imageType)) {
      return validationError(`Invalid image type. Must be one of: ${IMAGE_TYPES.join(", ")}`);
    }

    // Verify project ownership
    const { owned, project } = await verifyProjectOwnership(input.projectId, userId);

    if (!project) {
      return notFoundError("Project");
    }

    if (!owned) {
      return forbiddenError("You do not have permission to add images to this project");
    }

    // Check image count limit
    const currentCount = await countProjectImagesByType(input.projectId, input.imageType);
    const limit = IMAGE_LIMITS[input.imageType];

    if (currentCount >= limit) {
      return validationError(
        `Maximum ${limit} ${input.imageType} image(s) allowed. Please delete an existing image first.`
      );
    }

    // Create the image record
    const imageData: InsertProjectImage = {
      project_id: input.projectId,
      storage_path: input.storagePath,
      storage_url: input.storageUrl,
      file_name: input.fileName,
      file_size: input.fileSize ?? null,
      mime_type: input.mimeType ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      image_type: input.imageType,
      alt_text: input.altText ?? null,
      caption: input.caption ?? null,
      uploaded_by: userId,
      display_order: currentCount, // Add at end
    };

    const image = await createProjectImage(imageData);

    return actionSuccess(image);
  } catch (error) {
    console.error("Error creating project image:", error);
    return serverError(error, "Failed to create image");
  }
}

/**
 * Get all images for a project
 */
export async function getProjectImagesAction(
  projectId: string,
  imageType?: ImageType
): Promise<ActionResult<SelectProjectImage[]>> {
  try {
    // No auth required for viewing public project images
    const images = await getProjectImages(projectId, imageType);
    return actionSuccess(images);
  } catch (error) {
    console.error("Error fetching project images:", error);
    return serverError(error, "Failed to fetch images");
  }
}

/**
 * Get cover image for a project
 */
export async function getProjectCoverImageAction(
  projectId: string
): Promise<ActionResult<SelectProjectImage | null>> {
  try {
    const coverImage = await getProjectCoverImage(projectId);
    return actionSuccess(coverImage);
  } catch (error) {
    console.error("Error fetching cover image:", error);
    return serverError(error, "Failed to fetch cover image");
  }
}

/**
 * Update a project image
 */
export async function updateProjectImageAction(
  imageId: string,
  updates: ImageUpdateInput
): Promise<ActionResult<SelectProjectImage>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to update images");
    }

    // Get the image to verify ownership
    const existingImage = await getProjectImageById(imageId);

    if (!existingImage) {
      return notFoundError("Image");
    }

    // Verify project ownership
    const { owned } = await verifyProjectOwnership(existingImage.project_id, userId);

    if (!owned) {
      return forbiddenError("You do not have permission to update this image");
    }

    // Validate image type if provided
    if (updates.imageType && !IMAGE_TYPES.includes(updates.imageType)) {
      return validationError(`Invalid image type. Must be one of: ${IMAGE_TYPES.join(", ")}`);
    }

    // If changing to cover and there's already a cover, prevent it
    if (updates.imageType === "cover" && existingImage.image_type !== "cover") {
      const existingCover = await getProjectCoverImage(existingImage.project_id);
      if (existingCover) {
        return validationError("A cover image already exists. Please remove it first.");
      }
    }

    const updatedImage = await updateProjectImage(imageId, updates);

    return actionSuccess(updatedImage);
  } catch (error) {
    console.error("Error updating project image:", error);
    return serverError(error, "Failed to update image");
  }
}

/**
 * Set an image as the cover image
 */
export async function setProjectCoverImageAction(
  imageId: string
): Promise<ActionResult<SelectProjectImage>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to set cover image");
    }

    // Get the image
    const image = await getProjectImageById(imageId);

    if (!image) {
      return notFoundError("Image");
    }

    // Verify ownership
    const { owned } = await verifyProjectOwnership(image.project_id, userId);

    if (!owned) {
      return forbiddenError("You do not have permission to set cover image");
    }

    // Get existing cover and demote it
    const existingCover = await getProjectCoverImage(image.project_id);
    if (existingCover && existingCover.id !== imageId) {
      await updateProjectImage(existingCover.id, { image_type: "screenshot" });
    }

    // Set new cover
    const updatedImage = await updateProjectImage(imageId, { image_type: "cover" });

    return actionSuccess(updatedImage);
  } catch (error) {
    console.error("Error setting cover image:", error);
    return serverError(error, "Failed to set cover image");
  }
}

/**
 * Delete a project image (soft delete)
 */
export async function deleteProjectImageAction(
  imageId: string
): Promise<ActionResult<boolean>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to delete images");
    }

    // Get the image
    const image = await getProjectImageById(imageId);

    if (!image) {
      return notFoundError("Image");
    }

    // Verify ownership
    const { owned } = await verifyProjectOwnership(image.project_id, userId);

    if (!owned) {
      return forbiddenError("You do not have permission to delete this image");
    }

    await softDeleteProjectImage(imageId);

    return actionSuccess(true);
  } catch (error) {
    console.error("Error deleting project image:", error);
    return serverError(error, "Failed to delete image");
  }
}

/**
 * Permanently delete a project image (also removes from storage)
 */
export async function permanentlyDeleteProjectImageAction(
  imageId: string
): Promise<ActionResult<{ storagePath: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to permanently delete images");
    }

    // Get the image
    const image = await getProjectImageById(imageId);

    if (!image) {
      return notFoundError("Image");
    }

    // Verify ownership
    const { owned } = await verifyProjectOwnership(image.project_id, userId);

    if (!owned) {
      return forbiddenError("You do not have permission to permanently delete this image");
    }

    // Store path before deletion for cleanup
    const storagePath = image.storage_path;

    await permanentlyDeleteProjectImage(imageId);

    // Return the storage path so caller can delete from storage
    return actionSuccess({ storagePath });
  } catch (error) {
    console.error("Error permanently deleting project image:", error);
    return serverError(error, "Failed to permanently delete image");
  }
}

/**
 * Reorder project images
 */
export async function reorderProjectImagesAction(
  projectId: string,
  imageOrders: { imageId: string; order: number }[]
): Promise<ActionResult<boolean>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError("Authentication required to reorder images");
    }

    // Verify ownership
    const { owned } = await verifyProjectOwnership(projectId, userId);

    if (!owned) {
      return forbiddenError("You do not have permission to reorder images for this project");
    }

    await reorderProjectImages(imageOrders);

    return actionSuccess(true);
  } catch (error) {
    console.error("Error reordering project images:", error);
    return serverError(error, "Failed to reorder images");
  }
}

/**
 * Get image count by type for a project
 */
export async function getImageCountAction(
  projectId: string,
  imageType: ImageType
): Promise<ActionResult<{ count: number; limit: number }>> {
  try {
    const count = await countProjectImagesByType(projectId, imageType);
    const limit = IMAGE_LIMITS[imageType];

    return actionSuccess({ count, limit });
  } catch (error) {
    console.error("Error getting image count:", error);
    return serverError(error, "Failed to get image count");
  }
}
