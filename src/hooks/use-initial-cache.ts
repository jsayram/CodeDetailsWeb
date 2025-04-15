import { useEffect, useRef } from "react";
import { Project } from "@/types/models/project";
import {
  loadCachedFreeProjects,
  loadCachedAuthenticatedProjects,
} from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook to handle initial cache loading
 */
export function useInitialCache(
  userId: string | null,
  isLoading: boolean,
  isBrowser: boolean,
  hasFetchedFreeProjects: boolean,
  hasFetchedProjects: boolean,
  setFreeProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setFreeLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedFreeProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Track if component is mounted
  const isMounted = useRef(true);

  // Initialize projects from cache on mount
  useEffect(() => {
    isMounted.current = true;

    // Try to load cached projects on initial mount
    const loadInitialCache = async () => {
      if (!userId && !isLoading && !hasFetchedFreeProjects) {
        try {
          const cachedProjects = await loadCachedFreeProjects(isBrowser);
          console.log(
            "🔍 Initial Cache Check - Free Projects:",
            cachedProjects
              ? `${cachedProjects.length} projects in cache`
              : "No cache available"
          );

          if (
            cachedProjects &&
            cachedProjects.length > 0 &&
            isMounted.current
          ) {
            console.log(
              "🔄 Loading",
              cachedProjects.length,
              "free projects from cache on mount"
            );
            setFreeProjects(cachedProjects);
            setFreeLoading(false);
            setHasFetchedFreeProjects(true);
          }
        } catch (error) {
          console.error("Error loading cached free projects:", error);
        }
      }

      // Try to load cached authenticated projects if user is logged in
      if (userId && !isLoading && !hasFetchedProjects) {
        try {
          const cachedAuthProjects = await loadCachedAuthenticatedProjects(
            isBrowser,
            userId
          );
          console.log(
            "🔍 Initial Cache Check - Auth Projects:",
            cachedAuthProjects
              ? `${cachedAuthProjects.length} projects in cache`
              : "No cache available"
          );

          if (
            cachedAuthProjects &&
            cachedAuthProjects.length > 0 &&
            isMounted.current
          ) {
            console.log(
              "🔄 Loading",
              cachedAuthProjects.length,
              "authenticated projects from cache on mount"
            );
            setProjects(cachedAuthProjects);
            setLoading(false);
            setHasFetchedProjects(true);
          }
        } catch (error) {
          console.error("Error loading cached auth projects:", error);
        }
      }
    };

    loadInitialCache();

    return () => {
      isMounted.current = false;
    };
  }, [
    userId,
    isLoading,
    isBrowser,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    setFreeProjects,
    setProjects,
    setFreeLoading,
    setLoading,
    setHasFetchedFreeProjects,
    setHasFetchedProjects,
  ]);

  return { isMounted };
}
