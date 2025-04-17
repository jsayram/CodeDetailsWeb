import { useEffect } from "react";
import { Project } from "@/types/models/project";
import {
  loadCachedProjects,
  cacheProjects,
  loadCachedAuthenticatedProjects,
  cacheAuthenticatedProjects,
} from "@/lib/ProjectsCacheUtils";
import { getAllProjects, getUserProjects } from "@/app/actions/projects";

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
    // Skip if system is not ready or already fetched or if we have projects from cache
    if (!systemReady || hasFetchedFreeProjects || freeProjects.length > 0) {
      if (!systemReady) {
        console.log("⏳ System not ready yet, waiting to fetch projects...");
      } else {
        console.log("📋 Projects already available, skipping fetch");
      }
      return;
    }

    // Skip if parent is loading
    if (isLoading) {
      console.log("⏳ Parent is loading, waiting to fetch projects...");
      return;
    }

    // Skip if user is present or in the process of authenticating
    if (userId || isAuthenticating) {
      console.log(
        "👤 User detected or authenticating, skipping anonymous projects fetch"
      );
      return;
    }

    const fetchProjectsWithCache = async () => {
      // Check cache first - if we have valid cached projects, use them
      try {
        const cachedProjects = await loadCachedProjects(isBrowser);
        console.log(
          "🔍 Cache Check Before Fetch - Projects:",
          cachedProjects
            ? `${cachedProjects.length} projects in cache`
            : "No cache available"
        );

        if (cachedProjects && cachedProjects.length > 0) {
          console.log(
            "🔄 Loading",
            cachedProjects.length,
            "projects from cache"
          );
          setFreeProjects(cachedProjects);
          setFreeLoading(false);
          setHasFetchedFreeProjects(true);
          return;
        }

        // Only fetch from database if cache is empty or invalid
        await fetchAllProjects();
      } catch (error) {
        console.error("Error in fetchProjectsWithCache:", error);
        // Fallback to direct fetch if cache access fails
        await fetchAllProjects();
      }
    };

    // Fetch all projects for anonymous users
    const fetchAllProjects = async () => {
      console.log("🔄 Fetching all projects from database...");
      try {
        setFreeLoading(true);

        // Using server action to fetch all projects
        const data = await getAllProjects();

        console.log("📦 Fetched", data?.length || 0, "projects");

        // Only update state if component is still mounted
        if (isMounted.current) {
          setFreeProjects(data || []);

          // Cache the fetched projects
          if (data && data.length > 0) {
            console.log(
              `💾 Caching ${data.length} projects in Cache Storage`
            );
            await cacheProjects(data, isBrowser);

            // Verify cache was properly set
            try {
              const verifyCache = await loadCachedProjects(isBrowser);
              console.log(
                "🔍 Cache Verification - Projects:",
                verifyCache
                  ? `${verifyCache.length} projects in cache after storing`
                  : "Failed to store in cache"
              );
            } catch (verifyError) {
              console.error("Cache verification error:", verifyError);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to load projects:", error);
        if (isMounted.current) {
          setFreeProjects([]);
        }
      } finally {
        if (isMounted.current) {
          setFreeLoading(false);
          setHasFetchedFreeProjects(true);
        }
      }
    };

    fetchProjectsWithCache();
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
  ]);

  // Fetch projects for authenticated users
  useEffect(() => {
    // Skip if system is not ready
    if (!systemReady) {
      console.log("⏳ System not ready yet, waiting to fetch authenticated projects...");
      return;
    }
    
    // Skip if any of these conditions are true
    if (!isAuthenticated) {
      console.log("⏳ Not authenticated yet, waiting...");
      return;
    }

    if (isLoading) {
      console.log("⏳ Parent components still loading, waiting...");
      return;
    }

    if (hasFetchedProjects) {
      console.log("📋 Using existing projects data");
      return;
    }

    console.log(`🚀 All prerequisites met for user ${userId}, proceeding with project fetch`);

    const fetchAuthProjectsWithCache = async () => {
      // Check cache first - if we have valid cached auth projects, use them
      try {
        const cachedAuthProjects = await loadCachedAuthenticatedProjects(
          isBrowser,
          userId
        );
        console.log(
          "🔍 Cache Check - Auth Projects:",
          cachedAuthProjects
            ? `${cachedAuthProjects.length} projects in cache`
            : "No cache available"
        );

        if (cachedAuthProjects && cachedAuthProjects.length > 0) {
          console.log(
            "🔄 Loading",
            cachedAuthProjects.length,
            "authenticated projects from cache"
          );
          console.log(
            "🔍 Cache Contents - Projects IDs:",
            cachedAuthProjects.map((p) => p.id).join(", ")
          );
          setProjects(cachedAuthProjects);
          setLoading(false);
          setHasFetchedProjects(true);
          return;
        }

        // If no valid cache, fetch from server
        await fetchUserProjects();
      } catch (error) {
        console.error("Error in fetchAuthProjectsWithCache:", error);
        // Fallback to direct fetch if cache access fails
        await fetchUserProjects();
      }
    };

    const fetchUserProjects = async () => {
      console.log("✅ All conditions met, fetching user's projects...");
      console.log("🔐 Auth state:", isAuthenticated);

      try {
        setLoading(true);

        try {
          // Make sure userId is not null before calling getUserProjects
          if (!userId) {
            throw new Error("User ID is null, cannot fetch projects");
          }
          
          // Pass userTier parameter for backward compatibility, but it won't be used for filtering
          const data = await getUserProjects(userId);

          console.log("📦 Fetched", data?.length || 0, "projects");
          console.log(
            "🔍 Fetched Project IDs:",
            data?.map((p) => p.id).join(", ")
          );

          // Enable debug mode if we're seeing caching discrepancies
          if (data && data.length > 0) {
            setCachingDebug(true);
            console.log("🔍 DEBUG: All fetched projects:", data.length);
            console.log(
              "🔍 DEBUG: Project IDs:",
              data.map((p) => p.id).join(", ")
            );
          }

          if (isMounted.current) {
            setProjects(data || []);

            // Cache ALL the fetched authenticated projects
            if (data && data.length > 0) {
              console.log(
                `💾 Caching ${data.length} authenticated projects in Cache Storage`
              );
              await cacheAuthenticatedProjects(data, isBrowser, userId);

              // Verify cache was properly set
              try {
                const verifyCache = await loadCachedAuthenticatedProjects(
                  isBrowser,
                  userId
                );
                console.log(
                  "🔍 Cache Verification:",
                  verifyCache
                    ? `${verifyCache.length} projects in cache after storing`
                    : "Failed to store in cache"
                );

                if (verifyCache) {
                  // Check if any projects are missing
                  const fetchedIds = new Set(data.map((p) => p.id));
                  const cachedIds = new Set(verifyCache.map((p) => p.id));
                  const missingIds = [...fetchedIds].filter(
                    (id) => !cachedIds.has(id)
                  );

                  if (missingIds.length > 0) {
                    console.log(
                      "⚠️ Missing project IDs in cache:",
                      missingIds.join(", ")
                    );
                  } else {
                    console.log(
                      "✅ Cache validation successful - all projects stored correctly"
                    );
                  }
                }
              } catch (verifyError) {
                console.error("Cache verification error:", verifyError);
              }
            }
          }
        } catch (serverActionError) {
          console.error("❌ Server action failed:", serverActionError);
          // Handle the server action failure specifically
          if (isMounted.current) {
            setProjects([]);
          }
        }
      } catch (error) {
        console.error("❌ Failed to load projects:", error);
        if (isMounted.current) {
          setProjects([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setHasFetchedProjects(true);
        }
      }
    };

    fetchAuthProjectsWithCache();
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
