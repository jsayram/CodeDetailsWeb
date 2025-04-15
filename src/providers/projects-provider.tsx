"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Project } from "@/types/models/project";
import {
  getAnonymousClient,
  getAuthenticatedClient,
} from "@/services/supabase";
import { canAccessTier } from "@/services/tierServiceServer";
import { useIsBrowser } from "@/lib/ClientSideUtils";
import { getAllFreeProjects, getUserProjects } from "@/app/actions/projects";
// Import the extracted cache utilities
import {
  loadCachedFreeProjects,
  cacheFreeProjects,
  checkForDataUpdates,
  clearProjectsCache,
  BACKGROUND_REFRESH_INTERVAL,
  loadCachedAuthenticatedProjects,
  cacheAuthenticatedProjects,
  checkForAuthDataUpdates,
  updateProjectInCache,
} from "@/lib/ProjectsCacheUtils";

interface ProjectsContextType {
  projects: Project[];
  freeProjects: Project[];
  loading: boolean;
  freeLoading: boolean;
  handleProjectAdded: (newProject: Project) => void;
  handleProjectDeleted: (projectId: string) => void;
  handleProjectUpdated: (updatedProject: Project) => void;
  refreshProjects: () => void;
  isAuthenticated: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}

interface ProjectsProviderProps {
  children: React.ReactNode;
  token: string | null;
  userTier: string;
  userId: string | null;
  isLoading?: boolean;
}

export function ProjectsProvider({
  children,
  token,
  userTier,
  userId,
  isLoading = false,
}: ProjectsProviderProps) {
  // State declarations
  const [projects, setProjects] = useState<Project[]>([]);
  const [freeProjects, setFreeProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeLoading, setFreeLoading] = useState(true);

  // Track whether we've fetched data
  const [hasFetchedProjects, setHasFetchedProjects] = useState(false);
  const [hasFetchedFreeProjects, setHasFetchedFreeProjects] = useState(false);

  // Auth state tracking
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Track tier changes
  const previousTierRef = useRef<string>("");

  // Track previous userId for detecting auth changes
  const previousUserIdRef = useRef<string | null>(null);

  // Track if component is mounted
  const isMounted = useRef(true);

  // Track if we're experiencing caching issues
  const [cachingDebug, setCachingDebug] = useState(false);

  // Get clients
  const anonymousClient = useMemo(() => getAnonymousClient(), []);
  const authenticatedClient = useMemo(
    () => getAuthenticatedClient(token),
    [token]
  );

  //checks if the code is running in the browser
  const isBrowser = useIsBrowser();

  // Initialize free projects from cache on mount
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
          
          if (cachedProjects && cachedProjects.length > 0 && isMounted.current) {
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
          
          if (cachedAuthProjects && cachedAuthProjects.length > 0 && isMounted.current) {
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
  }, [userId, isLoading, isBrowser, hasFetchedFreeProjects, hasFetchedProjects]);

  // Set up background checks for data updates (free projects)
  useEffect(() => {
    // Skip if user is authenticated or in process of authenticating
    if (userId || isAuthenticating || isLoading) return;

    // Skip if we haven't fetched free projects yet
    if (!hasFetchedFreeProjects) return;

    // Do an initial check for updates
    const runCheck = async () => {
      await checkForDataUpdates(
        isBrowser,
        setHasFetchedFreeProjects,
        getAllFreeProjects
      );
    };

    runCheck();

    // Set up interval for background checks
    const intervalId = setInterval(() => {
      runCheck();
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    userId,
    isAuthenticating,
    isLoading,
    hasFetchedFreeProjects,
    isBrowser,
  ]);

  // Set up background checks for authenticated projects
  useEffect(() => {
    // Skip if not authenticated
    if (!userId || !isAuthenticated || isLoading) return;

    // Skip if we haven't fetched authenticated projects yet
    if (!hasFetchedProjects) return;

    // Do an initial check for updates
    const runAuthCheck = async () => {
      await checkForAuthDataUpdates(
        isBrowser,
        userId,
        setHasFetchedProjects,
        getUserProjects,
        userTier
      );
    };

    runAuthCheck();

    // Set up interval for background checks
    const intervalId = setInterval(() => {
      runAuthCheck();
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    userId,
    isAuthenticated,
    isLoading,
    hasFetchedProjects,
    isBrowser,
    userTier,
  ]);

  // Monitor auth state changes
  useEffect(() => {
    const authenticated = Boolean(userId && token && authenticatedClient);

    // Check if user is in the process of signing in (userId exists but not fully authenticated yet)
    const isSigningIn = Boolean(userId && (!token || !authenticatedClient));
    setIsAuthenticating(isSigningIn);

    console.log(
      "🔐 Auth state change:",
      authenticated
        ? "Authenticated"
        : isSigningIn
        ? "Authenticating"
        : "Not authenticated"
    );
    console.log("🧑‍💻 User ID:", userId || "None");
    console.log("🔑 Token exists:", Boolean(token));

    // Check if userId just appeared (user started auth process)
    if (userId && !previousUserIdRef.current) {
      console.log("👤 User started authentication process");
    }

    // Update the previous userId ref
    previousUserIdRef.current = userId;

    // Only update if the state actually changed
    if (authenticated !== isAuthenticated) {
      console.log(
        "Auth state changing from",
        isAuthenticated,
        "to",
        authenticated
      );
      setIsAuthenticated(authenticated);

      // Reset flags when auth changes to ensure fresh data
      if (authenticated && !isAuthenticated) {
        setHasFetchedProjects(false);
      }
    }
  }, [userId, token, authenticatedClient, isAuthenticated]);

  // Track tier changes and trigger refetch when needed
  useEffect(() => {
    // Skip if not authenticated or parent is still loading
    if (!isAuthenticated || isLoading) return;

    console.log("🎫 Tier check: current=" + userTier);

    // Check for tier changes
    if (previousTierRef.current && previousTierRef.current !== userTier) {
      console.log(
        "🔄 Tier changed from",
        previousTierRef.current,
        "to",
        userTier
      );
      // Force refetch when tier changes
      setHasFetchedProjects(false);
    } else if (previousTierRef.current === userTier) {
      console.log("✅ Tier loaded:", userTier);
    } else {
      console.log("🔄 Initial tier loaded:", userTier, ", triggering fetch");
    }

    // Update tier ref
    previousTierRef.current = userTier;
  }, [userTier, isAuthenticated, isLoading]);

  // Fetch free projects - with caching
  useEffect(() => {
    // Skip if already fetched or if we have projects from cache
    if (hasFetchedFreeProjects || freeProjects.length > 0) {
      console.log("📋 Free projects already available, skipping fetch");
      return;
    }

    // Skip if parent is loading
    if (isLoading) {
      console.log("⏳ Parent is loading, waiting to fetch free projects...");
      return;
    }

    // Skip if user is present or in the process of authenticating
    if (userId || isAuthenticating) {
      console.log(
        "👤 User detected or authenticating, skipping free projects fetch"
      );
      return;
    }

    const fetchFreeProjectsWithCache = async () => {
      // Check cache first - if we have valid cached projects, use them
      try {
        const cachedProjects = await loadCachedFreeProjects(isBrowser);
        console.log(
          "🔍 Cache Check Before Fetch - Free Projects:",
          cachedProjects
            ? `${cachedProjects.length} projects in cache`
            : "No cache available"
        );

        if (cachedProjects && cachedProjects.length > 0) {
          console.log(
            "🔄 Loading",
            cachedProjects.length,
            "free projects from cache"
          );
          setFreeProjects(cachedProjects);
          setFreeLoading(false);
          setHasFetchedFreeProjects(true);
          return;
        }
        
        // Only fetch from database if cache is empty or invalid
        await fetchFreeProjects();
      } catch (error) {
        console.error("Error in fetchFreeProjectsWithCache:", error);
        // Fallback to direct fetch if cache access fails
        await fetchFreeProjects();
      }
    };

    // Only fetch from database if cache is empty or invalid
    const fetchFreeProjects = async () => {
      console.log("🔄 Fetching free projects from database...");
      try {
        setFreeLoading(true);

        // Using server action instead of direct DB access
        const data = await getAllFreeProjects();

        console.log("📦 Fetched", data?.length || 0, "free projects");

        // Only update state if component is still mounted
        if (isMounted.current) {
          setFreeProjects(data || []);

          // Cache the fetched projects
          if (data && data.length > 0) {
            console.log(`💾 Caching ${data.length} free projects in Cache Storage`);
            await cacheFreeProjects(data, isBrowser);

            // Verify cache was properly set
            try {
              const verifyCache = await loadCachedFreeProjects(isBrowser);
              console.log(
                "🔍 Cache Verification - Free Projects:",
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
        console.error("❌ Failed to load free projects:", error);
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

    fetchFreeProjectsWithCache();
  }, [
    isLoading,
    hasFetchedFreeProjects,
    userId,
    isAuthenticating,
    isBrowser,
    freeProjects.length,
  ]);

  // Fetch authenticated projects - wait for full authentication and tier
  useEffect(() => {
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

    if (!userTier) {
      console.log("⏳ Tier still loading, waiting...");
      return;
    }

    const fetchAuthProjectsWithCache = async () => {
      // Check cache first - if we have valid cached auth projects, use them
      try {
        const cachedAuthProjects = await loadCachedAuthenticatedProjects(
          isBrowser,
          userId
        );
        console.log(
          "🔍 Cache Check Before Fetch - Auth Projects:",
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
            "🔍 Cache Contents - Auth Projects IDs:",
            cachedAuthProjects.map((p) => p.id).join(", ")
          );
          setProjects(cachedAuthProjects);
          setLoading(false);
          setHasFetchedProjects(true);
          return;
        }

        // If no valid cache, fetch from server
        await fetchAccessibleProjects();
      } catch (error) {
        console.error("Error in fetchAuthProjectsWithCache:", error);
        // Fallback to direct fetch if cache access fails
        await fetchAccessibleProjects();
      }
    };

    const fetchAccessibleProjects = async () => {
      console.log("✅ All conditions met, fetching authenticated projects...");
      console.log("🔐 Auth state:", isAuthenticated);
      console.log("🎫 User tier:", userTier);

      try {
        setLoading(true);

        console.log("🔄 Fetching authenticated projects with tier:", userTier);

        // Using server action with tier access level checking
        try {
          // Make sure userId is not null before calling getUserProjects
          if (!userId) {
            throw new Error("User ID is null, cannot fetch projects");
          }
          const data = await getUserProjects(userTier, userId);

          console.log("📦 Fetched projects data:", data);
          console.log("📦 Fetched", data?.length || 0, "accessible projects");
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
              // Make sure we're caching the complete data array
              await cacheAuthenticatedProjects(data, isBrowser, userId);

              // Verify cache was properly set
              try {
                const verifyCache = await loadCachedAuthenticatedProjects(
                  isBrowser,
                  userId
                );
                console.log(
                  "🔍 Cache Verification - Auth Projects:",
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
    isAuthenticated,
    authenticatedClient,
    userTier,
    isLoading,
    hasFetchedProjects,
    userId,
    isBrowser,
  ]);

  // Force refresh function
  const refreshProjects = useCallback(() => {
    console.log("🔄 Manually refreshing all projects...");
    
    // Check what's in cache before refreshing
    const checkCacheAndRefresh = async () => {
      try {
        const cachedFree = await loadCachedFreeProjects(isBrowser);
        const cachedAuth = await loadCachedAuthenticatedProjects(isBrowser, userId);
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
  }, [isBrowser, userId]);

  // Handler to add a new project
  const handleProjectAdded = useCallback(
    (newProject: Project) => {
      console.log("+ Adding new project:", newProject.title);
      // Only add to visible projects if user can access this tier
      if (canAccessTier(userTier, newProject.tier)) {
        setProjects((prev) => {
          const updatedProjects = [...prev, newProject];
          // Update cache for authenticated projects
          if (userId && isAuthenticated) {
            console.log(
              `💾 Caching ${updatedProjects.length} projects after adding new project`
            );
            cacheAuthenticatedProjects(updatedProjects, isBrowser, userId)
              .catch(err => console.error("Error caching projects after add:", err));
          }
          return updatedProjects;
        });
      }

      // Also add to free projects if it's a free tier project
      if (newProject.tier === "free") {
        setFreeProjects((prev) => {
          const updatedFreeProjects = [...prev, newProject];
          // Update cache with new project
          cacheFreeProjects(updatedFreeProjects, isBrowser)
            .catch(err => console.error("Error caching free projects after add:", err));
          return updatedFreeProjects;
        });
      }
    },
    [userTier, isBrowser, userId, isAuthenticated]
  );

  // Handler to delete a project
  const handleProjectDeleted = useCallback(
    (projectId: string) => {
      console.log("- Deleting project with ID:", projectId);
      setProjects((prev) => {
        const updatedProjects = prev.filter(
          (project) => project.id !== projectId
        );
        // Update cache for authenticated projects
        if (userId && isAuthenticated) {
          console.log(
            `💾 Caching ${updatedProjects.length} projects after deletion`
          );
          cacheAuthenticatedProjects(updatedProjects, isBrowser, userId)
            .catch(err => console.error("Error caching projects after delete:", err));
        }
        return updatedProjects;
      });

      setFreeProjects((prev) => {
        const updatedFreeProjects = prev.filter(
          (project) => project.id !== projectId
        );
        // Update cache for free projects
        if (updatedFreeProjects.length !== prev.length) {
          cacheFreeProjects(updatedFreeProjects, isBrowser)
            .catch(err => console.error("Error caching free projects after delete:", err));
        }
        return updatedFreeProjects;
      });
    },
    [isBrowser, userId, isAuthenticated]
  );

  // Handler to update a project
  const handleProjectUpdated = useCallback(
    (updatedProject: Project) => {
      console.log("✏️ Updating project:", updatedProject.title);

      // Use the optimized cache update function
      updateProjectInCache(
        updatedProject,
        isBrowser,
        isAuthenticated ? userId : null
      ).catch(err => console.error("Error updating project in cache:", err));

      setProjects((prev) => {
        const updatedProjects = prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        );

        // Also ensure the full cache is updated
        if (userId && isAuthenticated) {
          console.log(
            `💾 Updating cache with ${updatedProjects.length} projects after project update`
          );
          cacheAuthenticatedProjects(updatedProjects, isBrowser, userId)
            .catch(err => console.error("Error caching projects after update:", err));
        }

        return updatedProjects;
      });

      setFreeProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
      );
    },
    [isBrowser, userId, isAuthenticated]
  );

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

          if (cachedAuthProjects && projects.length > cachedAuthProjects.length) {
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

  // Memoize the context value to prevent unnecessary renders
  const value = useMemo(
    () => ({
      projects,
      freeProjects,
      loading,
      freeLoading,
      handleProjectAdded,
      handleProjectDeleted,
      handleProjectUpdated,
      refreshProjects,
      isAuthenticated,
    }),
    [
      projects,
      freeProjects,
      loading,
      freeLoading,
      handleProjectAdded,
      handleProjectDeleted,
      handleProjectUpdated,
      refreshProjects,
      isAuthenticated,
    ]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
