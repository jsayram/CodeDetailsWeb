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
        const result = await loadCachedFreeProjects();
        
        if (result.success && result.data.length > 0 && isMounted.current) {
          console.log(
            "🔄 Loading",
            result.data.length,
            "free projects from cache on mount"
          );
          setFreeProjects(result.data);
          setFreeLoading(false);
          setHasFetchedFreeProjects(true);
        } else if (!result.success) {
          console.error("Error loading cached free projects:", result.error);
        }
      }

      // Try to load cached authenticated projects if user is logged in
      if (userId && !isLoading && !hasFetchedProjects) {
        const result = await loadCachedAuthenticatedProjects(userId);
        
        if (result.success && result.data.length > 0 && isMounted.current) {
          console.log(
            "🔄 Loading",
            result.data.length,
            "authenticated projects from cache on mount"
          );
          setProjects(result.data);
          setLoading(false);
          setHasFetchedProjects(true);
        } else if (!result.success) {
          console.error("Error loading cached auth projects:", result.error);
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
