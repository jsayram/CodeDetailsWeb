/**
 * Supabase Storage Utilities
 * Helper functions for uploading, deleting, and managing project images in Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = "project-images";

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Delete result interface
 */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(
  userId: string,
  projectId: string,
  fileName: string
): string {
  // Generate UUID for filename to prevent collisions
  const uuid = crypto.randomUUID();
  const extension = fileName.split(".").pop();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);

  return `${userId}/${projectId}/${uuid}-${sanitizedName}`;
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadProjectImage(
  file: File,
  userId: string,
  projectId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "File must be an image",
      };
    }

    // Generate storage path
    const storagePath = generateStoragePath(userId, projectId, file.name);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return {
        success: false,
        error: error.message || "Failed to upload image",
      };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: storagePath,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteProjectImage(
  storagePath: string
): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error("Supabase storage delete error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete image",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteMultipleProjectImages(
  storagePaths: string[]
): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(storagePaths);

    if (error) {
      console.error("Supabase storage delete error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete images",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting images:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get the public URL for a stored image
 */
export function getProjectImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * List all images for a project
 */
export async function listProjectImages(
  userId: string,
  projectId: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`${userId}/${projectId}`);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to list images",
      };
    }

    const files = data?.map((file) => file.name) || [];

    return {
      success: true,
      files,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get image metadata from browser File object
 */
export async function getImageMetadata(
  file: File
): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
