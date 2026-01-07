# Caching Strategy Documentation

## Overview

CodeDetailsWeb implements a multi-layered caching strategy:

1. **Server-Side**: Next.js `unstable_cache` with tag-based invalidation
2. **Client-Side**: SWR (Stale-While-Revalidate) for React data fetching
3. **Middleware**: In-memory Maps for auth deduplication

This architecture minimizes database queries, provides instant UI updates, and ensures cache consistency across the application.

---

## Architecture Summary

| Layer | Technology | Purpose | TTL |
|-------|------------|---------|-----|
| Middleware | In-memory Map | Admin auth, user sync deduplication | 5 minutes |
| Server Actions | Next.js unstable_cache | Database query caching | 60s - 600s |
| Client State | SWR | React data fetching & caching | 1-5 minutes |

---

## 1. Client-Side Caching with SWR

### Why SWR?

SWR (Stale-While-Revalidate) is Vercel's React data fetching library that provides:

- **Automatic deduplication**: Multiple components requesting the same data share one request
- **Revalidation on focus**: Data refreshes when user returns to tab (disabled by default)
- **Optimistic updates**: UI updates instantly, syncs with server in background
- **Error retry**: Automatic exponential backoff on failures
- **Built-in cache**: No manual cache management required
- **TypeScript-first**: Full type safety out of the box

### Global SWR Configuration

**File:** `src/providers/swr-provider.tsx`

```typescript
"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,      // Don't refetch on window focus
        revalidateOnReconnect: false,  // Don't refetch on reconnect
        dedupingInterval: 60000,       // Dedupe requests within 1 minute
        errorRetryCount: 3,            // Retry failed requests 3 times
        keepPreviousData: true,        // Show stale data while revalidating
        fetcher: async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Fetch failed");
          return res.json();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

### SWR Cache Keys

**File:** `src/lib/swr-fetchers.ts`

```typescript
export const SWR_KEYS = {
  TAGS: "tags",
  USER_TIER: (userId: string) => `/api/tiers/user-tier?userId=${userId}`,
  PROJECTS: (filters: Record<string, unknown>) => 
    `projects:${JSON.stringify(filters)}`,
  DASHBOARD_STATS: "dashboard-stats",
} as const;
```

Cache keys are deterministic and include all parameters that affect the data, ensuring proper cache isolation.

---

### Server-Side Cache Tags

**File:** `src/lib/swr-fetchers.ts`

```typescript
export const CACHE_TAGS = {
  // Project-related
  PROJECTS: "projects",
  PROJECT_DETAIL: "project-detail",
  USER_PROJECTS: "user-projects",
  
  // Tag-related
  TAGS: "tags",
  TAG_SUBMISSIONS: "tag-submissions",
  
  // User-related
  USER_PROFILE: "user-profile",
  USER_TIER: "user-tier",
  USER_DASHBOARD: "user-dashboard",
  
  // Admin-related
  ADMIN_DASHBOARD: "admin-dashboard",
  CONTRIBUTORS: "contributors",
  
  // General
  DASHBOARD: "dashboard",
} as const;
```

---

### Cache Revalidation Functions

**File:** `src/lib/swr-fetchers.ts`

```typescript
/**
 * Revalidate project-related caches
 * Call after: create, update, delete, favorite, unfavorite
 */
export async function revalidateProjectCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.PROJECTS,
    CACHE_TAGS.PROJECT_DETAIL,
    CACHE_TAGS.USER_PROJECTS,
  ]);
}

/**
 * Revalidate tag-related caches
 * Call after: tag create, approve, reject, delete
 */
export async function revalidateTagCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.TAGS,
    CACHE_TAGS.PROJECTS, // Tags affect project display
  ]);
}

/**
 * Revalidate admin dashboard caches
 * Call after: admin actions, analytics updates
 */
export async function revalidateAdminCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.ADMIN_DASHBOARD,
    CACHE_TAGS.TAG_SUBMISSIONS,
    CACHE_TAGS.CONTRIBUTORS,
  ]);
}

/**
 * Revalidate user profile caches
 * Call after: profile updates, tier changes
 */
export async function revalidateUserProfileCache(): Promise<void> {
  await revalidate([
    CACHE_TAGS.USER_PROFILE,
    CACHE_TAGS.USER_DASHBOARD,
    CACHE_TAGS.USER_TIER,
  ]);
}
```

---

### SWR Hooks

#### useTags Hook

**File:** `src/hooks/use-tags.ts`

```typescript
export function useTags() {
  const { data, error, isLoading, isValidating } = useSWR<TagInfo[]>(
    SWR_KEYS.TAGS,
    tagsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  const refreshTags = async () => {
    await mutate(SWR_KEYS.TAGS);
  };

  const addTagToCache = (tag: TagInfo) => {
    mutate(
      SWR_KEYS.TAGS,
      (currentTags: TagInfo[] | undefined) => {
        if (!currentTags) return [tag];
        if (currentTags.some((t) => t.id === tag.id)) return currentTags;
        return [...currentTags, tag];
      },
      { revalidate: false }
    );
  };

  const invalidateCache = () => {
    mutate(SWR_KEYS.TAGS, undefined, { revalidate: true });
  };

  return {
    tags: data ?? [],
    isLoading,
    isValidating,
    error,
    refreshTags,
    addTagToCache,
    invalidateCache,
    refreshCache: refreshTags,
  };
}
```

**Features:**
- Automatic fetching on mount
- `refreshTags()`: Force revalidation from server
- `addTagToCache()`: Optimistic update without network request
- `invalidateCache()`: Clear cache and trigger refetch
- 5-minute deduplication interval

---

#### useUserTier Hook

**File:** `src/hooks/use-user-tier.ts`

```typescript
export function useUserTier(userId: string | null, skipFetch = false) {
  const shouldFetch = !skipFetch && !!userId;
  const cacheKey = shouldFetch ? SWR_KEYS.USER_TIER(userId!) : null;

  const { data, error, isLoading, isValidating } = useSWR<ValidTier>(
    cacheKey,
    fetchUserTier,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      fallbackData: "free" as ValidTier,
    }
  );

  const refreshUserTier = async () => {
    if (cacheKey) {
      await mutate(cacheKey);
    }
  };

  return {
    userTier: data ?? "free",
    loading: isLoading,
    isValidating,
    error: error ? String(error) : null,
    refreshUserTier,
    isReady: !isLoading && !isValidating,
  };
}
```

**Features:**
- Conditional fetching (skips when userId is null or skipFetch is true)
- `isValidating`: True during background revalidation
- `isReady`: Boolean for rendering gates
- Default fallback to "free" tier

---

#### ProjectsProvider with SWR

**File:** `src/providers/projects-provider.tsx`

```typescript
export function ProjectsProvider({ children, token, userId }: Props) {
  // Local state for optimistic updates
  const [localProjects, setLocalProjects] = useState<Project[] | null>(null);
  
  // Generate cache key based on filters
  const cacheKey = getProjectsCacheKey(filters, userId, shouldFetch);
  
  // Use SWR for data fetching
  const { data, isLoading } = useSWR(
    cacheKey,
    projectsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
    }
  );

  // Use local projects if set (for optimistic updates), otherwise use SWR data
  const projects = localProjects ?? swrProjects;

  // Invalidate all projects cache
  const invalidateAllProjectsCache = useCallback(() => {
    setLocalProjects(null);
    mutate(
      (key) => typeof key === "string" && key.includes("/api/projects"),
    );
  }, []);

  // Handle mutations with cache invalidation
  const handleProjectAdded = useCallback(async (newProject: Project) => {
    invalidateAllProjectsCache();
  }, [invalidateAllProjectsCache]);

  const handleProjectDeleted = useCallback(async (projectId: string) => {
    invalidateAllProjectsCache();
    await revalidateProjectCache(); // Also revalidate server cache
  }, [invalidateAllProjectsCache]);

  const handleProjectUpdated = useCallback(async (updatedProject: Project) => {
    invalidateAllProjectsCache();
    if (filters.showFavorites && !updatedProject.isFavorite) {
      await revalidateProjectCache();
    }
  }, [filters.showFavorites, invalidateAllProjectsCache]);
}
```

**Features:**
- SWR handles all network requests and caching
- Local state for optimistic updates (favorites, deletes)
- `keepPreviousData`: Shows old data during pagination/filter changes
- Cache key includes all filter parameters for proper isolation

---

### Cache Invalidation Patterns

#### Mutation-Based Invalidation

```typescript
import { mutate } from 'swr';
import { SWR_KEYS } from '@/lib/swr-fetchers';

// After creating a new tag
await createTag(tagData);
mutate(SWR_KEYS.TAGS); // Revalidate tags cache

// After updating user tier
await updateUserTier(userId, newTier);
mutate(SWR_KEYS.USER_TIER(userId)); // Revalidate specific user's tier

// After project changes - invalidate all project caches
mutate((key) => typeof key === 'string' && key.includes('/api/projects'));
```

#### Server-Side Revalidation

```typescript
import { revalidateProjectCache } from '@/lib/swr-fetchers';

// After mutations that need server cache invalidation
await revalidateProjectCache();
```

#### Optimistic Updates

```typescript
// Add tag optimistically
const { addTagToCache } = useTags();
addTagToCache(newTag); // Updates UI immediately
await createTag(newTag); // Syncs with server

// If server fails, SWR automatically revalidates and rolls back
```

---

## 2. Server-Side Caching (Next.js unstable_cache)

### Purpose

Cache database queries on the server with automatic time-based revalidation and manual tag-based invalidation.

### Configuration Pattern

```typescript
import { unstable_cache, revalidateTag } from 'next/cache';

export const getCachedFunction = unstable_cache(
  async (param: string) => {
    return await db.query.table.findMany(...);
  },
  ['unique-cache-key'],
  {
    revalidate: 300, // 5 minutes
    tags: ['tag1', 'tag2']
  }
);
```

### Revalidation Time Guidelines

| TTL | Use Case | Examples |
|-----|----------|----------|
| 60s | High volatility | Tag submissions, real-time stats |
| 120s | Moderate volatility | Dashboard stats, user-specific data |
| 300s | Low volatility | Projects, user profiles, tiers |
| 600s | Very stable | System-wide tag lists |

---

### Cached Server Actions

#### Tags
**File:** `src/app/actions/tags.ts`

| Function | TTL | Tags | Purpose |
|----------|-----|------|---------|
| `getCachedAllTags()` | 600s | `['tags']` | All approved tags |
| `getCachedProjectTags(projectId)` | 300s | `['tags', 'projects']` | Tags for specific project |

**Invalidation:**
```typescript
revalidateTag('tags', {}); // Next.js 16 requires second argument
```

---

#### Projects
**File:** `src/app/actions/projects.ts`

| Function | TTL | Tags | Purpose |
|----------|-----|------|---------|
| `getCachedProjectById(id)` | 300s | `['projects', 'project-detail']` | Single project |
| `getCachedProjectBySlug(slug)` | 300s | `['projects', 'project-detail']` | Project by URL slug |
| `getCachedUserProjects(userId)` | 180s | `['projects', 'user-projects']` | User's accessible projects |
| `getCachedAllProjects()` | 300s | `['projects']` | All public projects |

**Invalidation:**
```typescript
revalidateTag('projects', {});       // After any project change
revalidateTag('project-detail', {}); // After project update
revalidateTag('user-projects', {});  // After user's project changes
```

---

#### User Tier
**File:** `src/app/actions/user-tier.ts`

| Function | TTL | Tags | Purpose |
|----------|-----|------|---------|
| `getCachedUserTier(userId)` | 300s | `['user-tier']` | User subscription tier |

---

#### Dashboard Statistics
**File:** `src/app/actions/dashboard.ts`

| Function | TTL | Tags | Purpose |
|----------|-----|------|---------|
| `getCachedDashboardStats()` | 180s | `['dashboard']` | Public dashboard stats |
| `getCachedTagSubmissions(limit)` | 60s | `['dashboard', 'tag-submissions']` | Recent submissions |

---

#### Admin Dashboard
**File:** `src/app/actions/admin-dashboard.ts`

| Function | TTL | Tags | Purpose |
|----------|-----|------|---------|
| `getCachedDashboardStats()` | 120s | `['admin-dashboard']` | Admin overview stats |
| `getCachedTagSubmissions(limit, status)` | 60s | `['admin-dashboard', 'tag-submissions']` | Tag review queue |
| `getCachedTopContributors(limit)` | 300s | `['admin-dashboard', 'contributors']` | Top contributors |

---

## 3. Middleware Caching

**File:** `src/middleware.ts`

### Admin Authentication Cache

Prevents Clerk API rate limiting by caching admin status checks.

```typescript
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function isAdminCached(userId: string): Promise<boolean> {
  const cached = adminCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.isAdmin;
  }
  
  const isAdmin = await checkAdminStatus(userId);
  adminCache.set(userId, { isAdmin, timestamp: Date.now() });
  return isAdmin;
}
```

### User Sync Deduplication

Prevents duplicate user sync operations within a debounce window.

```typescript
const syncCache = new Map<string, number>();
const SYNC_DEBOUNCE = 5 * 60 * 1000; // 5 minutes

function shouldSyncUser(userId: string): boolean {
  const lastSync = syncCache.get(userId);
  if (lastSync && Date.now() - lastSync < SYNC_DEBOUNCE) {
    return false;
  }
  syncCache.set(userId, Date.now());
  return true;
}
```

---

## 4. Cache Invalidation Strategy

### Server-Side Invalidation

Write operations invalidate relevant cache tags:

```typescript
// After creating project
export async function createProject(project: InsertProject, userId: string) {
  await db.insert(projects).values(project);
  
  revalidateTag('projects', {});
  revalidateTag('user-projects', {});
  revalidatePath('/projects');
  
  return { success: true, data: project };
}
```

### Client-Side Invalidation

SWR mutations trigger after successful server operations:

```typescript
// In component
const handleCreateProject = async (data: ProjectData) => {
  const result = await createProject(data, userId);
  
  if (result.success) {
    // Invalidate SWR cache
    mutate((key) => typeof key === 'string' && key.includes('/api/projects'));
    
    // Invalidate server cache
    await revalidateProjectCache();
  }
};
```

### Full Invalidation Flow

1. **User action** → Component handler
2. **Server action** → Database write + `revalidateTag(tag, {})`
3. **Response** → Component receives success
4. **SWR mutation** → `mutate()` invalidates client cache
5. **Server revalidation** → `revalidateProjectCache()` invalidates server cache
6. **Revalidation** → SWR fetches fresh data
7. **UI update** → React re-renders with new data

---

## 5. Best Practices

### DO ✅

- Use SWR's `mutate()` for cache invalidation
- Include all filter parameters in cache keys
- Use optimistic updates for better UX
- Set appropriate TTLs based on data volatility
- Use `keepPreviousData` for smoother transitions
- Use `revalidateTag(tag, {})` with second argument (Next.js 16 requirement)
- Use context data as fallback: `(prev ?? projects)` not `(prev ?? [])`

### DON'T ❌

- Create manual in-memory caches (use SWR instead)
- Cache personalized data globally (use user-specific keys)
- Forget to invalidate after write operations
- Use overly long TTLs for volatile data
- Ignore error states in SWR responses
- Pass `undefined` as data to `mutate()` (causes flash of empty state)

---

## 6. Debugging

### SWR DevTools

Install the SWR DevTools browser extension to inspect:
- Active cache entries
- Pending requests
- Revalidation status
- Error states

### Cache Key Inspection

```typescript
// Log current cache state
import { useSWRConfig } from 'swr';

const { cache } = useSWRConfig();
console.log('Cache entries:', [...cache.keys()]);
```

### Force Revalidation

```typescript
// Revalidate specific key
mutate(SWR_KEYS.TAGS);

// Revalidate all matching keys
mutate((key) => typeof key === 'string' && key.includes('/api/projects'));

// Clear entire cache and refetch
mutate(() => true, undefined, { revalidate: true });
```

---

## 7. File Reference

| File | Purpose |
|------|---------|
| `src/providers/swr-provider.tsx` | Global SWR configuration |
| `src/lib/swr-fetchers.ts` | Fetcher functions, cache keys, cache tags, and revalidation helpers |
| `src/hooks/use-tags.ts` | SWR-based tag hook |
| `src/hooks/use-user-tier.ts` | SWR-based tier hook |
| `src/providers/projects-provider.tsx` | Projects context with SWR |
| `src/app/api/revalidate/route.ts` | Server-side cache invalidation endpoint |

