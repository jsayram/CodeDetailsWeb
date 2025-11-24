# Caching Strategy Documentation

## Overview
Comprehensive caching implementation across CodeDetailsWeb to improve performance and reduce database load. Uses Next.js `unstable_cache` API with strategic revalidation times and cache tags for targeted invalidation.

## Cache Layers

### 1. Middleware Cache (In-Memory)
**File:** `src/middleware.ts`

**Purpose:** Prevent Clerk API rate limiting and redundant user sync operations

**Implementation:**

#### Admin Authentication Cache
- In-memory Map with 5-minute TTL
- Error fallback: Returns cached admin status if Clerk API fails
- Cache key: User ID

```typescript
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

#### User Sync Deduplication Cache
- Prevents redundant sync-user API calls
- 5-minute debounce window per user
- Reduces 20+ sync calls to 1 per session

```typescript
const syncCache = new Map<string, number>(); // userId -> last sync timestamp
const SYNC_DEBOUNCE_TIME = 5 * 60 * 1000; // 5 minutes
```

**Request Filtering:**
Middleware skips sync for:
- API routes (`/api/*`)
- Server Actions (`/_next/*`)
- Data requests (`__nextDataReq`)
- Vercel internals (`/_vercel/*`)
- Static assets (`.ico`, `.png`, `.js`, etc.)

**Performance Impact:**
- **Before:** 20+ sync calls per page load (6-14 seconds wasted)
- **After:** 1 sync call per 5-minute session (300-700ms total)

---

### 2. Server Actions Cache (Next.js unstable_cache)

#### Admin Dashboard Actions
**File:** `src/app/actions/admin-dashboard.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedDashboardStats` | 2 minutes | `['admin-dashboard']` |
| `getCachedTagSubmissions` | 1 minute | `['admin-dashboard', 'tag-submissions']` |

**Rationale:** Admin stats change frequently but don't need real-time updates.

---

#### Advanced Analytics
**File:** `src/app/actions/advanced-analytics.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedTopContributors` | 5 minutes | `['admin-dashboard', 'contributors']` |
| `getCachedTagPipelineAnalytics` | 2 minutes | `['admin-dashboard', 'tag-submissions']` |

**Rationale:** Analytics data is computationally expensive and can tolerate slight staleness.

---

#### User Dashboard
**File:** `src/app/actions/user-dashboard.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedUserDashboardStats` | 2 minutes | `['user-dashboard']` |

**Rationale:** User-specific stats update moderately and benefit from caching.

---

#### General Dashboard
**File:** `src/app/actions/dashboard.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedDashboardStats` | 3 minutes | `['dashboard']` |
| `getCachedTagSubmissions` | 1 minute | `['dashboard', 'tag-submissions']` |

**Rationale:** Public dashboard shows less volatile data than admin view.

---

#### Tags
**File:** `src/app/actions/tags.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedProjectTags` | 5 minutes | `['tags', 'projects']` |
| `getCachedAllTags` | 10 minutes | `['tags']` |

**Rationale:** Tags are relatively stable; tag lists change infrequently.

**Write Operations (Cache Invalidation):**
- `addTag` - Invalidates: `['tags', 'projects']`
- `removeTag` - Invalidates: `['tags', 'projects']`
- `createTag` - Invalidates: `['tags']`

---

#### Projects
**File:** `src/app/actions/projects.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedProjectById` | 5 minutes | `['projects', 'project-detail']` |
| `getCachedProjectBySlug` | 5 minutes | `['projects', 'project-detail']` |
| `getCachedProject` | 5 minutes | `['projects', 'project-detail']` |
| `getCachedUserProjects` | 3 minutes | `['projects', 'user-projects']` |
| `getCachedAllProjects` | 5 minutes | `['projects']` |
| `getCachedUserOwnProjects` | 3 minutes | `['projects', 'user-own-projects']` |

**Rationale:** 
- Project details are frequently accessed and moderately stable
- User-specific queries have shorter cache times for fresher data
- All projects cache longer as it changes less frequently

**Write Operations (Cache Invalidation):**
- `createProject` - Invalidates: `['projects', 'user-projects', 'user-own-projects']`
- `updateProject` - Invalidates: `['projects', 'user-projects', 'user-own-projects', 'project-detail']`
- `removeProject` - Invalidates: `['projects', 'user-projects', 'user-own-projects', 'project-detail']`
- `permanentlyDeleteProject` - Invalidates: `['projects', 'user-projects', 'user-own-projects', 'project-detail']`
- `restoreProject` - Invalidates: `['projects', 'user-projects', 'user-own-projects', 'project-detail']`
- `addProjectFavorite` - Invalidates: `['project-detail']`
- `removeProjectFavorite` - Invalidates: `['project-detail']`

---

#### User Tier
**File:** `src/app/actions/user-tier.ts`

| Function | Cache Time | Cache Tags |
|----------|-----------|------------|
| `getCachedUserTier` | 5 minutes | `['user-tier']` |

**Rationale:** Tier changes are infrequent (subscription upgrades/downgrades).

**Write Operations (Cache Invalidation):**
- `updateUserAction` (in user-management.ts) - Invalidates: `['user-tier']`

---

#### User Management
**File:** `src/app/actions/user-management.ts`

**Write Operations (Cache Invalidation):**
- `updateUserAction` - Invalidates: `['admin-dashboard', 'user-tier']`

---

## Cache Revalidation Strategy

### Time-Based Revalidation
- **1 minute:** High-volatility data (tag submissions)
- **2-3 minutes:** Moderate-volatility data (dashboard stats)
- **5 minutes:** Low-volatility data (projects, tags, user tiers)
- **10 minutes:** Very stable data (all tags list)

### Tag-Based Revalidation
Write operations use `revalidateTag()` to immediately invalidate related caches:

```typescript
// Example: Creating a project
revalidateTag('projects');
revalidateTag('user-projects');
revalidateTag('user-own-projects');
```

## Cache Tags Reference

| Tag | Purpose | Invalidated By |
|-----|---------|----------------|
| `admin-dashboard` | Admin dashboard data | Admin stats writes, user updates |
| `user-dashboard` | User dashboard data | User-specific writes |
| `dashboard` | Public dashboard data | General dashboard writes |
| `tags` | Tag-related data | Tag creation, modification |
| `projects` | Project lists | Project CRUD operations |
| `project-detail` | Individual project data | Project updates, favorites |
| `user-projects` | User's accessible projects | Project CRUD, user updates |
| `user-own-projects` | User's created projects | Project CRUD |
| `tag-submissions` | Tag submission data | Tag approval/rejection |
| `contributors` | Contributor analytics | User profile updates |
| `user-tier` | User subscription tiers | Tier updates |

## Performance Benefits

### Before Optimizations
- **Repeated database queries** on every dashboard visit
- **Clerk API rate limiting** (429 errors)
- **20+ redundant user syncs** per page load
- **Slow page loads** due to multiple uncached fetches
- **6-14 seconds** wasted on duplicate sync operations

### After Optimizations
- ✅ **Reduced database load** (5-10x fewer queries)
- ✅ **No Clerk API rate limiting** (middleware cache + sync deduplication)
- ✅ **1 user sync per session** (5-minute debounce window)
- ✅ **Faster page loads** (cached data served from memory)
- ✅ **Better user experience** with instant data rendering
- ✅ **Optimized sync endpoint** (removed redundant tier check, conditional tier updates)

### Sync Endpoint Optimizations
**File:** `src/lib/user-sync-utils.ts`

**Changes:**
1. **Removed redundant tier check** - Previously fetched tier from DB before update (extra query)
2. **Conditional tier updates** - Only update tier if explicitly provided in metadata
3. **Preserved existing tiers** - Prevents overwriting user's current tier with default 'free'

**Impact:**
- Reduced DB queries per sync from 3 to 2 (33% reduction)
- Faster sync operations (removed 100-200ms tier fetch)
- Safer tier management (preserves user upgrades)

## Best Practices

### When to Use Cached Functions
✅ Use cached versions (`getCached*`) for:
- Public-facing pages
- Dashboard views
- List/index pages
- Frequently accessed detail pages

### When to Use Uncached Functions
✅ Use original functions for:
- Admin operations requiring real-time data
- Critical user actions (create, update, delete)
- Data validation before writes

### Adding New Cached Functions

1. **Wrap the function:**
```typescript
export const getCachedFunction = unstable_cache(
  async (param: string) => originalFunction(param),
  ['cache-key'],
  {
    revalidate: 300, // seconds
    tags: ['tag1', 'tag2']
  }
);
```

2. **Choose revalidation time:**
- 60s: High-frequency updates
- 180s: Moderate updates
- 300s: Low-frequency updates
- 600s: Very stable data

3. **Add appropriate tags:**
- Include all related data categories
- Enables targeted invalidation

4. **Invalidate on writes:**
```typescript
revalidateTag('tag1');
revalidateTag('tag2');
```

## Manual Cache Control

### Refresh Buttons
Both user and admin dashboards include manual refresh buttons for testing cache behavior and forcing data reload.

**User Dashboard:**
- Location: Dashboard header (right-aligned)
- Icon: RefreshCw
- Triggers: `refresh()` from `useDashboardCache` hook
- Loading state: Shows "Refreshing..." with spinning icon

**Admin Dashboard:**
- Location: Dashboard header (right-aligned)
- Icon: TrendingUp
- Triggers: `handleRefresh()` callback
- Loading state: Shows "Refreshing..." with spinning icon
- Reloads: Both main stats and advanced analytics data

**Implementation Details:**
```typescript
// Admin Dashboard (page.tsx)
const [isRefreshing, setIsRefreshing] = useState(false);

const loadData = useCallback(async () => {
  // Loads main dashboard stats and super admin status
}, []);

const loadAnalytics = useCallback(async () => {
  // Loads contributors and tag pipeline analytics
}, []);

const handleRefresh = useCallback(async () => {
  setIsRefreshing(true);
  await Promise.all([loadData(), loadAnalytics()]);
  setIsRefreshing(false);
}, [loadData, loadAnalytics]);
```

**Usage:**
- Click refresh button to force reload cached data
- Useful for testing cache effectiveness
- Provides immediate visual feedback during reload
- Button disabled during refresh to prevent duplicate requests

## Monitoring

### Cache Hit Rate
Monitor in Next.js build output and production logs.

### Cache Invalidation
Check revalidation logs when data updates occur.

### Performance Metrics
- Time to First Byte (TTFB)
- Server Response Time
- Database Query Count

### Testing Cache Performance
Use `/test-cache` page (admin-only) to verify caching:
- Tests Projects, Dashboard Stats, and Tags caching
- Shows execution times for each cached function
- Integrated into admin dashboard for easy access
- Note: Page uses `dynamic = 'force-dynamic'` to test action caching, not page caching

## Future Improvements TODO

1. **Redis Integration:** Move from in-memory to Redis for multi-instance support
2. **Stale-While-Revalidate:** Serve stale data while fetching fresh data
3. **Cache Warming:** Pre-populate caches for frequently accessed data
4. **Metrics Dashboard:** Visual monitoring of cache performance
5. **Granular Cache Keys:** Include parameters in cache keys for more precise invalidation

---

**Last Updated:** 2024
**Version:** 1.0
