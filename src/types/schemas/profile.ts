/**
 * Validation Schemas for Profile API
 * 
 * Using Zod for runtime validation of request bodies.
 * These schemas ensure type safety and provide helpful error messages.
 */

import { z } from "zod";

/**
 * Schema for updating a user profile
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
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
    .max(100, "Full name must be at most 100 characters")
    .optional()
    .nullable(),
  
  first_name: z
    .string()
    .max(50, "First name must be at most 50 characters")
    .optional()
    .nullable(),
  
  last_name: z
    .string()
    .max(50, "Last name must be at most 50 characters")
    .optional()
    .nullable(),
  
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
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
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
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
    .max(100, "Full name must be at most 100 characters")
    .optional()
    .nullable(),
  
  first_name: z
    .string()
    .max(50, "First name must be at most 50 characters")
    .optional()
    .nullable(),
  
  last_name: z
    .string()
    .max(50, "Last name must be at most 50 characters")
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
