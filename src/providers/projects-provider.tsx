"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Project } from "@/types/models/project";
import {
  getAnonymousClient,
  getAuthenticatedClient,
} from "@/services/supabase";
import { useIsBrowser } from "@/lib/ClientSideUtils";

// Import the newly created hooks
import { useAuthState } from "@/hooks/use-auth-state";
import { useInitialCache } from "@/hooks/use-initial-cache";
import { useProjectOperations } from "@/hooks/use-project-operations";
import { useProjectRefresh } from "@/hooks/use-project-refresh";
import { useTierTracker } from "@/hooks/use-tier-tracker";
import { useBackgroundUpdates } from "@/hooks/use-background-updates";
import { useProjectFetching } from "@/hooks/use-project-fetching";
import { useCacheDebug } from "@/hooks/use-cache-debug";
import { useUserTier } from "@/hooks/use-tierServiceClient"; // Fix the incorrect import reference

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
  userTier: propUserTier, // Rename to clearly indicate it's from props
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

  // Use the auth state hook with the new isReady flag
  const { isAuthenticated, isAuthenticating, isReady: authReady } =
    useAuthState(userId, token, authenticatedClient || undefined);

  // Extract the new tier readiness flag
  const {
    userTier: fetchedTier,
    loading: tierLoading,
    error: tierError,
    isReady: tierReady,
    refreshUserTier,
  } = useUserTier(authenticatedClient, userId);

  // Use the fetched tier if available, otherwise fall back to the prop
  const effectiveUserTier = (userId && fetchedTier) ? fetchedTier : propUserTier;

  // Calculate overall readiness state
  const systemReady = authReady && (userId ? tierReady : true);

  // Force a tier refresh if authentication state changes to ready
  useEffect(() => {
    if (authReady && userId && !tierLoading && !tierReady) {
      console.log("🔄 Auth is ready, forcing tier refresh...");
      refreshUserTier();
    }
  }, [authReady, userId, tierLoading, tierReady, refreshUserTier]);

  // Use the initial cache hook
  const { isMounted } = useInitialCache(
    userId,
    isLoading || !systemReady, // Only consider system ready when auth and tier are ready
    isBrowser,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    setFreeProjects,
    setProjects,
    setFreeLoading,
    setLoading,
    setHasFetchedFreeProjects,
    setHasFetchedProjects,
  );

  // Log readiness states for better debugging
  useEffect(() => {
    console.log(
      `🔄 System readiness state: Auth ready: ${authReady}, Tier ready: ${tierReady}, System ready: ${systemReady}`
    );
    if (systemReady) {
      console.log(
        `🎫 Ready to load projects for ${
          userId ? `user ${userId} with tier ${effectiveUserTier}` : "anonymous user"
        }`
      );
    }
  }, [authReady, tierReady, systemReady, userId, effectiveUserTier]);

  // Use the background updates hook
  useBackgroundUpdates(
    userId,
    isAuthenticating,
    isLoading,
    isAuthenticated,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    isBrowser,
    effectiveUserTier,
    setHasFetchedFreeProjects,
    setHasFetchedProjects
  );

  // Use the tier tracker hook
  useTierTracker(isAuthenticated, isLoading, effectiveUserTier, setHasFetchedProjects);

  // Use the project operations hook
  const { handleProjectAdded, handleProjectDeleted, handleProjectUpdated } =
    useProjectOperations(
      isBrowser,
      userId,
      isAuthenticated,
      effectiveUserTier,
      setProjects,
      setFreeProjects
    );

  // Use the project refresh hook
  const { refreshProjects } = useProjectRefresh(
    isBrowser,
    userId,
    setHasFetchedProjects,
    setHasFetchedFreeProjects,
    setLoading,
    setFreeLoading
  );

  // Use the project fetching hook
  useProjectFetching(
    isLoading,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    userId,
    isAuthenticating,
    isAuthenticated,
    effectiveUserTier,
    isBrowser,
    freeProjects,
    isMounted,
    setFreeProjects,
    setFreeLoading,
    setHasFetchedFreeProjects,
    setProjects,
    setLoading,
    setHasFetchedProjects,
    setCachingDebug,
    systemReady // Pass the systemReady flag to ensure proper sequencing
  );

  // Use the cache debug hook
  useCacheDebug(cachingDebug, userId, isAuthenticated, isBrowser, projects);

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
