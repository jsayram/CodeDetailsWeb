import { useState, useEffect } from "react";
import { Project } from "@/types/models/project";
import {
  loadCachedAuthenticatedProjects,
  cacheAuthenticatedProjects,
} from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook to debug and fix caching issues
 */
export function useCacheDebug(
  cachingDebug: boolean,
  userId: string | null,
  isAuthenticated: boolean,
  isBrowser: boolean,
  projects: Project[]
) {
  // Log cache stats when in debug mode
  useEffect(() => {
    if (cachingDebug && userId && isAuthenticated) {
      const checkCacheState = async () => {
        try {
          const cachedAuthProjects = await loadCachedAuthenticatedProjects(
            isBrowser,
            userId
          );
          console.log("🔍 DEBUG: Total projects in state:", projects.length);
          console.log(
            "🔍 DEBUG: Total projects in cache:",
            cachedAuthProjects?.length || 0
          );

          if (
            cachedAuthProjects &&
            projects.length > cachedAuthProjects.length
          ) {
            console.log("⚠️ WARNING: Some projects are missing from cache!");

            // Compare projects in state vs cache
            const stateIds = new Set(projects.map((p) => p.id));
            const cacheIds = new Set(cachedAuthProjects.map((p) => p.id));

            // Find missing IDs
            const missingIds = [...stateIds].filter((id) => !cacheIds.has(id));
            if (missingIds.length > 0) {
              console.log("⚠️ Missing project IDs:", missingIds.join(", "));

              // Force update the cache with all projects
              console.log("🔄 Forcing cache update with all projects");
              await cacheAuthenticatedProjects(projects, isBrowser, userId);

              // Verify cache was fixed
              try {
                const verifyCache = await loadCachedAuthenticatedProjects(
                  isBrowser,
                  userId
                );
                console.log(
                  "🔍 Cache after fixing:",
                  verifyCache
                    ? `${verifyCache.length} projects`
                    : "Failed to fix cache"
                );

                if (verifyCache && verifyCache.length === projects.length) {
                  console.log("✅ Cache successfully fixed");
                }
              } catch (verifyError) {
                console.error("Cache verification error:", verifyError);
              }
            }
          }
        } catch (error) {
          console.error("Error checking cache state:", error);
        }
      };

      checkCacheState();
    }
  }, [cachingDebug, projects.length, isBrowser, userId, isAuthenticated]);

  return { setCachingDebug: useState<boolean>(false)[1] };
}
