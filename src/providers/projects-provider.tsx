"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import useSWR, { mutate } from "swr";
import { Project } from "@/types/models/project";
import { useAuthState } from "@/hooks/use-auth-state";
import { API_ROUTES } from "@/constants/api-routes";
import { ProjectCategory } from "@/constants/project-categories";
import { revalidateProjectCache } from "@/lib/swr-fetchers";
import { PROJECTS_PER_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { projectsFetcher } from "@/lib/swr-fetchers";
import { SortByValue, DEFAULT_SORT_BY } from "@/constants/sort-options";

export interface ProjectFilters {
  sortBy: SortByValue;
  category: ProjectCategory | "all";
  showMyProjects: boolean;
  showFavorites: boolean;
  showDeleted: boolean;
  showAll?: boolean;
  page: number;
  limit: number;
  tags?: string[];
  username?: string;
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
  setProjects: React.Dispatch<React.SetStateAction<Project[] | null>>;
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

/**
 * Generate SWR cache key for projects based on filters
 */
function getProjectsCacheKey(
  filters: ProjectFilters,
  userId: string | null,
  shouldFetch: boolean
): string | null {
  if (!shouldFetch) return null;

  const params = {
    showAll: !filters.showMyProjects,
    userId: userId ?? undefined,
    username: filters.username,
    category: filters.category === "all" ? undefined : filters.category,
    showFavorites: filters.showFavorites,
    showDeleted: filters.showDeleted,
    sortBy: filters.sortBy,
    page: filters.page,
    limit: filters.limit,
    tags: filters.tags,
  };

  return API_ROUTES.PROJECTS.WITH_FILTERS(params);
}

export function ProjectsProvider({
  children,
  token,
  userId,
  isLoading,
  initialFilters = {},
}: ProjectsProviderProps) {
  // Local state for optimistic updates
  const [localProjects, setLocalProjects] = useState<Project[] | null>(null);

  const [filters, setFiltersState] = useState<ProjectFilters>({
    showAll: true,
    sortBy: DEFAULT_SORT_BY,
    category: "all",
    showMyProjects: false,
    showFavorites: false,
    showDeleted: false,
    page: 1,
    limit: PROJECTS_PER_PAGE,
    ...initialFilters,
  });

  const {
    isAuthenticated,
    isReady: authReady,
  } = useAuthState(userId, token);

  // Determine if we should fetch
  const shouldFetch = authReady && !isLoading && (isAuthenticated || !!filters.username);

  // Generate cache key for SWR
  const cacheKey = getProjectsCacheKey(filters, userId, shouldFetch);

  // Use SWR for data fetching with built-in caching
  const { data, isLoading: swrLoading } = useSWR(
    cacheKey,
    projectsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true, // Always fetch fresh data when component mounts
      dedupingInterval: 2000, // 2 second deduplication (allows refetch on navigation)
      keepPreviousData: true,
    }
  );

  // Extract projects and pagination from SWR data
  const swrProjects: Project[] = data?.data ?? [];
  const swrPagination = {
    total: data?.pagination?.total ?? 0,
    totalPages: data?.pagination?.totalPages ?? 1,
    currentPage: filters.page,
  };

  // Use local projects if set (for optimistic updates), otherwise use SWR data
  const projects = localProjects ?? swrProjects;
  const loading = !cacheKey ? false : swrLoading;
  const pagination = swrPagination;

  // Update filters with page bounds checking
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFiltersState((prev) => {
      const updatedFilters = { ...prev, ...newFilters };

      if ("page" in newFilters) {
        updatedFilters.page = Math.max(
          1,
          Math.min(newFilters.page!, pagination.totalPages || 1)
        );
      } else if (Object.keys(newFilters).length > 0) {
        // Reset to page 1 when filters change (except for page changes)
        updatedFilters.page = 1;
      }

      return updatedFilters;
    });

    // Clear local projects to use fresh SWR data
    setLocalProjects(null);
  }, [pagination.totalPages]);

  // Refresh projects by revalidating SWR cache
  const refreshProjects = useCallback(async () => {
    console.log("🔄 Refreshing projects via SWR mutate");
    setLocalProjects(null);
    if (cacheKey) {
      await mutate(cacheKey);
    }
  }, [cacheKey]);

  // Invalidate all projects cache (used after mutations)
  const invalidateAllProjectsCache = useCallback(() => {
    // Clear local state so we use fresh SWR data after revalidation
    setLocalProjects(null);
    
    // Revalidate all project-related cache keys
    // The second argument `undefined` keeps existing data visible during revalidation
    // The third argument `{ revalidate: true }` forces refetch from server
    mutate(
      (key) => typeof key === "string" && key.includes("/api/projects"),
      undefined,
      { revalidate: true }
    );
  }, []);

  // Handle project added - invalidate cache to get fresh data
  const handleProjectAdded = useCallback(async (newProject: Project) => {
    console.log("➕ Adding new project:", newProject.title);
    
    // Invalidate cache to get fresh data (this clears localProjects and refetches)
    invalidateAllProjectsCache();
  }, [invalidateAllProjectsCache]);

  // Handle project deleted - invalidate cache to get fresh data
  const handleProjectDeleted = useCallback(async (projectId: string) => {
    console.log("🗑️ Deleting project:", projectId);
    
    // Invalidate cache (this clears localProjects and refetches)
    invalidateAllProjectsCache();
    
    // Also revalidate server cache
    try {
      await revalidateProjectCache();
    } catch (error) {
      console.error("Error revalidating after deletion:", error);
    }
  }, [invalidateAllProjectsCache]);

  // Handle project updated - invalidate cache to get fresh data
  const handleProjectUpdated = useCallback(async (updatedProject: Project) => {
    console.log("✏️ Updating project:", updatedProject.title);
    
    // Invalidate cache (this clears localProjects and refetches)
    invalidateAllProjectsCache();
    
    // If unfavoriting on favorites page, also revalidate server cache
    if (filters.showFavorites && !updatedProject.isFavorite) {
      try {
        await revalidateProjectCache();
      } catch (error) {
        console.error("Error revalidating after unfavorite:", error);
      }
    }
  }, [filters.showFavorites, invalidateAllProjectsCache]);

  // Sort projects client-side
  const sortedProjects = useMemo(() => {
    const result = [...projects];

    switch (filters.sortBy) {
      case "recently-edited":
        return result.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
          return dateB - dateA;
        });
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
      case "alphabetical":
        return result.sort((a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );
      case "alphabetical-desc":
        return result.sort((a, b) =>
          b.title.toLowerCase().localeCompare(a.title.toLowerCase())
        );
      case "most-tagged":
        return result.sort((a, b) => {
          const aTags = a.tags?.length || 0;
          const bTags = b.tags?.length || 0;
          return bTags - aTags;
        });
      case "least-favorited":
        return result.sort((a, b) => {
          const aFavorites = Number(a.total_favorites || 0);
          const bFavorites = Number(b.total_favorites || 0);
          return aFavorites - bFavorites;
        });
      case "trending":
        // Client-side approximation - server does proper 7-day filtering
        return result.sort((a, b) => {
          const aFavorites = Number(a.total_favorites || 0);
          const bFavorites = Number(b.total_favorites || 0);
          return bFavorites - aFavorites;
        });
      case "random": {
        // Fisher-Yates shuffle for true random
        const shuffled = [...result];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }
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
      setProjects: setLocalProjects,
      pagination,
    }),
    [
      sortedProjects,
      loading,
      handleProjectAdded,
      handleProjectDeleted,
      handleProjectUpdated,
      refreshProjects,
      isAuthenticated,
      filters,
      updateFilters,
      pagination,
    ]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

/**
 * Invalidate projects cache from anywhere
 * Call after project mutations (create, update, delete, favorite, unfavorite)
 * This marks all project caches as stale - they will refetch when next accessed
 * Using revalidate: false prevents immediate refetch, keeping UI smooth
 */
export function invalidateProjectsCache() {
  mutate(
    (key) => typeof key === "string" && key.includes("/api/projects"),
    undefined,
    { revalidate: false }
  );
}
