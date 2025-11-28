import { useEffect } from "react";
import { Project } from "@/types/models/project";
import {
  fetchCachedProjects,
  fetchCachedUserProjects,
} from "@/lib/ProjectsCacheUtils";

const FETCH_COOLDOWN = 5000; // 5 seconds between fetches

/**
 * Custom hook for handling project fetching logic
 */
export function useProjectFetching(
  isLoading: boolean,
  hasFetchedFreeProjects: boolean,
  hasFetchedProjects: boolean,
  userId: string | null,
  isAuthenticating: boolean,
  isAuthenticated: boolean,
  isBrowser: boolean,
  freeProjects: Project[],
  isMounted: React.RefObject<boolean>,
  setFreeProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setFreeLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedFreeProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setCachingDebug: React.Dispatch<React.SetStateAction<boolean>>,
  systemReady: boolean = true
) {
  // Fetch projects for anonymous users
  useEffect(() => {
    let lastFetchTime = 0;

    if (!systemReady || hasFetchedFreeProjects || freeProjects.length > 0) {
      return;
    }

    if (isLoading) {
      return;
    }

    if (userId || isAuthenticating) {
      return;
    }

    async function loadProjects() {
      const now = Date.now();
      if (now - lastFetchTime < FETCH_COOLDOWN) {
        return;
      }

      lastFetchTime = now;
      setFreeLoading(true);

      try {
        const projects = await fetchCachedProjects();
        if (isMounted.current) {
          setFreeProjects(projects);
          setHasFetchedFreeProjects(true);
          setCachingDebug(true);
        }
      } catch (error) {
        console.error("❌ Failed to load projects:", error);
        if (isMounted.current) {
          setFreeProjects([]);
          setCachingDebug(false);
        }
      } finally {
        if (isMounted.current) {
          setFreeLoading(false);
        }
      }
    }

    loadProjects();
  }, [
    systemReady,
    isLoading,
    hasFetchedFreeProjects,
    userId,
    isAuthenticating,
    isBrowser,
    freeProjects.length,
    isMounted,
    setFreeProjects,
    setFreeLoading,
    setHasFetchedFreeProjects,
    setCachingDebug,
  ]);

  // Fetch projects for authenticated users
  useEffect(() => {
    let lastFetchTime = 0;

    if (!systemReady) {
      console.log("🔄 System not ready, skipping auth fetch");
      return;
    }

    if (!isAuthenticated || isLoading || hasFetchedProjects) {
      return;
    }

    async function loadUserProjects() {
      if (!userId) return;

      const now = Date.now();
      if (now - lastFetchTime < FETCH_COOLDOWN) {
        return;
      }

      lastFetchTime = now;
      setLoading(true);

      try {
        const projects = await fetchCachedUserProjects(userId);
        if (isMounted.current) {
          setProjects(projects);
          setHasFetchedProjects(true);
          setCachingDebug(true);
        }
      } catch (error) {
        console.error("❌ Failed to load user projects:", error);
        if (isMounted.current) {
          setProjects([]);
          setCachingDebug(false);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    loadUserProjects();
  }, [
    systemReady,
    isAuthenticated,
    isLoading,
    hasFetchedProjects,
    userId,
    isBrowser,
    isMounted,
    setProjects,
    setLoading,
    setHasFetchedProjects,
    setCachingDebug,
  ]);
}
