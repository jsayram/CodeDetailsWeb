/**
 * Sort Options Configuration
 * 
 * Single source of truth for project sorting options.
 * Values must match the Zod enum in types/schemas/project.ts
 */

/**
 * Valid sort values - must match the Zod enum in projectQuerySchema
 */
export const SORT_BY_VALUES = [
  "random",
  "newest",
  "oldest",
  "recently-edited",
  "popular",
  "trending",
  "alphabetical",
  "alphabetical-desc",
  "most-tagged",
  "least-favorited",
] as const;

export type SortByValue = (typeof SORT_BY_VALUES)[number];

/**
 * Labels for sort options - single source of truth for UI display
 */
export const SORT_BY_LABELS: Record<SortByValue, string> = {
  random: "Random",
  newest: "Newest First",
  oldest: "Oldest First",
  "recently-edited": "Recently Edited",
  popular: "Most Popular",
  trending: "Trending",
  alphabetical: "A-Z",
  "alphabetical-desc": "Z-A",
  "most-tagged": "Most Tagged",
  "least-favorited": "Least Popular",
};

/**
 * Sort options as array for Select components
 */
export const SORT_BY_OPTIONS = SORT_BY_VALUES.map((value) => ({
  value,
  label: SORT_BY_LABELS[value],
}));

/**
 * Default sort option
 */
export const DEFAULT_SORT_BY: SortByValue = "random";
