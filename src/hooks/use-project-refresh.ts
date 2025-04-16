import { useCallback } from "react";
import {
  loadCachedFreeProjects,
  loadCachedAuthenticatedProjects,
  clearProjectsCache,
} from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook for handling project refresh operations
 */
export function useProjectRefresh(
  isBrowser: boolean,
  userId: string | null,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedFreeProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setFreeLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Force refresh function
  const refreshProjects = useCallback(() => {
    console.log("🔄 Manually refreshing all projects...");

    // Check what's in cache before refreshing
    const checkCacheAndRefresh = async () => {
      try {
        const cachedFree = await loadCachedFreeProjects(isBrowser);
        const cachedAuth = await loadCachedAuthenticatedProjects(
          isBrowser,
          userId
        );
        console.log(
          "🔍 Cache before refresh - Free Projects:",
          cachedFree ? `${cachedFree.length} projects` : "No cache"
        );
        console.log(
          "🔍 Cache before refresh - Auth Projects:",
          cachedAuth ? `${cachedAuth.length} projects` : "No cache"
        );

        setHasFetchedProjects(false);
        setHasFetchedFreeProjects(false);
        setLoading(true);
        setFreeLoading(true);

        // Clear cache when manually refreshing
        await clearProjectsCache(isBrowser);

        // Verify cache was cleared
        try {
          const verifyFreeCache = await loadCachedFreeProjects(isBrowser);
          const verifyAuthCache = await loadCachedAuthenticatedProjects(
            isBrowser,
            userId
          );
          console.log(
            "🔍 Cache after clearing - Free Projects:",
            verifyFreeCache
              ? `${verifyFreeCache.length} projects remain`
              : "Successfully cleared"
          );
          console.log(
            "🔍 Cache after clearing - Auth Projects:",
            verifyAuthCache
              ? `${verifyAuthCache.length} projects remain`
              : "Successfully cleared"
          );
        } catch (verifyError) {
          console.error("Cache verification error:", verifyError);
        }
      } catch (error) {
        console.error("Error during refresh:", error);
        // Even if the cache check fails, still reset the fetched flags
        setHasFetchedProjects(false);
        setHasFetchedFreeProjects(false);
        setLoading(true);
        setFreeLoading(true);
      }
    };

    checkCacheAndRefresh();
  }, [
    isBrowser,
    userId,
    setHasFetchedProjects,
    setHasFetchedFreeProjects,
    setLoading,
    setFreeLoading,
  ]);

  return { refreshProjects };
}
