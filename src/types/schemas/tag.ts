import { z } from 'zod';
import { MAX_PROJECT_TAGS } from '@/constants/tag-constants';

// Reserved and profane words that cannot be used as tags
import { PROFANITY_LIST } from '@/constants/profanity-list';

/**
 * Tag name schema with comprehensive validation
 * - Lowercase alphanumeric with hyphens
 * - 2-50 characters
 * - No profanity
 * - No leading/trailing/consecutive hyphens
 */
export const tagNameSchema = z
  .string()
  .min(2, 'Tag must be at least 2 characters')
  .max(50, 'Tag must be at most 50 characters')
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    'Tag must be lowercase, alphanumeric with hyphens, and cannot start/end with hyphen'
  )
  .refine(
    (val) => !val.includes('--'),
    'Tag cannot contain consecutive hyphens'
  )
  .refine(
    (val) => !PROFANITY_LIST.includes(val.toLowerCase()),
    'Tag contains inappropriate content'
  );

/**
 * Tag description schema for tag submissions
 */
export const tagDescriptionSchema = z
  .string()
  .max(500, 'Description must be at most 500 characters')
  .optional();

/**
 * Array of tags with max limit validation
 */
export const tagArraySchema = z
  .array(tagNameSchema)
  .max(MAX_PROJECT_TAGS, `Maximum of ${MAX_PROJECT_TAGS} tags allowed`)
  .optional();

/**
 * Schema for submitting a new tag
 */
export const submitTagSchema = z.object({
  name: tagNameSchema,
  description: tagDescriptionSchema,
  projectId: z.string().uuid('Invalid project ID format').optional(),
});

/**
 * Schema for approving a tag submission
 */
export const approveTagSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID format'),
  approved: z.boolean(),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason must be at most 500 characters')
    .optional(),
});

/**
 * Schema for adding tags to a project
 */
export const addProjectTagsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  tags: z
    .array(tagNameSchema)
    .min(1, 'At least one tag is required')
    .max(MAX_PROJECT_TAGS, `Maximum of ${MAX_PROJECT_TAGS} tags allowed`),
});

/**
 * Schema for removing a tag from a project
 */
export const removeProjectTagSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  tagId: z.string().uuid('Invalid tag ID format'),
});

// Export types inferred from schemas
export type SubmitTagInput = z.infer<typeof submitTagSchema>;
export type ApproveTagInput = z.infer<typeof approveTagSchema>;
export type AddProjectTagsInput = z.infer<typeof addProjectTagsSchema>;
export type RemoveProjectTagInput = z.infer<typeof removeProjectTagSchema>;

/**
 * Format Zod errors for tag operations into user-friendly messages
 */
export function formatTagZodErrors(error: z.ZodError): Record<string, string[]> {
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
