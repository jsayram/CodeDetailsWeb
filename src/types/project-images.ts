/**
 * Project Images Types
 * Type definitions for project image management
 */

import { SelectProjectImage, ImageType, AspectRatio } from "@/db/schema/project_images";

// Re-export schema types
export type { SelectProjectImage, ImageType, AspectRatio };
export { IMAGE_TYPES, ASPECT_RATIOS } from "@/db/schema/project_images";

/**
 * Image with UI state for upload tracking
 */
export interface ImageWithUploadState extends Partial<SelectProjectImage> {
  // Temporary ID for tracking during upload
  tempId?: string;
  // Upload state
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  // Preview URL (blob URL for pending uploads)
  previewUrl?: string;
  // Original file reference
  file?: File;
}

/**
 * Image upload configuration
 */
export interface ImageUploadConfig {
  maxSizeMB: number;
  allowedTypes: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Default upload config
 */
export const DEFAULT_IMAGE_UPLOAD_CONFIG: ImageUploadConfig = {
  maxSizeMB: 5, // 5MB max file size
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  maxDimensions: {
    width: 4096,
    height: 4096,
  },
};

/**
 * Image type display information
 */
export const IMAGE_TYPE_INFO: Record<
  ImageType,
  {
    label: string;
    description: string;
    icon: string;
    maxCount: number;
  }
> = {
  cover: {
    label: "Cover Image",
    description: "Main thumbnail displayed on project cards",
    icon: "Image",
    maxCount: 1,
  },
  screenshot: {
    label: "Screenshot",
    description: "Additional screenshots and demos",
    icon: "Monitor",
    maxCount: 20,
  },
  diagram: {
    label: "Diagram",
    description: "Architecture or flow diagrams",
    icon: "GitBranch",
    maxCount: 10,
  },
  logo: {
    label: "Logo",
    description: "Project or company logo",
    icon: "Sparkles",
    maxCount: 1,
  },
};

/**
 * Gallery display mode
 */
export type GalleryDisplayMode = "grid" | "carousel" | "blog";

/**
 * Aspect ratio display info
 */
export const ASPECT_RATIO_INFO: Record<
  AspectRatio,
  {
    label: string;
    description: string;
    cssClass: string;
  }
> = {
  auto: {
    label: "Auto",
    description: "Use original image dimensions",
    cssClass: "aspect-auto",
  },
  "16:9": {
    label: "16:9",
    description: "Widescreen (landscape)",
    cssClass: "aspect-video",
  },
  "4:3": {
    label: "4:3",
    description: "Standard (classic)",
    cssClass: "aspect-[4/3]",
  },
  "1:1": {
    label: "1:1",
    description: "Square",
    cssClass: "aspect-square",
  },
};

/**
 * Image gallery props
 */
export interface ImageGalleryProps {
  images: SelectProjectImage[];
  isEditing?: boolean;
  displayMode?: GalleryDisplayMode;
  onImageClick?: (image: SelectProjectImage, index: number) => void;
  onImageDelete?: (imageId: string) => void;
  onSetCover?: (imageId: string) => void;
  onReorder?: (imageOrders: { imageId: string; order: number }[]) => void;
  className?: string;
}

/**
 * Image modal props
 */
export interface ImageModalProps {
  images: SelectProjectImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Image uploader props
 */
export interface ImageUploaderProps {
  projectId: string;
  userId: string;
  imageType: ImageType;
  onUploadComplete?: (image: SelectProjectImage) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Validation result for image upload
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an image file before upload
 */
export function validateImageFile(
  file: File,
  config: ImageUploadConfig = DEFAULT_IMAGE_UPLOAD_CONFIG
): ImageValidationResult {
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.allowedTypes.map((t) => t.replace("image/", "")).join(", ")}`,
    };
  }

  // Check file size
  const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${config.maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
