/**
 * Project Limits Configuration
 * Defines maximum limits for text fields, images, links, and file uploads
 * Single source of truth for all project-related limits
 */

// ============================================================================
// TEXT FIELD LIMITS
// ============================================================================

export const PROJECT_TEXT_LIMITS = {
  /** Maximum length for project title */
  MAX_TITLE_LENGTH: 100,
  
  /** Minimum length for project title */
  MIN_TITLE_LENGTH: 1,
  
  /** Maximum length for project slug */
  MAX_SLUG_LENGTH: 100,
  
  /** Minimum length for project slug */
  MIN_SLUG_LENGTH: 1,
  
  /** Maximum length for project description */
  MAX_DESCRIPTION_LENGTH: 5000,
  
  /** Maximum length for link labels */
  MAX_LINK_LABEL_LENGTH: 100,
} as const;

export const TAG_LIMITS = {
  /** Maximum length for a single tag name */
  MAX_TAG_LENGTH: 50,
  
  /** Minimum length for a single tag name */
  MIN_TAG_LENGTH: 1,
  
  /** Maximum number of tags per project */
  MAX_TAGS_PER_PROJECT: 15,
} as const;

// Convenience exports for common tag limits
export const MAX_PROJECT_TAGS = TAG_LIMITS.MAX_TAGS_PER_PROJECT;
export const MAX_TAG_LENGTH = TAG_LIMITS.MAX_TAG_LENGTH;
export const MIN_TAG_LENGTH = TAG_LIMITS.MIN_TAG_LENGTH;

// ============================================================================
// USER PROFILE LIMITS
// ============================================================================

export const USER_PROFILE_LIMITS = {
  /** Minimum username length (matches Clerk's requirement) */
  MIN_USERNAME_LENGTH: 5,
  
  /** Maximum username length (matches Clerk's requirement) */
  MAX_USERNAME_LENGTH: 64,
  
  /** Maximum length for full name */
  MAX_FULL_NAME_LENGTH: 100,
  
  /** Maximum length for first name */
  MAX_FIRST_NAME_LENGTH: 50,
  
  /** Maximum length for last name */
  MAX_LAST_NAME_LENGTH: 50,
  
  /** Maximum length for bio */
  MAX_BIO_LENGTH: 500,
} as const;

// Convenience exports for username limits
export const MIN_USERNAME_LENGTH = USER_PROFILE_LIMITS.MIN_USERNAME_LENGTH;
export const MAX_USERNAME_LENGTH = USER_PROFILE_LIMITS.MAX_USERNAME_LENGTH;
export const MAX_FULL_NAME_LENGTH = USER_PROFILE_LIMITS.MAX_FULL_NAME_LENGTH;
export const MAX_FIRST_NAME_LENGTH = USER_PROFILE_LIMITS.MAX_FIRST_NAME_LENGTH;
export const MAX_LAST_NAME_LENGTH = USER_PROFILE_LIMITS.MAX_LAST_NAME_LENGTH;
export const MAX_BIO_LENGTH = USER_PROFILE_LIMITS.MAX_BIO_LENGTH;

// ============================================================================
// IMAGE LIMITS
// ============================================================================

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
