import { ProjectCategory } from "./project-categories";

/**
 * Centralized API route definitions
 * All API routes should be defined here to maintain consistency and avoid duplication
 */

interface ProjectFilters {
  showAll?: boolean;
  userId?: string;
  category?: ProjectCategory;
  tag?: string;
  showFavorites?: boolean;
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
      if (filters.category) params.append("category", filters.category);
      if (filters.tag) params.append("tag", filters.tag);
      if (filters.showFavorites) params.append("showFavorites", "true");
      return `/api/projects?${params.toString()}`;
    },
    TEST_PAGE: "/api/projects/test",
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
