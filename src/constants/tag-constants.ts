// Re-export from project-limits for backward compatibility
// All tag limits are now defined in project-limits.ts as the single source of truth
import { TAG_LIMITS } from "./project-limits";

export const MAX_PROJECT_TAGS = TAG_LIMITS.MAX_TAGS_PER_PROJECT;
export const MAX_TAG_LENGTH = TAG_LIMITS.MAX_TAG_LENGTH;
export const MIN_TAG_LENGTH = TAG_LIMITS.MIN_TAG_LENGTH;