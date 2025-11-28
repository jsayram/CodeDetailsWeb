import { z } from 'zod';

/**
 * Schema for cache tag validation
 * Cache tags are simple string identifiers
 */
export const cacheTagSchema = z
  .string()
  .min(1, 'Cache tag cannot be empty')
  .max(100, 'Cache tag must be at most 100 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Cache tag must be alphanumeric with underscores or hyphens only'
  );

/**
 * Schema for the revalidate endpoint request body
 */
export const revalidateRequestSchema = z.object({
  tag: cacheTagSchema.optional(),
  tags: z.array(cacheTagSchema).max(50, 'Maximum of 50 tags allowed').optional(),
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
