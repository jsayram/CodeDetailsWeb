/**
 * Validation Schemas for Project API
 * 
 * Using Zod for runtime validation of project data.
 * These schemas ensure type safety and provide helpful error messages.
 */

import { z } from "zod";
import { 
  PROJECT_TEXT_LIMITS, 
  TAG_LIMITS, 
  PROJECT_LINK_LIMITS,
  DEFAULT_PAGE,
  MAX_PROJECTS_PER_PAGE,
  DEFAULT_PROJECTS_PER_PAGE
} from "@/constants/project-limits";
import { PROFANITY_LIST } from "@/constants/profanity-list";

/**
 * Helper function to check if text contains profanity
 */
function containsProfanity(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = text.toLowerCase().trim();
  return PROFANITY_LIST.some((word) => {
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return wordRegex.test(normalized);
  });
}

/**
 * Helper function to check category data for profanity
 */
function checkCategoryDataForProfanity(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  
  for (const value of Object.values(data)) {
    if (typeof value === "string" && containsProfanity(value)) {
      return true;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && containsProfanity(item)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

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
  label: z.string().max(PROJECT_TEXT_LIMITS.MAX_LINK_LABEL_LENGTH, `Label must be at most ${PROJECT_TEXT_LIMITS.MAX_LINK_LABEL_LENGTH} characters`).optional(),
});

/**
 * Schema for category-specific field data
 * Stores dynamic fields as key-value pairs
 * Validates for profanity
 */
export const categoryDataSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .nullable()
  .refine(
    (data) => !checkCategoryDataForProfanity(data),
    "Project details contain inappropriate content"
  );

/**
 * Schema for field ordering
 * Array of field IDs in display order
 */
export const fieldOrderSchema = z.array(z.string()).optional().nullable();

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(PROJECT_TEXT_LIMITS.MIN_TITLE_LENGTH, "Title is required")
    .max(PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH, `Title must be at most ${PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH} characters`)
    .transform((val) => val.trim())
    .refine(
      (val) => !containsProfanity(val),
      "Title contains inappropriate content"
    ),
  
  slug: z
    .string()
    .min(PROJECT_TEXT_LIMITS.MIN_SLUG_LENGTH, "Slug is required")
    .max(PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH, `Slug must be at most ${PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH} characters`)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens (e.g., 'my-project')"
    )
    .transform((val) => val.trim().toLowerCase())
    .refine(
      (val) => !containsProfanity(val.replace(/-/g, " ")),
      "Slug contains inappropriate content"
    ),
  
  description: z
    .string()
    .max(PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH, `Description must be at most ${PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`)
    .optional()
    .nullable()
    .transform((val) => val?.trim())
    .refine(
      (val) => !val || !containsProfanity(val),
      "Description contains inappropriate content"
    ),
  
  category: projectCategoryEnum.default("other"),
  
  url_links: z
    .array(projectLinkSchema)
    .max(PROJECT_LINK_LIMITS.MAX_URL_LINKS, `Maximum ${PROJECT_LINK_LIMITS.MAX_URL_LINKS} links allowed`)
    .optional()
    .default([]),
  
  tags: z
    .array(
      z.string()
        .min(TAG_LIMITS.MIN_TAG_LENGTH)
        .max(TAG_LIMITS.MAX_TAG_LENGTH)
        .refine(
          (val) => !containsProfanity(val),
          "Tag contains inappropriate content"
        )
    )
    .max(TAG_LIMITS.MAX_TAGS_PER_PROJECT, `Maximum ${TAG_LIMITS.MAX_TAGS_PER_PROJECT} tags allowed`)
    .optional()
    .default([]),

  category_data: categoryDataSchema,
  
  field_order: fieldOrderSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Schema for updating an existing project
 */
export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(PROJECT_TEXT_LIMITS.MIN_TITLE_LENGTH, "Title cannot be empty")
    .max(PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH, `Title must be at most ${PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH} characters`)
    .transform((val) => val.trim())
    .refine(
      (val) => !containsProfanity(val),
      "Title contains inappropriate content"
    )
    .optional(),
  
  slug: z
    .string()
    .min(PROJECT_TEXT_LIMITS.MIN_SLUG_LENGTH, "Slug cannot be empty")
    .max(PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH, `Slug must be at most ${PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH} characters`)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .transform((val) => val.trim().toLowerCase())
    .optional(),
  
  description: z
    .string()
    .max(PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH, `Description must be at most ${PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`)
    .optional()
    .nullable()
    .transform((val) => val?.trim())
    .refine(
      (val) => !val || !containsProfanity(val),
      "Description contains inappropriate content"
    ),
  
  category: projectCategoryEnum.optional(),
  
  url_links: z
    .array(projectLinkSchema)
    .max(PROJECT_LINK_LIMITS.MAX_URL_LINKS, `Maximum ${PROJECT_LINK_LIMITS.MAX_URL_LINKS} links allowed`)
    .optional(),
  
  tags: z
    .array(
      z.string()
        .min(TAG_LIMITS.MIN_TAG_LENGTH)
        .max(TAG_LIMITS.MAX_TAG_LENGTH)
        .refine(
          (val) => !containsProfanity(val),
          "Tag contains inappropriate content"
        )
    )
    .max(TAG_LIMITS.MAX_TAGS_PER_PROJECT, `Maximum ${TAG_LIMITS.MAX_TAGS_PER_PROJECT} tags allowed`)
    .optional(),

  category_data: categoryDataSchema,
  
  field_order: fieldOrderSchema,
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
  sortBy: z.enum([
    "newest",
    "oldest",
    "recently-edited",
    "popular",
    "alphabetical",
    "alphabetical-desc",
    "most-tagged",
    "least-favorited",
    "trending",
    "random"
  ]).default("random"),
  page: z.coerce.number().min(DEFAULT_PAGE).default(DEFAULT_PAGE),
  limit: z.coerce.number().min(0).max(MAX_PROJECTS_PER_PAGE).default(DEFAULT_PROJECTS_PER_PAGE),
});

export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;

/**
 * Schema for shared projects query parameters (public profile pages)
 */
export const sharedProjectsQuerySchema = z.object({
  page: z.coerce.number().min(DEFAULT_PAGE).default(DEFAULT_PAGE),
  limit: z.coerce.number().min(1).max(MAX_PROJECTS_PER_PAGE).default(DEFAULT_PROJECTS_PER_PAGE),
  category: projectCategoryEnum.or(z.literal("all")).optional(),
  sortBy: z.enum([
    "newest",
    "oldest",
    "recently-edited",
    "popular",
    "alphabetical",
    "alphabetical-desc",
    "most-tagged",
    "least-favorited",
    "trending",
    "random"
  ]).default("random"),
});

export type SharedProjectsQueryInput = z.infer<typeof sharedProjectsQuerySchema>;

/**
 * Helper to parse URLSearchParams into a plain object for Zod validation
 */
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  
  searchParams.forEach((value, key) => {
    const existing = result[key];
    if (existing !== undefined) {
      // Handle array values (e.g., multiple tags)
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  });
  
  return result;
}
