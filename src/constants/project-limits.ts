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

// ============================================================================
// TIMING & CACHE LIMITS
// ============================================================================

export const TIMING_LIMITS = {
  /** Debounce time for search input (milliseconds) */
  SEARCH_DEBOUNCE_MS: 400,
  
  /** User sync debounce time (milliseconds) - don't sync same user more than once per 5 minutes */
  USER_SYNC_DEBOUNCE_MS: 5 * 60 * 1000, // 5 minutes
  
  /** Token refresh debounce time (milliseconds) - minimum between refreshes */
  TOKEN_REFRESH_DEBOUNCE_MS: 5 * 60 * 1000, // 5 minutes
  
  /** Token cache duration (milliseconds) */
  TOKEN_CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  
  /** Admin cache TTL (milliseconds) */
  ADMIN_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  
  /** Tag query cache duration (milliseconds) */
  TAG_CACHE_DURATION_MS: 30 * 1000, // 30 seconds
  
  /** Text typing animation speed (milliseconds per character) */
  TEXT_TYPING_SPEED_MS: 100,
  
  /** Default URL validation timeout (milliseconds) */
  URL_VALIDATION_TIMEOUT_MS: 5000, // 5 seconds
} as const;

// Convenience exports for timing limits
export const SEARCH_DEBOUNCE_MS = TIMING_LIMITS.SEARCH_DEBOUNCE_MS;
export const USER_SYNC_DEBOUNCE_MS = TIMING_LIMITS.USER_SYNC_DEBOUNCE_MS;
export const TOKEN_REFRESH_DEBOUNCE_MS = TIMING_LIMITS.TOKEN_REFRESH_DEBOUNCE_MS;
export const TOKEN_CACHE_DURATION_MS = TIMING_LIMITS.TOKEN_CACHE_DURATION_MS;
export const ADMIN_CACHE_TTL_MS = TIMING_LIMITS.ADMIN_CACHE_TTL_MS;
export const TAG_CACHE_DURATION_MS = TIMING_LIMITS.TAG_CACHE_DURATION_MS;
export const TEXT_TYPING_SPEED_MS = TIMING_LIMITS.TEXT_TYPING_SPEED_MS;
export const URL_VALIDATION_TIMEOUT_MS = TIMING_LIMITS.URL_VALIDATION_TIMEOUT_MS;

// ============================================================================
// DATABASE & QUERY LIMITS
// ============================================================================

export const DATABASE_LIMITS = {
  /** Maximum number of tags to return in a single query */
  MAX_TAGS_QUERY_RESULTS: 100,
  
  /** Maximum batch size for tag operations */
  MAX_TAG_BATCH_SIZE: 100,
  
  /** Default limit for user's projects on profile page */
  USER_PROJECTS_DEFAULT_LIMIT: 10,
  
  /** Maximum results per content when fetching tags */
  MAX_TAGS_PER_CONTENT_QUERY: 100,
} as const;

// Convenience exports for database limits
export const MAX_TAGS_QUERY_RESULTS = DATABASE_LIMITS.MAX_TAGS_QUERY_RESULTS;
export const MAX_TAG_BATCH_SIZE = DATABASE_LIMITS.MAX_TAG_BATCH_SIZE;
export const USER_PROJECTS_DEFAULT_LIMIT = DATABASE_LIMITS.USER_PROJECTS_DEFAULT_LIMIT;
export const MAX_TAGS_PER_CONTENT_QUERY = DATABASE_LIMITS.MAX_TAGS_PER_CONTENT_QUERY;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

export const VALIDATION_LIMITS = {
  /** Minimum tag name length */
  MIN_TAG_NAME_LENGTH: 2,
  
  /** Maximum tag description length */
  MAX_TAG_DESCRIPTION_LENGTH: 500,
  
  /** Maximum URL length */
  MAX_URL_LENGTH: 2048,
  
  /** Minimum URL length */
  MIN_URL_LENGTH: 1,
  
  /** Maximum cache tag length */
  MAX_CACHE_TAG_LENGTH: 100,
  
  /** Maximum cache tags per request */
  MAX_CACHE_TAGS_PER_REQUEST: 50,
  
  /** Maximum admin notes length */
  MAX_ADMIN_NOTES_LENGTH: 500,
  
  /** Maximum rejection reason length */
  MAX_REJECTION_REASON_LENGTH: 500,
} as const;

// Convenience exports for validation limits
export const MIN_TAG_NAME_LENGTH = VALIDATION_LIMITS.MIN_TAG_NAME_LENGTH;
export const MAX_TAG_DESCRIPTION_LENGTH = VALIDATION_LIMITS.MAX_TAG_DESCRIPTION_LENGTH;
export const MAX_URL_LENGTH = VALIDATION_LIMITS.MAX_URL_LENGTH;
export const MIN_URL_LENGTH = VALIDATION_LIMITS.MIN_URL_LENGTH;
export const MAX_CACHE_TAG_LENGTH = VALIDATION_LIMITS.MAX_CACHE_TAG_LENGTH;
export const MAX_CACHE_TAGS_PER_REQUEST = VALIDATION_LIMITS.MAX_CACHE_TAGS_PER_REQUEST;
export const MAX_ADMIN_NOTES_LENGTH = VALIDATION_LIMITS.MAX_ADMIN_NOTES_LENGTH;
export const MAX_REJECTION_REASON_LENGTH = VALIDATION_LIMITS.MAX_REJECTION_REASON_LENGTH;

// ============================================================================
// PAGINATION LIMITS
// ============================================================================

export const PAGINATION_LIMITS = {
  /** Default page number */
  DEFAULT_PAGE: 1,
  
  /** Maximum projects per page */
  MAX_PROJECTS_PER_PAGE: 100,
  
  /** Default projects per page */
  DEFAULT_PROJECTS_PER_PAGE: 20,
  
  /** Default users per page */
  DEFAULT_USERS_PER_PAGE: 100,
  
  /** Default limit for top contributors */
  DEFAULT_TOP_CONTRIBUTORS: 20,
  
  /** Maximum tags to show on card (desktop) */
  MAX_TAGS_ON_CARD_DESKTOP: 3,
  
  /** Maximum tags to show on card (mobile) */
  MAX_TAGS_ON_CARD_MOBILE: 2,
} as const;

// Convenience exports for pagination limits
export const DEFAULT_PAGE = PAGINATION_LIMITS.DEFAULT_PAGE;
export const MAX_PROJECTS_PER_PAGE = PAGINATION_LIMITS.MAX_PROJECTS_PER_PAGE;
export const DEFAULT_PROJECTS_PER_PAGE = PAGINATION_LIMITS.DEFAULT_PROJECTS_PER_PAGE;
export const DEFAULT_USERS_PER_PAGE = PAGINATION_LIMITS.DEFAULT_USERS_PER_PAGE;
export const DEFAULT_TOP_CONTRIBUTORS = PAGINATION_LIMITS.DEFAULT_TOP_CONTRIBUTORS;
export const MAX_TAGS_ON_CARD_DESKTOP = PAGINATION_LIMITS.MAX_TAGS_ON_CARD_DESKTOP;
export const MAX_TAGS_ON_CARD_MOBILE = PAGINATION_LIMITS.MAX_TAGS_ON_CARD_MOBILE;

