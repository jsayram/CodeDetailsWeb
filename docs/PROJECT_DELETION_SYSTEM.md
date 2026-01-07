# Project Deletion System Documentation

## Overview

The CodeDetailsWeb platform implements a **two-stage deletion system** for projects with sophisticated handling of related data (favorites, tags, tag submissions, and images). This design balances user safety (preventing accidental permanent loss) with data integrity and user experience.

---

## Architecture

### Two-Stage Deletion Flow

```
Active Project → Soft Delete (Graveyard) → Hard Delete (Permanent)
     ↓                    ↓                        ↓
  Public            Owner/Admin Only           Gone Forever
```

---

## 1. Soft Delete (Send to Graveyard)

### Overview
When a project owner "deletes" a project, it's actually **soft-deleted** by setting a timestamp, not physically removed from the database.

### Technical Implementation

**Action**: `removeProject()` → `deleteProjectServer()`

**Database Change**:
```typescript
// Sets deleted_at timestamp
{
  deleted_at: new Date(),
  updated_at: new Date()
}
```

**Files Involved**:
- `/src/app/actions/projects.ts` - `removeProject()`
- `/src/db/actions.ts` - `deleteProjectServer()`

### What Happens to Related Data

Since the project row **still exists** in the database, all foreign key relationships remain intact:

| Table | Status | Notes |
|-------|--------|-------|
| `favorites` | ✅ Preserved | Users who favorited still see it (graveyard card) |
| `project_tags` | ✅ Preserved | Tag associations remain |
| `tag_submissions` | ✅ Preserved | Submission history intact |
| `project_images` | ✅ Preserved | Images stored but hidden |

### Access Control

```typescript
// From getProjectBySlugServer()
if (project.deleted_at !== null) {
  const isOwner = viewerUserId && project.user_id === viewerUserId;
  const isAdminUser = isAdmin(viewerEmail);
  
  // Only owner or admin can view soft-deleted projects
  if (!isOwner && !isAdminUser) {
    return null; // Returns 404 for everyone else
  }
}
```

**Who Can Access**:
- ✅ **Owner**: Full access via "Deleted Projects" (Graveyard) page
- ✅ **Admins**: Can view for moderation purposes
- ❌ **Public**: Receives 404 error
- ⚠️ **Users who favorited**: See graveyard card but cannot navigate

### User Experience

**Owner View** (`/projects/deleted`):
- Graveyard-themed page with skull emoji background
- Full project list with actions: Restore, Permanently Delete
- Can still edit/view deleted projects

**Modal**:
- `/src/components/Projects/ProjectComponents/DeleteConfirmationModal.tsx`
- Shows "🪦 Send to Graveyard?" dialog
- Explains project will be hidden from community

### Cache Invalidation
```typescript
revalidateTag('projects');
revalidateTag('user-projects');
revalidateTag('user-own-projects');
revalidateTag('project-detail');
```

---

## 2. Hard Delete (Permanent Deletion)

### Overview
Physical removal of the project record from the database. **This action cannot be undone.**

### Technical Implementation

**Action**: `permanentlyDeleteProject()` → `db.delete(projects)`

**Precondition Check**:
```typescript
if (!project.deleted_at) {
  throw new Error("Project must be in the graveyard before permanent deletion");
}
```
Projects **must be soft-deleted first** before permanent deletion is allowed.

**Files Involved**:
- `/src/app/actions/projects.ts` - `permanentlyDeleteProject()`
- `/src/services/projectService.ts` - Service wrapper

### Foreign Key Cascade Behavior

When a project is permanently deleted, foreign key constraints determine what happens to related data:

| Table | Foreign Key | Delete Rule | Behavior |
|-------|-------------|-------------|----------|
| `favorites` | `project_id` | **CASCADE** | All favorite records deleted |
| `project_tags` | `project_id` | **CASCADE** | All tag associations deleted |
| `project_images` | `project_id` | **CASCADE** | All image records deleted |
| `tag_submissions` | `project_id` | **SET NULL** | `project_id` becomes NULL, record preserved |

### Tag Submissions Special Handling

Tag submissions use **SET NULL** to preserve user contribution history:

**Why SET NULL?**
- Users who submitted tags deserve to see their submission history
- Approved tags may now be used across many projects
- Admins need origin story for tag approval decisions
- Rejected submissions show what was tried before

**Snapshot Data Preserved**:
```typescript
{
  project_id: null,              // Foreign key set to NULL
  project_slug: "original-slug",  // Snapshot preserved
  project_title: "Project Name",  // Snapshot preserved
  tag_name: "react",
  status: "approved",
  admin_notes: "...",
  // ... all other fields intact
}
```

**UI Handling**:
```typescript
// Dashboard TagSubmissionCard component
const isPermanentlyDeleted = !project_id; // Check if NULL

if (isPermanentlyDeleted) {
  return (
    <>
      <Badge>⚰️ Project Deleted</Badge>
      <div>Originally submitted for: {project_title}</div>
      {/* No link, just display snapshot data */}
    </>
  );
}
```

### User Experience

**Modal**:
- `/src/components/Projects/ProjectComponents/PermanentDeleteConfirmationModal.tsx`
- Red-themed warning modal
- Shows "⚠️ Permanent Deletion Warning"
- Lists consequences: data permanently removed, cannot be restored

**Post-Deletion**:
- Project disappears from graveyard
- No recovery possible
- All favorites removed from other users' lists
- Tag submissions show "⚰️ Project Deleted" badge

### Cache Invalidation
```typescript
revalidateTag('projects');
revalidateTag('user-projects');
revalidateTag('user-own-projects');
revalidateTag('project-detail');
```

---

## 3. Favorites Handling

### Design Philosophy
Favorites serve as a **historical record** of what users found valuable, similar to YouTube's approach of keeping deleted videos in "Liked Videos" playlists.

### Soft-Deleted Projects in Favorites

**Query Strategy**:
```typescript
// From userDashboardOperations.ts
const myFavorites = await db
  .select({
    id: projects.id,
    slug: projects.slug,
    title: projects.title,
    deleted_at: projects.deleted_at,  // Include deletion status
    owner_user_id: projects.user_id,  // For owner profile link
    // ...
  })
  .from(favorites)
  .innerJoin(projects, eq(projects.id, favorites.project_id))
  // No WHERE clause filtering deleted_at - shows all
```

### Visual Design

**Dashboard FavoriteCard** (`/src/app/(administrator)/dashboard/page.tsx`):

```typescript
if (isDeleted) {
  return (
    <Card className="opacity-70 bg-muted/30 border-dashed border-red-300 pointer-events-none">
      <Badge>🪦 In Graveyard</Badge>
      <Button className="pointer-events-auto">Unfavorite</Button>
      
      <p>This project was sent to the owner's graveyard</p>
      
      <Badge onClick={navigateToOwner} className="pointer-events-auto">
        {owner_username}
      </Badge>
      <span>Browse projects</span>
      
      <Tags className="pointer-events-auto" />
    </Card>
  );
}
```

**Favorites Page ProjectCard** (`/src/components/Projects/ProjectComponents/ProjectCardComponent.tsx`):

```typescript
// Prevent navigation for non-owners
const handleCardClick = (e: React.MouseEvent) => {
  if (project.deleted_at && !isOwner) return; // Early exit
  router.push(`/projects/${project.slug}`);
};

// Card styling
<Card className={`
  ${project.deleted_at && !isOwner 
    ? 'cursor-not-allowed opacity-70 bg-muted/30 border-dashed border-red-300' 
    : 'cursor-pointer hover:bg-accent/40'
  }
`}>
```

### Interactive Elements

**Disabled for Non-Owners**:
- ❌ Card click (no navigation)
- ❌ "View Details" button (hidden)
- ❌ "Share" button (hidden)
- ❌ "Add to Favorites" button (already favorited, now in graveyard)

**Enabled for Non-Owners**:
- ✅ **Unfavorite button**: Remove from their favorites list
- ✅ **Owner username badge**: Navigate to owner's profile to browse other projects
- ✅ **Tags**: Search for similar projects using the same tags

**Owner Access**:
- ✅ Full access to their soft-deleted project
- ✅ Can navigate, edit, restore, or permanently delete

### Hard-Deleted Projects in Favorites

**Behavior**: CASCADE DELETE removes all favorite records

**Result**:
- Favorite disappears from user's favorites list immediately
- No graveyard card shown
- Clean removal via database constraint

---

## 4. Graveyard Page

### Purpose
A dedicated space for project owners to manage their soft-deleted projects before making final decisions.

### Location
`/src/app/projects/deleted/page.tsx`

### Visual Theme
- Graveyard emoji particles (🪦, ⚰️, 💀, 👻)
- Dark red/gray color scheme
- Skull icon in page banner
- "Digital Graveyard" branding

### Query Logic
```typescript
// Only shows projects where:
// - user_id = current user
// - deleted_at IS NOT NULL
// - Still exists in database (not permanently deleted)
```

### Available Actions

**Per Project**:
1. **Restore** → `restoreProject()` → Sets `deleted_at = null`
2. **Permanently Delete** → `permanentlyDeleteProject()` → Hard delete with cascade
3. **View/Edit** → Owner can access full project details

**Page Features**:
- List of all soft-deleted projects
- Created/deleted date information
- Quick action buttons
- Confirmation modals for permanent actions

---

## 5. Restoration System

### Technical Implementation

**Action**: `restoreProject()`

**Database Change**:
```typescript
{
  deleted_at: null,
  updated_at: new Date()
}
```

**Files Involved**:
- `/src/app/actions/projects.ts` - `restoreProject()`

### What Happens

**Immediate Effects**:
- Project becomes publicly visible again
- Appears in community project listings
- Search results include it
- Favorites show normal (not graveyard) cards

**Preserved Data**:
- All favorites intact
- All tags intact
- All images intact
- All tag submissions intact
- Total favorites count unchanged

### User Experience

**Modal**: Confirms restoration with explanation of consequences

**Post-Restoration**:
- Project redirected to active projects list
- Cache invalidated for fresh display
- Success toast notification

---

## 6. Permission System

### Access Levels

| User Type | Soft-Deleted Access | Hard Delete | Restore |
|-----------|-------------------|-------------|---------|
| **Owner** | ✅ Full (graveyard page) | ✅ Yes | ✅ Yes |
| **Admin** | ✅ View only | ❌ No | ❌ No |
| **Public** | ❌ 404 error | ❌ No | ❌ No |
| **Favoriter** | ⚠️ Graveyard card only | ❌ No | ❌ No |

### Permission Checks

**Ownership Verification**:
```typescript
async function isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const project = await getProjectById(projectId);
  return project?.user_id === userId;
}
```

**Used In**:
- `removeProject()` - Soft delete
- `permanentlyDeleteProject()` - Hard delete
- `restoreProject()` - Restoration
- `updateProject()` - Editing

**Admin Check**:
```typescript
import { isAdmin } from '@/lib/admin-utils';

const isAdminUser = isAdmin(viewerEmail);
```

---

## 7. Database Schema

### Projects Table
```typescript
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("web"),
  total_favorites: numeric("total_favorites").notNull().default("0"),
  url_links: jsonb("url_links").$type<ProjectLink[]>(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // Soft delete timestamp
});
```

### Foreign Key Constraints

**Favorites**:
```typescript
export const favorites = pgTable("favorites", {
  profile_id: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" }),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" }),
});
```

**Project Tags**:
```typescript
export const project_tags = pgTable("project_tags", {
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: 'cascade' }),
  tag_id: uuid("tag_id")
    .references(() => tags.id, { onDelete: 'cascade' }),
});
```

**Tag Submissions**:
```typescript
export const tag_submissions = pgTable("tag_submissions", {
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "set null" }),
  tag_name: text("tag_name").notNull(),
  submitter_email: text("submitter_email").notNull(),
  // Snapshot data preserved:
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  admin_notes: text("admin_notes"),
});
```

**Project Images**:
```typescript
export const project_images = pgTable("project_images", {
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" }),
  storage_path: text("storage_path").notNull(),
  storage_url: text("storage_url").notNull(),
  deleted_at: timestamp("deleted_at"), // Images can also be soft-deleted
});
```

---

## 8. Known Issues & Maintenance

### Duplicate Foreign Key Constraint

**Issue**: The `tag_submissions` table has duplicate foreign key constraints:

```sql
-- Constraint 1: CASCADE (incorrect, from old migration)
tag_submissions_project_id_fkey → DELETE CASCADE

-- Constraint 2: SET NULL (correct, from current schema)
tag_submissions_project_id_projects_id_fk → DELETE SET NULL
```

**Impact**: 
- Unpredictable behavior (PostgreSQL uses whichever was created last)
- Could delete tag submissions on hard delete instead of setting NULL
- UI code expects `project_id = NULL` behavior

**Resolution**:
```sql
-- Run this to clean up
ALTER TABLE tag_submissions 
  DROP CONSTRAINT IF EXISTS tag_submissions_project_id_fkey;

-- Verify only SET NULL constraint remains
SELECT constraint_name, delete_rule
FROM information_schema.referential_constraints rc
JOIN information_schema.table_constraints tc 
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tag_submissions'
  AND tc.constraint_type = 'FOREIGN KEY';
```

**Status**: Awaiting database cleanup

---

## 9. UI Components

### Modal Components

**Delete Confirmation** (`DeleteConfirmationModal.tsx`):
- Soft delete warning
- "Send to Graveyard" action
- Explains project will be hidden but recoverable

**Permanent Delete Confirmation** (`PermanentDeleteConfirmationModal.tsx`):
- Red-themed destructive warning
- Lists consequences of permanent deletion
- Requires explicit confirmation

**Restore Confirmation** (Inline in `ProjectCardComponent.tsx`):
- Confirms restoration action
- Explains project will become public again

### Card Components

**FavoriteCard** (`dashboard/page.tsx`):
- Dashboard-specific favorite display
- Graveyard styling for deleted projects
- Owner badge with "Browse projects" helper text

**ProjectCard** (`ProjectCardComponent.tsx`):
- Reusable project card for lists and favorites page
- Graveyard styling and interaction limits
- Badge-style owner name with responsive overflow handling

**TagSubmissionCard** (`dashboard/page.tsx`):
- Shows tag submission status
- Handles soft-deleted projects (🪦 In Graveyard)
- Handles hard-deleted projects (⚰️ Project Deleted)
- Displays snapshot data when project is gone

---

## 10. Data Integrity Matrix

| Scenario | Favorites | Project Tags | Tag Submissions | Images |
|----------|-----------|--------------|-----------------|--------|
| **Soft Delete** | Preserved (graveyard UX) | Preserved | Preserved | Preserved |
| **Hard Delete** | CASCADE deleted | CASCADE deleted | SET NULL (preserved) | CASCADE deleted |
| **Restoration** | Intact, normal UX | Intact | Intact | Intact |

---

## 11. User Workflows

### Deleting a Project

1. User clicks delete on their project
2. **DeleteConfirmationModal** appears
3. User confirms → Project soft-deleted
4. Project moves to graveyard page
5. Public sees 404, favoriters see graveyard card
6. User can restore or permanently delete later

### Managing Deleted Projects

1. User navigates to "Deleted Projects" page
2. Sees all soft-deleted projects
3. Options per project:
   - **Restore**: Returns to public
   - **Permanently Delete**: Requires second confirmation
   - **View**: Full access to project details

### Favoriter Experience

1. User favorited someone else's project
2. Owner soft-deletes the project
3. User sees graveyard card in their favorites:
   - Cannot click to view project
   - Can unfavorite to remove from list
   - Can click owner name to browse their other projects
   - Can click tags to find similar projects
4. If owner permanently deletes:
   - Favorite disappears from user's list automatically

---

## 12. Cache Strategy

### Tags Invalidated on Deletion

All deletion operations (soft and hard) invalidate:

```typescript
revalidateTag('projects');           // All project listings
revalidateTag('user-projects');      // User-specific project lists
revalidateTag('user-own-projects');  // Owner's project management
revalidateTag('project-detail');     // Individual project pages
```

### Path Revalidation

```typescript
revalidatePath('/projects');           // Public project browse
revalidatePath('/projects/deleted');   // Graveyard page
revalidatePath('/projects/favorites'); // Favorites page
revalidatePath('/dashboard');          // User dashboard
```

---

## 13. Testing Considerations

### Soft Delete Testing

- [ ] Owner can view soft-deleted project
- [ ] Admin can view soft-deleted project
- [ ] Public gets 404 on soft-deleted project
- [ ] Favoriter sees graveyard card
- [ ] Favoriter cannot navigate to project
- [ ] Unfavorite button works on graveyard cards
- [ ] Owner name and tags are clickable on graveyard cards

### Hard Delete Testing

- [ ] Project must be soft-deleted first
- [ ] All favorites CASCADE delete
- [ ] All project_tags CASCADE delete
- [ ] All images CASCADE delete
- [ ] Tag submissions SET NULL (project_id becomes NULL)
- [ ] Tag submission snapshot data preserved
- [ ] UI shows "⚰️ Project Deleted" for orphaned submissions
- [ ] Owner cannot access project after permanent deletion
- [ ] Graveyard card disappears from favoriters' lists

### Restoration Testing

- [ ] Soft-deleted project can be restored
- [ ] Restored project appears in public listings
- [ ] All data intact after restoration
- [ ] Graveyard cards become normal cards after restoration
- [ ] Cache properly invalidated

---

## 14. Files Reference

### Core Deletion Logic
- `/src/app/actions/projects.ts` - Server actions for all deletion operations
- `/src/db/actions.ts` - Database operations (soft delete implementation)
- `/src/services/projectService.ts` - Service layer wrappers

### UI Components
- `/src/components/Projects/ProjectComponents/DeleteConfirmationModal.tsx`
- `/src/components/Projects/ProjectComponents/PermanentDeleteConfirmationModal.tsx`
- `/src/components/Projects/ProjectComponents/ProjectCardComponent.tsx`
- `/src/app/(administrator)/dashboard/page.tsx` - FavoriteCard & TagSubmissionCard

### Pages
- `/src/app/projects/deleted/page.tsx` - Graveyard page
- `/src/app/projects/favorites/page.tsx` - Favorites list
- `/src/app/(administrator)/dashboard/page.tsx` - User dashboard

### Database Schema
- `/src/db/schema/projects.ts` - Projects table with deleted_at
- `/src/db/schema/favorites.ts` - CASCADE on delete
- `/src/db/schema/project_tags.ts` - CASCADE on delete
- `/src/db/schema/tag_submissions.ts` - SET NULL on delete
- `/src/db/schema/project_images.ts` - CASCADE on delete

### Operations
- `/src/db/operations/userDashboardOperations.ts` - Favorites query including deleted projects
- `/src/db/operations/project-image-operations.ts` - Image soft/hard delete operations

---

## Summary

The two-stage deletion system provides:

✅ **Safety**: Accidental deletions can be recovered  
✅ **Transparency**: Users see what they favorited even if deleted  
✅ **History**: Tag submission contributions preserved  
✅ **Privacy**: Soft-deleted projects hidden from public  
✅ **Control**: Owners have full management capabilities  
✅ **Cleanup**: Permanent deletion removes all related CASCADE data  
✅ **Integrity**: SET NULL preserves important user contribution records  

The system balances user experience, data integrity, and platform cleanliness effectively.
