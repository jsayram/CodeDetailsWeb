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
import {
  revalidateUserCache,
  revalidateProjectsCache,
} from "@/lib/ProjectsCacheUtils";
import { PROJECTS_PER_PAGE } from "@/components/navigation/Pagination/paginationConstants";

export interface ProjectFilters {
  sortBy: string;
  category: ProjectCategory | "all";
  showMyProjects: boolean;
  showFavorites: boolean;
  showDeleted: boolean;
  page: number;
  limit: number;
  tags?: string[];
}

interface PageCache {
  [key: string]: {
    data: Project[];
    timestamp: number;
  };
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
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
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
  initialFilters?: Partial<ProjectFilters>;
}

export function ProjectsProvider({
  children,
  token,
  userId,
  isLoading: parentIsLoading,
  initialFilters,
}: ProjectsProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilters>({
    sortBy: "newest",
    category: "all",
    showMyProjects: false,
    showFavorites: false,
    showDeleted: false,
    page: 1,
    limit: PROJECTS_PER_PAGE,
    ...initialFilters,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const [pageCache, setPageCache] = useState<PageCache>({});

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

  const fetchProjects = useCallback(async () => {
    const now = Date.now();
    if (lastFetchRef.current.inProgress) {
      return;
    }

    const cacheKey = JSON.stringify({
      showAll: !filters.showMyProjects,
      userId: filters.showMyProjects || filters.showFavorites || filters.showDeleted
        ? userId
        : undefined,
      category: filters.category === "all" ? undefined : filters.category,
      showFavorites: filters.showFavorites,
      showDeleted: filters.showDeleted,
      sortBy: filters.sortBy,
      page: filters.page,
      limit: filters.limit,
      tags: filters.tags, // Add tags to the cache key
    });

    const cached = pageCache[cacheKey];
    if (cached && now - cached.timestamp < 300000) {
      console.log("🎯 Using cached page data for page", filters.page);
      setProjects(cached.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: filters.page,
      }));
      return;
    }

    console.log("🔄 Fetching fresh projects for page", filters.page);
    lastFetchRef.current.inProgress = true;
    setLoading(true);

    try {
      const params = {
        showAll: !filters.showMyProjects,
        userId: userId ?? undefined, // Always include userId if available
        category: filters.category === "all" ? undefined : filters.category,
        showFavorites: filters.showFavorites,
        showDeleted: filters.showDeleted,
        sortBy: filters.sortBy,
        page: filters.page,
        limit: filters.limit,
        tags: filters.tags, // Add tags to the params
      };

      const url = API_ROUTES.PROJECTS.WITH_FILTERS(params);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch projects");
      }

      if (result.pagination) {
        setPagination({
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
          currentPage: filters.page,
        });
      }

      setPageCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: result.data || [],
          timestamp: now,
        },
      }));

      setProjects(result.data || []);
      lastFetchRef.current.timestamp = now;
    } catch (error) {
      console.error("❌ Error fetching projects:", error);
      if (!projects.length) {
        setProjects([]);
        setPagination({
          total: 0,
          totalPages: 1,
          currentPage: 1,
        });
      }
    } finally {
      setLoading(false);
      lastFetchRef.current.inProgress = false;
    }
  }, [filters, userId, projects.length]);

  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters((prev) => {
      const updatedFilters = {
        ...prev,
        ...newFilters,
      };

      // Reset cache if category changes
      if ('category' in newFilters) {
        setPageCache({});
        lastFetchRef.current.timestamp = 0;
      }

      if ("page" in newFilters) {
        updatedFilters.page = Math.max(
          1,
          Math.min(newFilters.page!, pagination.totalPages || 1)
        );
      } else if (Object.keys(newFilters).length > 0) {
        updatedFilters.page = 1;
      }

      return updatedFilters;
    });
  }, [pagination.totalPages]);

  useEffect(() => {
    if (!authReady || parentIsLoading) return;
    fetchProjects();
  }, [isAuthenticated, authReady, parentIsLoading, fetchProjects]);

  const handleProjectAdded = async (newProject: Project) => {
    console.log("➕ Adding new project:", newProject.title);
    setProjects((prev) => [newProject, ...prev]);
    await refreshProjects();
  };

  const handleProjectDeleted = async (projectId: string) => {
    console.log("🗑️ Deleting project:", projectId);
    
    // Remove from current state immediately
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    
    // Clear the page cache to force a fresh fetch
    setPageCache({});
    
    // Reset fetch timestamp and refresh projects
    lastFetchRef.current.timestamp = 0;
    lastFetchRef.current.inProgress = false;
    
    try {
      // Single revalidation call that handles both user and projects cache
      await revalidateUserCache(userId || '');
      // If we're showing favorites, force a refresh
      if (filters.showFavorites) {
        await fetchProjects();
      }
    } catch (error) {
      console.error("Error refreshing data after deletion:", error);
    }
  };

  const handleProjectUpdated = async (updatedProject: Project) => {
    console.log("✏️ Updating project:", updatedProject.title);
    
    // If we're on favorites page and the project was unfavorited, remove it from the UI
    if (filters.showFavorites && !updatedProject.isFavorite) {
      // Remove from current state immediately
      setProjects((prev) => prev.filter((p) => p.id !== updatedProject.id));
      
      // Clear the page cache to force fresh data on next fetch
      setPageCache({});
      lastFetchRef.current.timestamp = 0;
      lastFetchRef.current.inProgress = false;
      
      try {
        // Revalidate the cache and fetch fresh data
        await revalidateUserCache(userId || '');
        await fetchProjects();
      } catch (error) {
        console.error("Error refreshing data after unfavorite:", error);
      }
    } else {
      // Normal update behavior for non-favorites page
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      );
    }
  };

  const refreshProjects = async () => {
    console.log("🔄 Manually refreshing projects");
    lastFetchRef.current.timestamp = 0;
    lastFetchRef.current.inProgress = false;
    await fetchProjects();
  };

  const sortedProjects = useMemo(() => {
    let result = [...projects];

    switch (filters.sortBy) {
      case "newest":
        return result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      case "oldest":
        return result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateA - dateB;
        });
      case "popular":
        return result.sort((a, b) => {
          const aFavorites = Number(a.total_favorites || 0);
          const bFavorites = Number(b.total_favorites || 0);
          return bFavorites - aFavorites;
        });
      default:
        return result;
    }
  }, [projects, filters.sortBy]);

  const value = useMemo(
    () => ({
      projects: sortedProjects,
      loading,
      handleProjectAdded,
      handleProjectDeleted,
      handleProjectUpdated,
      refreshProjects,
      isAuthenticated,
      filters,
      setFilters: updateFilters,
      setProjects,
      pagination,
    }),
    [
      sortedProjects,
      loading,
      isAuthenticated,
      filters,
      updateFilters,
      setProjects,
      pagination,
    ]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
