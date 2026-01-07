import { z } from 'zod';
import { MIN_URL_LENGTH, MAX_URL_LENGTH } from '@/constants/project-limits';

/**
 * Schema for URL validation endpoint
 * Validates that the provided URL is a valid HTTP/HTTPS URL
 */
export const urlValidationRequestSchema = z.object({
  url: z
    .string()
    .min(MIN_URL_LENGTH, 'URL is required')
    .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
    .url('Invalid URL format')
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      'URL must use HTTP or HTTPS protocol'
    ),
});

// Export inferred type
export type UrlValidationRequest = z.infer<typeof urlValidationRequestSchema>;

/**
 * Format Zod errors for URL validation
 */
export function formatUrlValidationZodErrors(error: z.ZodError): Record<string, string[]> {
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
