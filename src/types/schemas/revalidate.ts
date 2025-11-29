import { z } from 'zod';
import { MAX_CACHE_TAG_LENGTH, MAX_CACHE_TAGS_PER_REQUEST } from '@/constants/project-limits';

/**
 * Schema for cache tag validation
 * Cache tags are simple string identifiers
 */
export const cacheTagSchema = z
  .string()
  .min(1, 'Cache tag cannot be empty')
  .max(MAX_CACHE_TAG_LENGTH, `Cache tag must be at most ${MAX_CACHE_TAG_LENGTH} characters`)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Cache tag must be alphanumeric with underscores or hyphens only'
  );

/**
 * Schema for the revalidate endpoint request body
 */
export const revalidateRequestSchema = z.object({
  tag: cacheTagSchema.optional(),
  tags: z.array(cacheTagSchema).max(MAX_CACHE_TAGS_PER_REQUEST, `Maximum of ${MAX_CACHE_TAGS_PER_REQUEST} tags allowed`).optional(),
}).refine(
  (data) => data.tag !== undefined || (data.tags !== undefined && data.tags.length > 0),
  {
    message: 'At least one tag or tags array must be provided',
    path: ['tag'],
  }
);

// Export inferred type
export type RevalidateRequest = z.infer<typeof revalidateRequestSchema>;

/**
 * Format Zod errors for revalidate operations
 */
export function formatRevalidateZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'general';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return errors;
}
