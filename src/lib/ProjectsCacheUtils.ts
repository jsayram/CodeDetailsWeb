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

/**
 * Fetch projects with Next.js Data Cache and memory cache
 */
export async function fetchCachedProjects(): Promise<Project[]> {
  const cacheKey = "all-projects";
  const cachedData = getFromMemoryCache<Project[]>(cacheKey);
  if (cachedData) return cachedData;

  console.log("🔄 Fetching projects from API");
  const response = await fetch(API_ROUTES.PROJECTS.BASE, {
    next: {
      tags: ["projects"],
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch projects");
  }

  const projects = result.data || [];
  setInMemoryCache(cacheKey, projects);
  return projects;
}

/**
 * Fetch authenticated user projects with caching
 */
export async function fetchCachedUserProjects(
  userId: string
): Promise<Project[]> {
  const cacheKey = `user-projects-${userId}`;
  const cachedData = getFromMemoryCache<Project[]>(cacheKey);
  if (cachedData) return cachedData;

  console.log("🔄 Fetching user projects from API");
  const response = await fetch(API_ROUTES.PROJECTS.WITH_FILTERS({ userId }), {
    next: {
      tags: ["projects", `user-${userId}`],
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user projects");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch user projects");
  }

  const projects = result.data || [];
  setInMemoryCache(cacheKey, projects);
  return projects;
}

/**
 * Fetch user tier with caching (no time-based expiration)
 */
export async function fetchCachedUserTier(userId: string): Promise<ValidTier> {
  const cacheKey = `user-tier-${userId}`;
  const cachedData = getFromMemoryCache<ValidTier>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  console.log("🔄 Fetching user tier from API");
  const response = await fetch(API_ROUTES.TIERS.USER_TIER, {
    next: {
      tags: ["tier", `user-${userId}`],
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user tier");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch user tier");
  }

  const tier = result.tier as ValidTier;
  setInMemoryCache(cacheKey, tier);
  return tier;
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
