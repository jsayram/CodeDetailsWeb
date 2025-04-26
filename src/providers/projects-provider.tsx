"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Project } from "@/types/models/project";
import {
  getAnonymousClient,
  getAuthenticatedClient,
} from "@/services/supabase";
import { useIsBrowser } from "@/lib/ClientSideUtils";
import { useAuthState } from "@/hooks/use-auth-state";
import { API_ROUTES } from "@/constants/api-routes";
import { ProjectCategory } from "@/constants/project-categories";

interface ProjectFilters {
  sortBy: string;
  category: ProjectCategory | "all";
  showMyProjects: boolean;
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  handleProjectAdded: (newProject: Project) => void;
  handleProjectDeleted: (projectId: string) => void;
  handleProjectUpdated: (updatedProject: Project) => void;
  refreshProjects: () => void;
  isAuthenticated: boolean;
  filters: ProjectFilters;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
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
  isLoading: parentIsLoading,
}: ProjectsProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilters>({
    sortBy: "newest",
    category: "all",
    showMyProjects: false,
  });
  const lastFetchRef = useRef<{ timestamp: number; inProgress: boolean }>({
    timestamp: 0,
    inProgress: false,
  });

  const anonymousClient = useMemo(() => getAnonymousClient(), []);
  const authenticatedClient = useMemo(
    () => getAuthenticatedClient(token),
    [token]
  );
  const isBrowser = useIsBrowser();

  const {
    isAuthenticated,
    isAuthenticating,
    isReady: authReady,
  } = useAuthState(userId, token, authenticatedClient || undefined);

  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const fetchProjects = useCallback(async () => {
    // Only fetch if we haven't fetched in the last 30 seconds
    const now = Date.now();
    if (
      lastFetchRef.current.inProgress ||
      (now - lastFetchRef.current.timestamp < 30000 && projects.length > 0)
    ) {
      return;
    }

    console.log("🔄 Fetching fresh projects");
    lastFetchRef.current.inProgress = true;
    setLoading(true);

    try {
      const url = API_ROUTES.PROJECTS.WITH_FILTERS({ showAll: true });

      const response = await fetch(url, {
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch projects");
      }

      // Load favorites for the current user if authenticated
      if (userId) {
        try {
          const favoritesResponse = await fetch(API_ROUTES.PROJECTS.WITH_FILTERS({ userId, showFavorites: true }));
          if (favoritesResponse.ok) {
            const favoritesResult = await favoritesResponse.json();
            const favoriteIds = new Set(favoritesResult.data.map((p: any) => p.id));
            
            // Mark favorite projects
            result.data = result.data.map((project: Project) => ({
              ...project,
              isFavorite: favoriteIds.has(project.id)
            }));
          }
        } catch (error) {
          console.error("Failed to fetch favorites:", error);
          // Keep existing favorite states if favorites fetch fails
          const existingFavorites = new Map(projects.map(p => [p.id, p.isFavorite]));
          result.data = result.data.map((project: Project) => ({
            ...project,
            isFavorite: existingFavorites.get(project.id) || false
          }));
        }
      }

      setProjects(result.data || []);
      lastFetchRef.current.timestamp = now;
      console.log(`✅ Successfully fetched ${result.data?.length || 0} projects`);
    } catch (error) {
      console.error("❌ Error fetching projects:", error);
      // Don't clear projects on error, keep existing state
      if (!projects.length) {
        setProjects([]);
      }
    } finally {
      setLoading(false);
      lastFetchRef.current.inProgress = false;
    }
  }, [projects.length, userId, projects]);

  useEffect(() => {
    if (!authReady || parentIsLoading) return;
    fetchProjects();
  }, [isAuthenticated, authReady, parentIsLoading, fetchProjects]);

  const handleProjectAdded = async (newProject: Project) => {
    console.log("➕ Adding new project:", newProject.title);
    // Place new project at the start and trigger a refresh
    setProjects((prev) => [newProject, ...prev]);
    // Force an immediate refresh to ensure consistency
    await refreshProjects();
  };

  const handleProjectDeleted = async (projectId: string) => {
    console.log("🗑️ Deleting project:", projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    fetchProjects(); // Refresh to ensure consistency
  };

  const handleProjectUpdated = async (updatedProject: Project) => {
    console.log("✏️ Updating project:", updatedProject.title);
    // Update local state immediately
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    
    // Don't trigger a refresh since we've already updated the local state
    // Only refresh if the last fetch was more than 5 minutes ago
    const now = Date.now();
    if (now - lastFetchRef.current.timestamp >= 300000) { // 5 minutes
      console.log("🔄 Last fetch was > 5 minutes ago, refreshing data");
      await refreshProjects();
    }
  };

  const refreshProjects = async () => {
    console.log("🔄 Manually refreshing projects");
    lastFetchRef.current.timestamp = 0;
    lastFetchRef.current.inProgress = false;
    await fetchProjects();
  };

  // Add sorting logic
  const sortedProjects = useMemo(() => {
    let result = [...projects];

    switch (filters.sortBy) {
      case "newest":
        return result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Newest first
        });
      case "oldest":
        return result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateA - dateB; // Oldest first
        });
      case "popular":
        return result.sort((a, b) => {
          const aFavorites = Number(a.total_favorites || 0);
          const bFavorites = Number(b.total_favorites || 0);
          return bFavorites - aFavorites; // Most favorited first
        });
      default:
        return result;
    }
  }, [projects, filters.sortBy]);

  const value = useMemo(
    () => ({
      projects: sortedProjects, // Use sorted projects instead of raw projects
      loading,
      handleProjectAdded,
      handleProjectDeleted,
      handleProjectUpdated,
      refreshProjects,
      isAuthenticated,
      filters,
      setFilters: updateFilters,
      setProjects,
    }),
    [sortedProjects, loading, isAuthenticated, filters, updateFilters, setProjects] // Update dependencies
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
