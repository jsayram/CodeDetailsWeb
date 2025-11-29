import { API_ROUTES } from "@/constants/api-routes";
import { searchTagsAction } from "@/app/actions/tags";
import { ProjectCategory } from "@/constants/project-categories";

/**
 * Fetcher for projects API with filters
 * Used by useProjects hook
 */
export async function projectsFetcher(url: string) {
  const response = await fetch(url);

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server responded with non-JSON content");
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch projects");
  }

  return result;
}

/**
 * Fetcher for tags using server action
 * Used by useTags hook
 */
export async function tagsFetcher(): Promise<{ id: string; name: string }[]> {
  // Server action wrapper - SWR needs a fetcher function
  const tags = await searchTagsAction("");
  return tags;
}

/**
 * Fetcher for user tier
 * Used by useUserTier hook
 */
export async function userTierFetcher(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Generate cache key for projects based on filters
 */
export function getProjectsCacheKey(params: {
  showAll?: boolean;
  userId?: string;
  username?: string;
  category?: ProjectCategory | "all";
  showFavorites?: boolean;
  showDeleted?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
  tags?: string[];
}): string {
  return API_ROUTES.PROJECTS.WITH_FILTERS(params);
}

/**
 * Cache key constants for SWR
 */
export const SWR_KEYS = {
  TAGS: "tags",
  CATEGORY_COUNTS: "category-counts",
  PROFILES: "profiles",
  USER_TIER: (userId: string) => `/api/tiers/user-tier?userId=${userId}`,
  PROJECTS: (filters: Record<string, unknown>) => 
    `projects:${JSON.stringify(filters)}`,
  DASHBOARD_STATS: "dashboard-stats",
} as const;

/**
 * Server-side cache tag constants
 * These are Next.js cache tags used with unstable_cache and revalidateTag
 */
export const CACHE_TAGS = {
  // Project-related
  PROJECTS: "projects",
  PROJECT_DETAIL: "project-detail",
  USER_PROJECTS: "user-projects",
  USER_OWN_PROJECTS: "user-own-projects",
  
  // Tag-related
  TAGS: "tags",
  TAG_SUBMISSIONS: "tag-submissions",
  
  // User-related
  USER_PROFILE: "user-profile",
  USER_TIER: "user-tier",
  USER_DASHBOARD: "user-dashboard",
  
  // Admin-related
  ADMIN_DASHBOARD: "admin-dashboard",
  CONTRIBUTORS: "contributors",
  
  // General
  DASHBOARD: "dashboard",
} as const;

/**
 * Revalidate server-side Next.js cache tags
 * Base function used by specific revalidation helpers
 */
async function revalidate(tags: string[]): Promise<void> {
  try {
    const response = await fetch(API_ROUTES.CACHE.REVALIDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    
    if (!response.ok) {
      console.error("❌ Server cache revalidation failed:", response.status);
    }
  } catch (error) {
    console.error("Failed to revalidate server cache:", error);
  }
}

/**
 * Revalidate project-related caches
 * Call after: create, update, delete, favorite, unfavorite
 */
export async function revalidateProjectCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.PROJECTS,
    CACHE_TAGS.PROJECT_DETAIL,
    CACHE_TAGS.USER_PROJECTS,
  ]);
}

/**
 * Revalidate tag-related caches
 * Call after: tag create, approve, reject, delete
 */
export async function revalidateTagCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.TAGS,
    CACHE_TAGS.PROJECTS, // Tags affect project display
  ]);
}

/**
 * Revalidate admin dashboard caches
 * Call after: admin actions, analytics updates
 */
export async function revalidateAdminCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.ADMIN_DASHBOARD,
    CACHE_TAGS.TAG_SUBMISSIONS,
    CACHE_TAGS.CONTRIBUTORS,
  ]);
}

/**
 * Revalidate user profile caches
 * Call after: profile updates, tier changes
 */
export async function revalidateUserProfileCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.USER_PROFILE,
    CACHE_TAGS.USER_DASHBOARD,
    CACHE_TAGS.USER_TIER,
  ]);
}
