/**
 * Validation Schemas for Profile API
 * 
 * Using Zod for runtime validation of request bodies.
 * These schemas ensure type safety and provide helpful error messages.
 */

import { z } from "zod";
import { 
  MIN_USERNAME_LENGTH, 
  MAX_USERNAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_BIO_LENGTH,
} from "@/constants/project-limits";

/**
 * Schema for updating a user profile
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
    .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .optional(),
  
  email_address: z
    .string()
    .email("Invalid email address format")
    .optional(),
  
  profile_image_url: z
    .string()
    .url("Invalid URL format for profile image")
    .optional()
    .nullable(),
  
  full_name: z
    .string()
    .max(MAX_FULL_NAME_LENGTH, `Full name must be at most ${MAX_FULL_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
  
  first_name: z
    .string()
    .max(MAX_FIRST_NAME_LENGTH, `First name must be at most ${MAX_FIRST_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
  
  last_name: z
    .string()
    .max(MAX_LAST_NAME_LENGTH, `Last name must be at most ${MAX_LAST_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
  
  bio: z
    .string()
    .max(MAX_BIO_LENGTH, `Bio must be at most ${MAX_BIO_LENGTH} characters`)
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for creating a new profile (typically done via Clerk webhook)
 */
export const createProfileSchema = z.object({
  user_id: z
    .string()
    .min(1, "User ID is required"),
  
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
    .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  
  email_address: z
    .string()
    .email("Invalid email address format"),
  
  profile_image_url: z
    .string()
    .url("Invalid URL format for profile image")
    .optional()
    .nullable(),
  
  full_name: z
    .string()
    .max(MAX_FULL_NAME_LENGTH, `Full name must be at most ${MAX_FULL_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
  
  first_name: z
    .string()
    .max(MAX_FIRST_NAME_LENGTH, `First name must be at most ${MAX_FIRST_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
  
  last_name: z
    .string()
    .max(MAX_LAST_NAME_LENGTH, `Last name must be at most ${MAX_LAST_NAME_LENGTH} characters`)
    .optional()
    .nullable(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

/**
 * Convert Zod errors to FieldError format for API responses
 */
export function formatZodErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
  received?: unknown;
}> {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    received: "input" in err ? err.input : undefined,
  }));
}
