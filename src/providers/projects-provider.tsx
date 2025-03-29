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
import { Project } from "@/types";
import {
  getAnonymousClient,
  getAuthenticatedClient,
} from "@/services/supabase";
import { canAccessTier } from "@/services/tierService";
import { useIsBrowser, getClientSideValue } from "@/utils/ClientSideUtils";


// Cache constants
const FREE_PROJECTS_CACHE_KEY = "cached_free_projects";
const CACHE_EXPIRY_KEY = "free_projects_cache_expiry";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
const CACHE_VERSION_KEY = "free_projects_cache_version";
const CACHE_VERSION = "1.0"; // Increment this when your data schema changes
const CACHE_LAST_UPDATED_KEY = "free_projects_last_updated";
const BACKGROUND_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

interface ProjectsContextType {
  projects: Project[];
  freeProjects: Project[];
  loading: boolean;
  freeLoading: boolean;
  handleProjectAdded: (newProject: Project) => void;
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

  // Get clients
  const anonymousClient = useMemo(() => getAnonymousClient(), []);
  const authenticatedClient = useMemo(
    () => getAuthenticatedClient(token),
    [token]
  );

  //checks if the code is running in the browser
  const isBrowser = useIsBrowser();

  // Helper function to load cached free projects
  const loadCachedFreeProjects = useCallback(() => {
    if(!isBrowser) return null;

    // Check if localStorage is available
    try {
      // Check cache version first
      const cacheVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (cacheVersion !== CACHE_VERSION) {
        console.log("🔄 Cache version changed, forcing refresh");
        return null;
      }

      const cachedExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

      //only use date.now() if we are in the browser to prevent SSR issues (hydration errors)
      const now = getClientSideValue(() => Date.now(), 0);

      // Check if cache is expired
      if (!cachedExpiry || parseInt(cachedExpiry) < now) {
        return null;
      }

      const cachedProjects = localStorage.getItem(FREE_PROJECTS_CACHE_KEY);
      if (!cachedProjects) return null;

      return JSON.parse(cachedProjects) as Project[];
    } catch (error) {
      console.error("Error loading cached projects:", error);
      return null;
    }
  }, [isBrowser]);

  // Helper function to save free projects to cache
  const cacheFreeProjects = useCallback((projectsToCache: Project[]) => {
    if(!isBrowser) return;

    try {
      // Only use Date.now() on client to prevent SSR issues and hydration errors
      const expiryTime = getClientSideValue(() => Date.now(), 0) + CACHE_DURATION;
    
      localStorage.setItem(
        FREE_PROJECTS_CACHE_KEY,
        JSON.stringify(projectsToCache)
      );
      localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      // Only use Date.now() on client to prevent SSR issues and hydration errors
      localStorage.setItem(CACHE_LAST_UPDATED_KEY, getClientSideValue(() => Date.now(), 0).toString());
      console.log(
        "💾 Free projects cached until",
        // hydration error fix always wrap date in getClientSideValue
        getClientSideValue(() => new Date(expiryTime).toLocaleTimeString(), "[Time will display client-side]")
      );
    } catch (error) {
      console.error("Error caching free projects:", error);
    }
  }, [isBrowser]);

  // Function to check for data updates in the background
  const checkForDataUpdates = useCallback(async () => {
    if (!isBrowser || !anonymousClient) return;

    try {
      // Only check if we have cached data
      const cachedProjects = loadCachedFreeProjects();
      if (!cachedProjects || cachedProjects.length === 0) return;

      // Get the last updated timestamp
      const lastUpdated = localStorage.getItem(CACHE_LAST_UPDATED_KEY);
      if (!lastUpdated) return;

       //Only use Date.now() on client to prevent SSR issues and hydration errors
      const cacheAge = getClientSideValue(() => Date.now(), 0) - parseInt(lastUpdated);

      // Only check for updates if cache is older than the background refresh interval
      if (cacheAge < BACKGROUND_REFRESH_INTERVAL) return;

      console.log("🔍 Checking for updated free projects in background...");

      // Get the count of free projects from the database
      const { count, error } = await anonymousClient
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("tier", "free");

      if (error) throw error;

      // Compare the count with our cached data
      if (count !== cachedProjects.length) {
        console.log("🔄 Free projects count changed, refreshing data");
        setHasFetchedFreeProjects(false); // This will trigger a re-fetch
      } else {
        // Update the last checked time even if no changes
        // Only use Date.now() on client to prevent SSR issues and hydration errors
        localStorage.setItem(CACHE_LAST_UPDATED_KEY, getClientSideValue(() => Date.now(), 0).toString());
        console.log("✅ Free projects are up to date");
      }
    } catch (error) {
      console.error("Error checking for data updates:", error);
    }
  }, [anonymousClient, loadCachedFreeProjects, isBrowser]);

  // Initialize free projects from cache on mount
  useEffect(() => {
    isMounted.current = true;

    // Try to load cached projects on initial mount
    if (!userId && !isLoading) {
      const cachedProjects = loadCachedFreeProjects();
      if (cachedProjects && cachedProjects.length > 0) {
        console.log(
          "🔄 Loading",
          cachedProjects.length,
          "free projects from cache"
        );
        setFreeProjects(cachedProjects);
        setFreeLoading(false);
        setHasFetchedFreeProjects(true);
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [userId, isLoading, loadCachedFreeProjects]);

  // Set up background checks for data updates
  useEffect(() => {
    // Skip if user is authenticated or in process of authenticating
    if (userId || isAuthenticating || isLoading) return;

    // Skip if we haven't fetched free projects yet
    if (!hasFetchedFreeProjects) return;

    // Do an initial check for updates
    checkForDataUpdates();

    // Set up interval for background checks
    const intervalId = setInterval(() => {
      checkForDataUpdates();
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    userId,
    isAuthenticating,
    isLoading,
    hasFetchedFreeProjects,
    checkForDataUpdates,
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
    // Skip if already fetched
    if (hasFetchedFreeProjects) {
      console.log("📋 Free projects already fetched, skipping");
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

    // First try to load from cache if we don't have free projects yet
    if (freeProjects.length === 0) {
      const cachedProjects = loadCachedFreeProjects();
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
    }

    // If no cache or expired, fetch from the database
    const fetchFreeProjects = async () => {
      console.log("🔄 Fetching free projects from database...");
      try {
        setFreeLoading(true);

        const { data, error } = await anonymousClient
          .from("projects")
          .select("*")
          .eq("tier", "free");

        if (error) throw error;

        console.log("📦 Fetched", data?.length || 0, "free projects");

        // Only update state if component is still mounted
        if (isMounted.current) {
          setFreeProjects(data || []);

          // Cache the fetched projects
          if (data && data.length > 0) {
            cacheFreeProjects(data);
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

    fetchFreeProjects();
  }, [
    anonymousClient,
    isLoading,
    hasFetchedFreeProjects,
    userId,
    isAuthenticating,
    loadCachedFreeProjects,
    cacheFreeProjects,
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

    const fetchAccessibleProjects = async () => {
      console.log("✅ All conditions met, fetching authenticated projects...");
      console.log("🔐 Auth state:", isAuthenticated);
      console.log("🎫 User tier:", userTier);

      try {
        setLoading(true);

        console.log("🔄 Fetching authenticated projects with tier:", userTier);
        const { data, error } = await authenticatedClient!.rpc(
          "get_accessible_projects",
          {
            user_tier_param: userTier,
          }
        );

        if (error) {
          throw error;
        }

        console.log("📦 Fetched", data?.length || 0, "accessible projects");
        if (isMounted.current) {
          setProjects(data || []);
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

    fetchAccessibleProjects();
  }, [
    isAuthenticated,
    authenticatedClient,
    userTier,
    isLoading,
    hasFetchedProjects,
  ]);

  // Force refresh function
  const refreshProjects = useCallback(() => {
    console.log("🔄 Manually refreshing all projects...");
    setHasFetchedProjects(false);
    setHasFetchedFreeProjects(false);
    setLoading(true);
    setFreeLoading(true);

    // Clear cache when manually refreshing
    if (isBrowser){
      localStorage.removeItem(FREE_PROJECTS_CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);
      localStorage.removeItem(CACHE_LAST_UPDATED_KEY);
      console.log("🧹 Cleared project cache");
    }
  }, [isBrowser]);

  // Handler to add a new project
  const handleProjectAdded = useCallback(
    (newProject: Project) => {
      console.log("+ Adding new project:", newProject.title);
      // Only add to visible projects if user can access this tier
      if (canAccessTier(userTier, newProject.tier)) {
        setProjects((prev) => [...prev, newProject]);
      }

      // Also add to free projects if it's a free tier project
      if (newProject.tier === "free") {
        setFreeProjects((prev) => {
          const updatedFreeProjects = [...prev, newProject];
          // Update cache with new project
          cacheFreeProjects(updatedFreeProjects);
          return updatedFreeProjects;
        });
      }
    },
    [userTier, cacheFreeProjects]
  );

  // Memoize the context value to prevent unnecessary renders
  const value = useMemo(
    () => ({
      projects,
      freeProjects,
      loading,
      freeLoading,
      handleProjectAdded,
      refreshProjects,
      isAuthenticated,
    }),
    [
      projects,
      freeProjects,
      loading,
      freeLoading,
      handleProjectAdded,
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
