import { ProjectCategory } from "./project-categories";

/**
 * Centralized API route definitions
 * All API routes should be defined here to maintain consistency and avoid duplication
 */

interface ProjectFilters {
  showAll?: boolean;
  userId?: string;
  username?: string; // Add username filter
  category?: ProjectCategory | "all"; // Update to allow "all"
  tag?: string;
  tags?: string[]; // Add tags array
  showFavorites?: boolean;
  showDeleted?: boolean; // Add deleted filter
  sortBy?: string; // Add sorting
  page?: number;
  limit?: number;
}

export const API_ROUTES = {
  PROJECTS: {
    BASE: "/api/projects",
    BY_SLUG: (slug: string) => `/api/projects?slug=${slug}`,
    BY_ID: (id: string) => `/api/projects/${id}`,
    WITH_FILTERS: (filters: ProjectFilters) => {
      const params = new URLSearchParams();
      if (filters.showAll) params.append("showAll", "true");
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.username) params.append("username", filters.username);
      if (filters.category && filters.category !== "all")
        params.append("category", filters.category);
      if (filters.tag) params.append("tag", filters.tag);
      if (filters.showFavorites) params.append("showFavorites", "true");
      if (filters.showDeleted) params.append("showDeleted", "true");
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      // Handle tags array
      if (filters.tags?.length) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }
      return `/api/projects?${params.toString()}`;
    },
    TEST_PAGE: "/api/projects/test",
    SHARED: (username: string, filters?: ProjectFilters) => {
      const baseUrl = `/api/shared-projects/${username}`;
      if (!filters) return baseUrl;

      const params = new URLSearchParams();
      if (filters.showAll) params.append("showAll", "true");
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.category && filters.category !== "all")
        params.append("category", filters.category);
      if (filters.tag) params.append("tag", filters.tag);
      if (filters.showFavorites) params.append("showFavorites", "true");
      if (filters.showDeleted) params.append("showDeleted", "true");
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.tags?.length) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }

      return `${baseUrl}?${params.toString()}`;
    },
  },
  TIERS: {
    USER_TIER: "/api/tiers/user-tier",
  },
  AUTH: {
    WEBHOOK: "/api/webhook/clerk",
    USER: (userId: string) => `/users/${userId}`,
  },
  TEST: {
    BASE: "/api/test",
  },
  THEME: {
    TEST_PAGE: "/api/darkmodetest",
  },
  TOAST: {
    TEST_PAGE: "/api/toasttest",
  },
  CACHE: {
    REVALIDATE: "/api/revalidate",
    revalidateTags: (tags: string[]) => ({
      url: "/api/revalidate",
      config: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      },
    }),
    revalidateTag: (tag: string) => ({
      url: "/api/revalidate",
      config: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      },
    }),
  },
} as const;
