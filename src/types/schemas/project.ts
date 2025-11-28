/**
 * Validation Schemas for Project API
 * 
 * Using Zod for runtime validation of project data.
 * These schemas ensure type safety and provide helpful error messages.
 */

import { z } from "zod";

/**
 * Valid project categories
 */
const projectCategoryEnum = z.enum([
  "web",
  "mobile",
  "desktop",
  "backend",
  "cloud-devops",
  "data-engineering",
  "ai-ml",
  "dev-tools",
  "integration",
  "embedded-iot",
  "gaming-graphics",
  "security",
  "blockchain-web3",
  "ar-vr-xr",
  "multimedia",
  "automation-scripting",
  "database-storage",
  "testing-qa",
  "other",
]);

/**
 * Valid link types for project URLs
 */
const linkTypeEnum = z.enum([
  "repository",
  "demo",
  "documentation",
  "video",
  "figma",
  "notion",
  "slides",
  "article",
  "custom",
]);

/**
 * Schema for a single project link
 */
export const projectLinkSchema = z.object({
  type: linkTypeEnum,
  url: z.string().url("Invalid URL format"),
  label: z.string().max(100, "Label must be at most 100 characters").optional(),
});

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters")
    .transform((val) => val.trim()),
  
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens (e.g., 'my-project')"
    )
    .transform((val) => val.trim().toLowerCase()),
  
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim()),
  
  category: projectCategoryEnum.default("other"),
  
  url_links: z
    .array(projectLinkSchema)
    .max(10, "Maximum 10 links allowed")
    .optional()
    .default([]),
  
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .default([]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Schema for updating an existing project
 */
export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(100, "Title must be at most 100 characters")
    .transform((val) => val.trim())
    .optional(),
  
  slug: z
    .string()
    .min(1, "Slug cannot be empty")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .transform((val) => val.trim().toLowerCase())
    .optional(),
  
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim()),
  
  category: projectCategoryEnum.optional(),
  
  url_links: z
    .array(projectLinkSchema)
    .max(10, "Maximum 10 links allowed")
    .optional(),
  
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Schema for project query parameters
 */
export const projectQuerySchema = z.object({
  showAll: z.coerce.boolean().default(false),
  userId: z.string().optional(),
  slug: z.string().optional(),
  category: projectCategoryEnum.or(z.literal("all")).optional(),
  username: z.string().optional(),
  tags: z.array(z.string()).optional(),
  showFavorites: z.coerce.boolean().default(false),
  showDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(["newest", "oldest", "recently-edited", "popular"]).default("newest"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(0).max(100).default(20),
});

export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
