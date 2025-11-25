/**
 * Project Limits Configuration
 * Defines maximum limits for images, links, and file uploads
 */

export const PROJECT_IMAGE_LIMITS = {
  /** Maximum number of cover images per project */
  MAX_COVER_IMAGES: 1,
  
  /** Maximum number of screenshot images per project */
  MAX_SCREENSHOTS: 10,
  
  /** Maximum number of diagram images per project */
  MAX_DIAGRAMS: 5,
  
  /** Maximum number of logo images per project */
  MAX_LOGOS: 1,
  
  /** Maximum total images across all types */
  MAX_TOTAL_IMAGES: 15,
  
  /** Maximum file size in megabytes */
  MAX_FILE_SIZE_MB: 5,
  
  /** Maximum file size in bytes (computed) */
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
} as const;

export const PROJECT_LINK_LIMITS = {
  /** Maximum number of URL links per project */
  MAX_URL_LINKS: 10,
} as const;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Get maximum images allowed for a specific image type
 */
export function getMaxImagesForType(imageType: 'cover' | 'screenshot' | 'diagram' | 'logo'): number {
  switch (imageType) {
    case 'cover':
      return PROJECT_IMAGE_LIMITS.MAX_COVER_IMAGES;
    case 'screenshot':
      return PROJECT_IMAGE_LIMITS.MAX_SCREENSHOTS;
    case 'diagram':
      return PROJECT_IMAGE_LIMITS.MAX_DIAGRAMS;
    case 'logo':
      return PROJECT_IMAGE_LIMITS.MAX_LOGOS;
    default:
      return 0;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
