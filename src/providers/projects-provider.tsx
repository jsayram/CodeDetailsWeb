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

// Import hooks - removed tier-related imports
import { useAuthState } from "@/hooks/use-auth-state";
import { useInitialCache } from "@/hooks/use-initial-cache";
import { useProjectOperations } from "@/hooks/use-project-operations";
import { useProjectRefresh } from "@/hooks/use-project-refresh";
import { useBackgroundUpdates } from "@/hooks/use-background-updates";
import { useProjectFetching } from "@/hooks/use-project-fetching";
import { useCacheDebug } from "@/hooks/use-cache-debug";

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
  userId: string | null;
  isLoading?: boolean;
}

export function ProjectsProvider({
  children,
  token,
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

  // Calculate overall readiness state - simplified without tier checks
  const systemReady = authReady;

  // Use the initial cache hook
  const { isMounted } = useInitialCache(
    userId,
    isLoading || !systemReady,
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
      `🔄 System readiness state: Auth ready: ${authReady}, System ready: ${systemReady}`
    );
    if (systemReady) {
      console.log(
        `🎫 Ready to load projects for ${
          userId ? `user ${userId}` : "anonymous user"
        }`
      );
    }
  }, [authReady, systemReady, userId]);

  // Use the background updates hook - removed tier parameter
  useBackgroundUpdates(
    userId,
    isAuthenticating,
    isLoading,
    isAuthenticated,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    isBrowser,
    setHasFetchedFreeProjects,
    setHasFetchedProjects
  );

  // Use the project operations hook - removed tier parameter
  const { handleProjectAdded, handleProjectDeleted, handleProjectUpdated } =
    useProjectOperations(
      isBrowser,
      userId,
      isAuthenticated,
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

  // Use the project fetching hook - removed tier parameter
  useProjectFetching(
    isLoading,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    userId,
    isAuthenticating,
    isAuthenticated,
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
    systemReady
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
