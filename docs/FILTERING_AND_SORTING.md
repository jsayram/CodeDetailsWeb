# Filtering, Sorting, and Category Selection System

This document provides a comprehensive overview of the project filtering, sorting, and category selection system in CodeDetails. It covers the architecture, data flow, API design, and implementation patterns used throughout the application.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Filter Types](#filter-types)
4. [Sort Options](#sort-options)
5. [Category System](#category-system)
6. [Context-Aware Category Counts](#context-aware-category-counts)
7. [API Design](#api-design)
8. [Client-Side Caching with SWR](#client-side-caching-with-swr)
9. [Component Hierarchy](#component-hierarchy)
10. [Implementation Examples](#implementation-examples)
11. [Replication Guide](#replication-guide)

---

## Overview

The filtering and sorting system allows users to:

- **Filter** projects by category, tags, ownership, favorites, and deleted status
- **Sort** projects by various criteria (newest, oldest, popular, trending, etc.)
- **Paginate** through large result sets
- **View context-aware options** where category dropdowns only show available categories for the current view

### Key Principles

- **Single Source of Truth**: All constants (sort options, categories) are centrally defined
- **Type Safety**: Full TypeScript coverage with Zod schema validation
- **RFC 7807 Compliance**: All API errors follow the RFC 7807 Problem Details standard
- **SWR Caching**: Client-side caching with stale-while-revalidate pattern
- **Context Awareness**: Filters adapt based on the current view (Community, My Projects, Favorites, Deleted)

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface                               │
├─────────────────────────────────────────────────────────────────────┤
│  FilterControls    │   SortBySelect    │   CategorySelect           │
│  (context-aware)   │   (dropdown)      │   (with availability)      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ProjectsProvider (Context)                      │
├─────────────────────────────────────────────────────────────────────┤
│  • Manages filter state                                              │
│  • Generates API cache keys                                          │
│  • Provides setFilters() function                                    │
│  • Uses SWR for data fetching                                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            API Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  GET /api/projects?category=web&sortBy=newest&page=1&limit=12       │
│  GET /api/categories/counts?userId=xxx&favorites=true               │
│  GET /api/shared-projects/[username]/categories                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Database (Drizzle ORM)                       │
├─────────────────────────────────────────────────────────────────────┤
│  • Dynamic WHERE clause building                                     │
│  • JOIN with favorites table for favorites view                      │
│  • Aggregation for category counts                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── constants/
│   ├── sort-options.ts          # Sort option values and labels
│   ├── project-categories.ts    # Category definitions
│   └── api-routes.tsx           # API route builders with filters
├── providers/
│   └── projects-provider.tsx    # Central filter state management
├── hooks/
│   ├── use-category-counts.ts   # SWR hook for category counts
│   └── use-user-category-counts.ts  # Per-user category counts
├── components/
│   ├── filters/
│   │   ├── SortBySelect.tsx     # Sort dropdown component
│   │   ├── CategorySelect.tsx   # Category dropdown component
│   │   └── index.ts             # Barrel export
│   └── navigation/
│       └── Filter/
│           └── FilterControlsComponent.tsx
├── lib/
│   ├── swr-fetchers.ts          # SWR cache keys and fetchers
│   └── api-errors.ts            # RFC 7807 error helpers
└── app/api/
    ├── projects/route.ts        # Main projects API
    └── categories/counts/route.ts  # Category counts API
```

---

## Filter Types

The `ProjectFilters` interface defines all available filter options:

```typescript
// src/providers/projects-provider.tsx
export interface ProjectFilters {
  sortBy: SortByValue;                    // Sorting method
  category: ProjectCategory | "all";       // Category filter
  showMyProjects: boolean;                 // Show only user's projects
  showFavorites: boolean;                  // Show only favorited projects
  showDeleted: boolean;                    // Show only soft-deleted projects
  showAll?: boolean;                       // Show all public projects
  page: number;                            // Current page (1-indexed)
  limit: number;                           // Items per page
  tags?: string[];                         // Filter by tags
  username?: string;                       // Filter by username (shared portfolio)
}
```

### Filter Combinations by View

| View | showMyProjects | showFavorites | showDeleted | username |
|------|---------------|---------------|-------------|----------|
| Community | false | false | false | - |
| My Projects | true | false | false | - |
| Favorites | false | true | false | - |
| Deleted | true | false | true | - |
| Shared Portfolio | - | - | - | `<username>` |

---

## Sort Options

### Available Sort Values

```typescript
// src/constants/sort-options.ts
export const SORT_BY_VALUES = [
  "random",           // Random order (default)
  "newest",           // Created date descending
  "oldest",           // Created date ascending
  "recently-edited",  // Updated date descending
  "popular",          // Most favorites
  "trending",         // Recent favorites (7-day window)
  "alphabetical",     // A-Z by title
  "alphabetical-desc",// Z-A by title
  "most-tagged",      // Most tags
  "least-favorited",  // Fewest favorites
] as const;

export type SortByValue = (typeof SORT_BY_VALUES)[number];
```

### Sort Option Labels

```typescript
export const SORT_BY_LABELS: Record<SortByValue, string> = {
  random: "Random",
  newest: "Newest First",
  oldest: "Oldest First",
  "recently-edited": "Recently Edited",
  popular: "Most Popular",
  trending: "Trending",
  alphabetical: "A-Z",
  "alphabetical-desc": "Z-A",
  "most-tagged": "Most Tagged",
  "least-favorited": "Least Popular",
};
```

### SQL Implementation for Sorting

```typescript
// src/app/api/projects/route.ts
const applySorting = (query, sortBy: string) => {
  switch (sortBy) {
    case "oldest":
      return query.orderBy(sql`${projects.created_at} asc`);
    case "recently-edited":
      return query.orderBy(sql`${projects.updated_at} desc`);
    case "popular":
      return query.orderBy(sql`${projects.total_favorites} desc`);
    case "alphabetical":
      return query.orderBy(sql`LOWER(${projects.title}) asc`);
    case "alphabetical-desc":
      return query.orderBy(sql`LOWER(${projects.title}) desc`);
    case "most-tagged":
      return query.orderBy(sql`(
        SELECT COUNT(*) FROM project_tags pt
        WHERE pt.project_id = ${projects.id}
      ) desc`);
    case "least-favorited":
      return query.orderBy(sql`${projects.total_favorites} asc`);
    case "trending":
      // Recent favorites in last 7 days
      return query.orderBy(sql`(
        SELECT COUNT(*) FROM favorites f
        WHERE f.project_id = ${projects.id}
          AND f.created_at > NOW() - INTERVAL '7 days'
      ) desc, ${projects.total_favorites} desc`);
    case "random":
      return query.orderBy(sql`RANDOM()`);
    case "newest":
    default:
      return query.orderBy(sql`${projects.created_at} desc`);
  }
};
```

---

## Category System

### Category Definitions

```typescript
// src/constants/project-categories.ts
export type ProjectCategory =
  | "web"
  | "mobile"
  | "desktop"
  | "backend"
  | "cloud-devops"
  | "data-engineering"
  | "ai-ml"
  | "dev-tools"
  | "integration"
  | "embedded-iot"
  | "gaming-graphics"
  | "security"
  | "blockchain-web3"
  | "ar-vr-xr"
  | "multimedia"
  | "automation-scripting"
  | "database-storage"
  | "testing-qa"
  | "other";

export const PROJECT_CATEGORIES = {
  web: {
    label: "Web Applications",
    description: "Browser-based applications and websites",
    keywords: "react vue angular svelte nextjs frontend...",
  },
  // ... other categories
};
```

### CategorySelect Component

```tsx
// src/components/filters/CategorySelect.tsx
interface CategorySelectProps {
  value: ProjectCategory | "all";
  onValueChange: (value: ProjectCategory | "all") => void;
  triggerClassName?: string;
  showLabel?: boolean;
  showPills?: boolean;
  hasCategoryProjects?: (category: string) => boolean;  // Availability checker
}

export function CategorySelect({
  value,
  onValueChange,
  hasCategoryProjects,  // Function to check if category has projects
}: CategorySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {Object.entries(PROJECT_CATEGORIES).map(([key, { label }]) => {
          // Disable categories that have no projects in current view
          const disabled = hasCategoryProjects ? !hasCategoryProjects(key) : false;
          return (
            <SelectItem
              key={key}
              value={key}
              disabled={disabled}
              className={disabled ? "text-muted-foreground" : ""}
            >
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
```

---

## Context-Aware Category Counts

### The Problem

Previously, category counts were calculated from the **paginated client-side array**, which led to:
- Categories showing 0 projects when they actually had projects (just not on the current page)
- Incorrect availability when filters were applied

### The Solution

Fetch category counts **directly from the database** with context-aware filters:

### Category Counts API

```typescript
// GET /api/categories/counts?userId=xxx&favorites=true&deleted=false

// src/app/api/categories/counts/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const showFavorites = searchParams.get("favorites") === "true";
  const showDeleted = searchParams.get("deleted") === "true";

  const categoryCounts = await executeQuery(async (db) => {
    const conditions: SQL<unknown>[] = [];

    if (showDeleted && userId) {
      // Deleted view: show only deleted projects for this user
      conditions.push(isNotNull(projects.deleted_at));
      conditions.push(eq(projects.user_id, userId));
    } else {
      // All other views: exclude deleted projects
      conditions.push(isNull(projects.deleted_at));
      
      if (userId && !showFavorites) {
        // My Projects view: filter by user
        conditions.push(eq(projects.user_id, userId));
      }
    }

    if (showFavorites && userId) {
      // Favorites view: join with favorites table
      const profileResult = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.user_id, userId))
        .limit(1);

      const profileId = profileResult[0].id;

      return await db
        .select({
          category: projects.category,
          count: sql<number>`count(*)::int`,
        })
        .from(projects)
        .innerJoin(favorites, eq(favorites.project_id, projects.id))
        .where(
          and(
            eq(favorites.profile_id, profileId),
            isNull(projects.deleted_at)
          )
        )
        .groupBy(projects.category);
    }

    // Standard query for community, my projects, or deleted views
    return await db
      .select({
        category: projects.category,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(and(...conditions))
      .groupBy(projects.category);
  });

  // Transform array to object: { web: 5, mobile: 3, ... }
  const countsMap = categoryCounts.reduce(
    (acc, { category, count }) => {
      if (category) acc[category] = count;
      return acc;
    },
    {} as Record<string, number>
  );

  return success(countsMap);
}
```

### useCategoryCounts Hook

```typescript
// src/hooks/use-category-counts.ts

export interface CategoryCountsFilters {
  userId?: string;
  favorites?: boolean;
  deleted?: boolean;
}

export function useCategoryCounts(filters?: CategoryCountsFilters) {
  const url = buildCategoryCountsUrl(filters);
  const cacheKey = buildCacheKey(filters);

  const { data, isLoading } = useSWR<Record<string, number>>(
    cacheKey,
    () => categoryCountsFetcher(url),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // Check if a category has projects in the current context
  const hasCategoryProjects = (categoryKey: string): boolean => {
    if (!data) return false;
    return (data[categoryKey] ?? 0) > 0;
  };

  return {
    categoryCounts: data ?? {},
    isLoading,
    hasCategoryProjects,  // Pass this to CategorySelect
    refreshCounts,
  };
}
```

### Usage in FilterControls

```tsx
// src/components/navigation/Filter/FilterControlsComponent.tsx
export function FilterControls() {
  const { filters, setFilters } = useProjects();
  const { userId } = useAuth();

  // Determine category counts filter based on current view
  const categoryCountsFilters = React.useMemo(() => {
    if (filters.showDeleted && userId) {
      return { userId, deleted: true };
    }
    if (filters.showFavorites && userId) {
      return { userId, favorites: true };
    }
    if (filters.showMyProjects && userId) {
      return { userId };
    }
    // Community view - global counts
    return undefined;
  }, [filters.showMyProjects, filters.showFavorites, filters.showDeleted, userId]);

  const { hasCategoryProjects } = useCategoryCounts(categoryCountsFilters);

  return (
    <div className="filters-section">
      <SortBySelect
        value={filters.sortBy}
        onValueChange={(value) => setFilters({ sortBy: value })}
      />
      <CategorySelect
        value={filters.category}
        onValueChange={(value) => setFilters({ category: value })}
        hasCategoryProjects={hasCategoryProjects}  // Enables/disables options
      />
    </div>
  );
}
```

### View-Specific Category Counts

| View | API Call | Result |
|------|----------|--------|
| Community | `GET /api/categories/counts` | All non-deleted projects |
| My Projects | `GET /api/categories/counts?userId=xxx` | User's projects only |
| Favorites | `GET /api/categories/counts?userId=xxx&favorites=true` | User's favorited projects |
| Deleted | `GET /api/categories/counts?userId=xxx&deleted=true` | User's soft-deleted projects |
| Shared Portfolio | `GET /api/shared-projects/[username]/categories` | Specific user's public projects |

---

## API Design

### URL Building with API_ROUTES

```typescript
// src/constants/api-routes.tsx
export const API_ROUTES = {
  PROJECTS: {
    BASE: "/api/projects",
    WITH_FILTERS: (filters: ProjectFilters) => {
      const params = new URLSearchParams();
      if (filters.showAll) params.append("showAll", "true");
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.username) params.append("username", filters.username);
      if (filters.category && filters.category !== "all")
        params.append("category", filters.category);
      if (filters.showFavorites) params.append("showFavorites", "true");
      if (filters.showDeleted) params.append("showDeleted", "true");
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.tags?.length) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }
      return `/api/projects?${params.toString()}`;
    },
    SHARED_CATEGORIES: (username: string) =>
      `/api/shared-projects/${username}/categories`,
  },
};
```

### Example API URLs

```
# Community projects, sorted by newest, page 1
GET /api/projects?showAll=true&sortBy=newest&page=1&limit=12

# User's web projects
GET /api/projects?userId=user_xxx&category=web&sortBy=popular&page=1&limit=12

# User's favorites with specific tags
GET /api/projects?userId=user_xxx&showFavorites=true&tags=react&tags=typescript

# Category counts for favorites view
GET /api/categories/counts?userId=user_xxx&favorites=true
```

### RFC 7807 Error Responses

All API errors follow the RFC 7807 Problem Details standard:

```typescript
// src/lib/api-errors.ts

// Success response
export function success<T>(data: T): NextResponse {
  return NextResponse.json({
    success: true,
    data,
  });
}

// Error response
export function notFound(resource: string, context?: ErrorContext): NextResponse {
  return NextResponse.json({
    success: false,
    error: {
      type: "error://NOT_FOUND",
      title: "Not Found",
      status: 404,
      detail: `The requested ${resource} was not found.`,
      code: "NOT_FOUND",
      timestamp: new Date().toISOString(),
      requestId: "req_abc123",
      hint: "Verify the resource exists and you have access.",
      context,
    }
  }, { status: 404 });
}
```

---

## Client-Side Caching with SWR

### SWR Cache Keys

```typescript
// src/lib/swr-fetchers.ts
export const SWR_KEYS = {
  TAGS: "tags",
  CATEGORY_COUNTS: "category-counts",
  USER_CATEGORY_COUNTS: (username: string) => `user-category-counts:${username}`,
  PROFILES: "profiles",
  PROJECTS: (filters: Record<string, unknown>) => 
    `projects:${JSON.stringify(filters)}`,
};
```

### Per-Filter Cache Keys

The `useCategoryCounts` hook generates unique cache keys per filter combination:

```typescript
function buildCacheKey(filters?: CategoryCountsFilters): string {
  if (!filters || (!filters.userId && !filters.favorites && !filters.deleted)) {
    return SWR_KEYS.CATEGORY_COUNTS;  // "category-counts"
  }
  return `${SWR_KEYS.CATEGORY_COUNTS}:${JSON.stringify(filters)}`;
  // Example: "category-counts:{"userId":"user_xxx","favorites":true}"
}
```

### Caching Strategy

```typescript
const { data, isLoading } = useSWR(
  cacheKey,
  fetcher,
  {
    revalidateOnFocus: false,      // Don't refetch when window gains focus
    revalidateOnReconnect: false,  // Don't refetch on network reconnect
    dedupingInterval: 300000,      // 5 minutes - dedupe identical requests
  }
);
```

---

## Component Hierarchy

```
App Layout
└── ProjectsProvider (Context)
    ├── FilterControls
    │   ├── SortBySelect
    │   │   └── Uses: SORT_BY_OPTIONS from constants
    │   └── CategorySelect
    │       └── Uses: PROJECT_CATEGORIES + hasCategoryProjects()
    │
    ├── ProjectListComponent
    │   └── Uses: useProjects().projects (filtered/sorted from API)
    │
    └── Pagination
        └── Uses: useProjects().pagination
```

---

## Implementation Examples

### Example 1: Adding a New Sort Option

**Step 1**: Add to constants

```typescript
// src/constants/sort-options.ts
export const SORT_BY_VALUES = [
  // ... existing values
  "most-viewed",  // NEW
] as const;

export const SORT_BY_LABELS: Record<SortByValue, string> = {
  // ... existing labels
  "most-viewed": "Most Viewed",  // NEW
};
```

**Step 2**: Add SQL implementation

```typescript
// src/app/api/projects/route.ts
const applySorting = (query, sortBy: string) => {
  switch (sortBy) {
    // ... existing cases
    case "most-viewed":
      return query.orderBy(sql`${projects.view_count} desc`);
  }
};
```

### Example 2: Adding a New Category

**Step 1**: Add to type and definitions

```typescript
// src/constants/project-categories.ts
export type ProjectCategory =
  | // ... existing categories
  | "quantum-computing";  // NEW

export const PROJECT_CATEGORIES = {
  // ... existing categories
  "quantum-computing": {
    label: "Quantum Computing",
    description: "Quantum algorithms and simulations",
    keywords: "qiskit quantum qubit algorithm simulation",
  },
};
```

### Example 3: Adding a New Filter Type

**Step 1**: Add to interface

```typescript
// src/providers/projects-provider.tsx
export interface ProjectFilters {
  // ... existing filters
  hasVideo?: boolean;  // NEW
}
```

**Step 2**: Add to URL builder

```typescript
// src/constants/api-routes.tsx
WITH_FILTERS: (filters: ProjectFilters) => {
  const params = new URLSearchParams();
  // ... existing params
  if (filters.hasVideo) params.append("hasVideo", "true");
  return `/api/projects?${params.toString()}`;
}
```

**Step 3**: Add to API handler

```typescript
// src/app/api/projects/route.ts
const { hasVideo } = validatedParams;

if (hasVideo) {
  conditions.push(isNotNull(projects.video_url));
}
```

---

## Replication Guide

To replicate this filtering system in another project:

### 1. Define Constants

Create centralized constant files for:
- Sort options with values and labels
- Categories with metadata
- API route builders

### 2. Create Provider Context

```typescript
// Minimal ProjectsProvider
interface FiltersState {
  sortBy: string;
  category: string;
  page: number;
  limit: number;
}

const FilterContext = createContext<{
  filters: FiltersState;
  setFilters: (f: Partial<FiltersState>) => void;
}>(null);

export function FilterProvider({ children }) {
  const [filters, setFiltersState] = useState<FiltersState>(defaultFilters);
  
  const setFilters = useCallback((newFilters: Partial<FiltersState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
}
```

### 3. Create SWR Hooks

```typescript
// Category counts hook
export function useCategoryCounts(filters?: Filters) {
  const { data } = useSWR(
    buildCacheKey(filters),
    () => fetch(buildUrl(filters)).then(r => r.json()),
    { dedupingInterval: 300000 }
  );

  const hasCategoryProjects = (key: string) => (data?.[key] ?? 0) > 0;
  
  return { categoryCounts: data ?? {}, hasCategoryProjects };
}
```

### 4. Build API with Dynamic Conditions

```typescript
// Build conditions array based on filters
const conditions: SQL[] = [];

if (filters.category !== "all") {
  conditions.push(eq(table.category, filters.category));
}

if (filters.userId) {
  conditions.push(eq(table.user_id, filters.userId));
}

// Execute with combined conditions
const results = await db
  .select()
  .from(table)
  .where(and(...conditions))
  .orderBy(getSortOrder(filters.sortBy));
```

### 5. Implement RFC 7807 Errors

```typescript
// Consistent error format
function apiError(code: string, detail: string, status: number) {
  return NextResponse.json({
    success: false,
    error: {
      type: `error://${code}`,
      title: code.replace(/_/g, " "),
      status,
      detail,
      timestamp: new Date().toISOString(),
    }
  }, { status });
}
```

---

## Summary

The CodeDetails filtering system provides:

✅ **Centralized Configuration**: All options defined in `src/constants/`  
✅ **Type Safety**: Full TypeScript + Zod validation  
✅ **Context Awareness**: Category availability based on current view  
✅ **Efficient Caching**: SWR with per-filter cache keys  
✅ **RFC 7807 Compliance**: Standardized error responses  
✅ **Scalable Architecture**: Easy to add new filters, sorts, or categories  

The key insight is separating **what's available** (category counts from database) from **what's displayed** (paginated project list), ensuring users always see accurate filter options regardless of pagination state.
