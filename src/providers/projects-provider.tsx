"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
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

  // Use the auth state hook
  const { isAuthenticated, isAuthenticating } = useAuthState(
    userId,
    token,
    authenticatedClient
  );

  // Use the initial cache hook
  const { isMounted } = useInitialCache(
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
    setHasFetchedProjects
  );

  // Use the background updates hook
  useBackgroundUpdates(
    userId,
    isAuthenticating,
    isLoading,
    isAuthenticated,
    hasFetchedFreeProjects,
    hasFetchedProjects,
    isBrowser,
    userTier,
    setHasFetchedFreeProjects,
    setHasFetchedProjects
  );

  // Use the tier tracker hook
  useTierTracker(isAuthenticated, isLoading, userTier, setHasFetchedProjects);

  // Use the project operations hook
  const { handleProjectAdded, handleProjectDeleted, handleProjectUpdated } =
    useProjectOperations(
      isBrowser,
      userId,
      isAuthenticated,
      userTier,
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
    userTier,
    isBrowser,
    freeProjects,
    isMounted,
    setFreeProjects,
    setFreeLoading,
    setHasFetchedFreeProjects,
    setProjects,
    setLoading,
    setHasFetchedProjects,
    setCachingDebug
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
