import { Project } from "@/types/models/project";
import { ValidTier } from "@/services/tierServiceServer";
import { API_ROUTES } from "@/constants/api-routes";

// In-memory cache for additional performance
const memoryCache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

/**
 * Check if data exists in memory cache - no time-based validation
 */
function getFromMemoryCache<T>(key: string): T | null {
  const cached = memoryCache[key];
  if (cached) {
    console.log(`📦 Using memory cache for ${key}`);
    return cached.data as T;
  }
  return null;
}

/**
 * Store data in memory cache
 */
function setInMemoryCache<T>(key: string, data: T): void {
  memoryCache[key] = {
    data,
    timestamp: Date.now(),
  };
  console.log(`💾 Stored in memory cache: ${key}`);
}

type CacheResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Fetch projects with Next.js Data Cache and memory cache
 * Returns a result object instead of throwing errors for graceful handling
 */
export async function fetchCachedProjects(): Promise<CacheResult<Project[]>> {
  const cacheKey = "all-projects";
  const cachedData = getFromMemoryCache<Project[]>(cacheKey);
  if (cachedData) return { success: true, data: cachedData };

  console.log("🔄 Fetching projects from API");
  try {
    const response = await fetch(API_ROUTES.PROJECTS.BASE, {
      next: {
        tags: ["projects"],
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch projects" };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error || "Failed to fetch projects" };
    }

    const projects = result.data || [];
    setInMemoryCache(cacheKey, projects);
    return { success: true, data: projects };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return { success: false, error: message };
  }
}

/**
 * Fetch authenticated user projects with caching
 * Returns a result object instead of throwing errors for graceful handling
 */
export async function fetchCachedUserProjects(
  userId: string
): Promise<CacheResult<Project[]>> {
  const cacheKey = `user-projects-${userId}`;
  const cachedData = getFromMemoryCache<Project[]>(cacheKey);
  if (cachedData) return { success: true, data: cachedData };

  console.log("🔄 Fetching user projects from API");
  try {
    const response = await fetch(API_ROUTES.PROJECTS.WITH_FILTERS({ userId }), {
      next: {
        tags: ["projects", `user-${userId}`],
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch user projects" };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error || "Failed to fetch user projects" };
    }

    const projects = result.data || [];
    setInMemoryCache(cacheKey, projects);
    return { success: true, data: projects };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user projects";
    return { success: false, error: message };
  }
}

/**
 * Fetch user tier with caching (no time-based expiration)
 * Returns a result object instead of throwing errors for graceful handling
 */
export async function fetchCachedUserTier(userId: string): Promise<CacheResult<ValidTier>> {
  const cacheKey = `user-tier-${userId}`;
  const cachedData = getFromMemoryCache<ValidTier>(cacheKey);
  if (cachedData) {
    return { success: true, data: cachedData };
  }

  console.log("🔄 Fetching user tier from API");
  try {
    const response = await fetch(API_ROUTES.TIERS.USER_TIER, {
      next: {
        tags: ["tier", `user-${userId}`],
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch user tier" };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error || "Failed to fetch user tier" };
    }

    const tier = result.tier as ValidTier;
    setInMemoryCache(cacheKey, tier);
    return { success: true, data: tier };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user tier";
    return { success: false, error: message };
  }
}

/**
 * Invalidate project caches using Next.js cache tags
 */
export async function revalidateProjectsCache(): Promise<void> {
  console.log("🔄 Revalidating projects cache");
  // Clear memory cache
  Object.keys(memoryCache).forEach((key) => {
    if (key.includes("project")) {
      delete memoryCache[key];
    }
  });

  // Invalidate Next.js cache
  await fetch(API_ROUTES.CACHE.REVALIDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tags: ["projects"],
    }),
  });
}

/**
 * Invalidate all caches for a user (projects and tier)
 */
export async function revalidateUserCache(userId: string): Promise<void> {
  console.log(`🔄 Revalidating all caches for user ${userId}`);
  // Clear memory cache
  Object.keys(memoryCache).forEach((key) => {
    if (key.includes(userId) || key.includes("project")) {
      delete memoryCache[key];
    }
  });

  // Single revalidation call with both user and projects tags
  try {
    await fetch(API_ROUTES.CACHE.REVALIDATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: [`user-${userId}`, "projects"],
      }),
    });
  } catch (error) {
    console.error("Failed to revalidate caches:", error);
  }
}

// For backward compatibility during migration
export const loadCachedFreeProjects = fetchCachedProjects;
export const loadCachedAuthenticatedProjects = fetchCachedUserProjects;
