import { z } from 'zod';
import { MAX_PROJECT_TAGS, MIN_TAG_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAG_DESCRIPTION_LENGTH, MAX_REJECTION_REASON_LENGTH } from '@/constants/project-limits';

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
  .min(MIN_TAG_NAME_LENGTH, `Tag must be at least ${MIN_TAG_NAME_LENGTH} characters`)
  .max(MAX_TAG_LENGTH, `Tag must be at most ${MAX_TAG_LENGTH} characters`)
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
  .max(MAX_TAG_DESCRIPTION_LENGTH, `Description must be at most ${MAX_TAG_DESCRIPTION_LENGTH} characters`)
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
    .max(MAX_REJECTION_REASON_LENGTH, `Rejection reason must be at most ${MAX_REJECTION_REASON_LENGTH} characters`)
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
