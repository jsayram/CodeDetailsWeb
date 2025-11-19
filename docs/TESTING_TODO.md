# Testing TODO - Complete Coverage Plan

> **Note:** This document outlines comprehensive testing needed for the CodeDetailsWeb application.  
> Created: November 18, 2025  
> Status: Planning Phase  
> Test Frameworks: Jest (Unit), Playwright (E2E), GitHub Actions (CI/CD)

---

## 🎯 Testing Strategy Overview

### Test Types
1. **Unit Tests** - Individual functions/components (Jest + React Testing Library)
2. **Integration Tests** - API routes, database operations (Jest)
3. **E2E Tests** - Full user flows (Playwright)
4. **Visual Regression** - UI consistency (Playwright screenshots)
5. **Performance Tests** - Load times, bundle size
6. **Security Tests** - Auth flows, RLS policies

---

## 📦 1. Authentication & Authorization Tests

### 1.1 Clerk Integration
- [ ] **Unit: Token Generation**
  - `useClerkSupabaseClient` returns valid client with session
  - `useClerkSupabaseClient` returns null without session
  - Token refresh handling
  - Error handling when `getToken()` fails
  - JWT template "supabase" configuration

- [ ] **Integration: Server-side Auth**
  - `createServerSupabaseClient` correctly fetches token
  - Authorization header injection works
  - Service role bypasses RLS for webhooks

- [ ] **E2E: Sign In/Out Flow**
  - User can sign in with email/password
  - User can sign in with OAuth (Google, GitHub)
  - User redirected to dashboard after sign in
  - User can sign out
  - Session persists across page refreshes
  - Protected routes redirect to sign-in

### 1.2 User Profile Sync
- [ ] **Unit: User Sync Utils**
  - `extractClerkUserData` handles all field variations
  - `createOrUpdateUserProfile` creates new users
  - `createOrUpdateUserProfile` updates existing users
  - Tier defaults to 'free' for new users
  - Existing tier preserved on update

- [ ] **Integration: Webhook Handlers**
  - `user.created` webhook creates profile
  - `user.updated` webhook updates profile
  - `user.deleted` webhook soft-deletes profile
  - `session.created` syncs user on first login
  - Duplicate sync prevention (cache)

- [ ] **E2E: User Registration**
  - New user signs up → profile created in DB
  - User updates Clerk profile → Supabase profile syncs
  - User profile displays correct tier badge

### 1.3 Authorization & Tiers
- [ ] **Unit: ProtectedPage Component**
  - `ProtectedPage` allows access with correct tier
  - `ProtectedPage` blocks access with insufficient tier
  - Tier hierarchy respected (diamond > pro > free)
  - Anonymous users redirected to sign-in
  - Upgrade UI shown for tier restrictions

- [ ] **Integration: Tier Service**
  - `useUserTier` fetches tier from API
  - `useUserTier` caches tier in memory
  - `getUserTier` server action queries DB correctly
  - Tier changes reflected immediately

- [ ] **E2E: Tier-Based Access**
  - Free user blocked from pro features
  - Pro user can access pro features
  - Upgrade prompt shown correctly
  - Tier badge displays on profile

---

## 🗂️ 2. Projects Feature Tests

### 2.1 Project CRUD Operations
- [ ] **Unit: Project Actions**
  - `createProject` validates required fields
  - `updateProject` only updates allowed fields
  - `deleteProject` soft-deletes (sets deleted_at)
  - `getProject` returns project with owner data
  - `getProjectBySlug` handles URL encoding

- [ ] **Integration: Project API Routes**
  - `POST /api/projects` creates project with auth
  - `GET /api/projects` returns paginated projects
  - `GET /api/projects?category=web` filters by category
  - `GET /api/projects?tags=react,nextjs` filters by tags
  - `GET /api/projects?username=johndoe` filters by user
  - `GET /api/projects?showFavorites=true` requires auth
  - Sorting works (newest, oldest, popular)

- [ ] **E2E: Project Management**
  - User can create new project
  - User can edit their own project
  - User cannot edit others' projects
  - User can delete their own project
  - Deleted project moves to deleted page
  - Project slug auto-generated from title
  - Project thumbnail uploads correctly

### 2.2 Favorites System
- [ ] **Unit: Favorite Actions**
  - `addProjectFavorite` increments total_favorites
  - `removeProjectFavorite` decrements total_favorites
  - Cannot favorite same project twice
  - total_favorites never goes below 0

- [ ] **Integration: Favorites API**
  - `POST /api/projects/{id}/favorite` requires auth
  - Favoriting updates database atomically
  - Unfavoriting removes from favorites page
  - User's favorites list accurate

- [ ] **E2E: Favorites Flow**
  - User can favorite a project (heart icon)
  - Heart icon shows filled state
  - Project appears on favorites page
  - User can unfavorite from card
  - User can unfavorite from favorites page
  - Confirmation modal appears
  - Favorite count updates in real-time

### 2.3 Project Categories
- [ ] **Unit: Category Constants**
  - All categories have label, description, keywords
  - Category type matches constants
  - Category slugs are URL-safe

- [ ] **Integration: Category Filtering**
  - Projects filter by category correctly
  - Category page shows only that category
  - Empty category shows "no projects" message

- [ ] **E2E: Category Navigation**
  - User can browse categories page
  - Clicking category filters projects
  - Category badge shows on project cards
  - Category icons render correctly

### 2.4 Project Tags
- [ ] **Unit: Tag Operations**
  - `createTag` creates new tag
  - `getProjectTags` returns all project tags
  - Tag suggestions work
  - Duplicate tags prevented

- [ ] **Integration: Tag Submissions**
  - Users can submit tag suggestions
  - Admin can approve/reject tags
  - Approved tags appear in autocomplete
  - Tag filtering works

- [ ] **E2E: Tagging Flow**
  - User can add tags to project
  - Tag autocomplete suggests existing tags
  - New tag shows "pending" status
  - Admin sees tag submission queue
  - Approved tag immediately available

---

## 👥 3. User Profile & Dashboard Tests

### 3.1 User Profile Display
- [ ] **Unit: Profile Components**
  - Profile avatar renders with fallback
  - Username displays correctly
  - Tier badge shows correct color/icon
  - Stats calculate correctly

- [ ] **Integration: Profile API**
  - `GET /api/profiles/{username}` returns profile
  - `GET /api/profiles/{username}/stats` returns stats
  - Profile not found returns 404
  - Private profiles respect privacy

- [ ] **E2E: Profile Viewing**
  - User can view their own profile
  - User can view others' profiles
  - Profile shows correct project count
  - Profile shows total favorites received
  - Profile shows most liked project

### 3.2 User Dashboard
- [ ] **Unit: Dashboard Stats**
  - Total projects count correct
  - Total likes aggregates correctly
  - Total tags counts unique tags
  - Most liked project identified
  - **getUserDashboardStats filters by userId correctly**
  - **myProjects query returns only user's projects**
  - **myFavorites query returns only user's favorites**
  - **topTags query returns user-specific tags**
  - **recentActivity query returns user-specific activity**
  - **myTagSubmissions query returns user's submissions**

- [ ] **Integration: Dashboard Data**
  - Dashboard loads user's projects
  - Stats reflect real-time changes
  - Deleted projects excluded from count
  - **Dashboard cache (localStorage) works with 5min TTL**
  - **SWR background refresh updates stale data**
  - **Manual refresh clears cache and refetches**

- [ ] **E2E: Dashboard Interaction**
  - User sees their dashboard on login
  - Quick actions work (new project, etc.)
  - Recent activity shows correctly
  - Metrics update after actions
  - **Dashboard shows only logged-in user's data**
  - **Project cards navigate using slugs not IDs**
  - **My Tag Submissions section scrolls vertically (max-height 400px)**
  - **Stats cards display correct counts**
  - **Recent Projects section shows max 5 projects**

### 3.3 Admin Dashboard
- [ ] **Unit: Admin Dashboard Stats**
  - **getAllProjectsStats returns platform-wide data**
  - **Total projects count correct (all users)**
  - **Active users count correct**
  - **Platform favorites aggregates correctly**
  - **All tags query returns complete tag list**
  - **Recent activity shows latest across all users**
  - **Tag submissions query returns all pending submissions**

- [ ] **Integration: Admin Authorization**
  - **Middleware blocks non-admin users from /dashboard/admin**
  - **Middleware redirects unauthenticated to /sign-in**
  - **Middleware redirects non-admin to /dashboard**
  - **Middleware uses ADMIN_DASHBOARD_MODERATOR env variable**
  - **Server-side email verification via Clerk**
  - **Test pages protected: /api/toasttest, /api/darkmodetest, /api/projects/test**

- [ ] **E2E: Admin Dashboard Access**
  - **Admin user can access /dashboard/admin**
  - **Non-admin user redirected to /dashboard**
  - **Admin sees platform-wide stats (not filtered by userId)**
  - **Projects Overview chart has horizontal scroll**
  - **Chart width scales with project count (40px per project)**
  - **Tag Submissions section has vertical scroll (max-height 500px)**
  - **Admin Test Pages card has 3 buttons to test pages**
  - **Test pages accessible via admin dashboard buttons**
  - **Test pages not shown in sidebar for any user**

---

## 🔍 4. Search & Discovery Tests

### 4.1 Search Functionality
- [ ] **Unit: Search Utils**
  - Search query sanitization
  - Search highlights work
  - Empty search returns all results

- [ ] **Integration: Search API**
  - `GET /api/search?q=react` searches titles
  - Search includes descriptions
  - Search includes tags
  - Search includes usernames
  - Search results paginated

- [ ] **E2E: Search Experience**
  - User can search from navbar
  - Search results display instantly
  - Clicking result navigates to project
  - Search highlights matched terms
  - Empty search shows helpful message

### 4.2 Filtering & Sorting
- [ ] **Unit: Filter Logic**
  - Category filter works
  - Tag filter (multiple tags)
  - User filter (by username)
  - Combined filters work together

- [ ] **Integration: Filter API**
  - Filters apply to queries correctly
  - Multiple filters combine with AND
  - Empty filters show all projects

- [ ] **E2E: Filter UI**
  - Category dropdown works
  - Tag checkboxes filter
  - Sort dropdown changes order
  - Clear filters button resets
  - Filter state persists in URL

---

## 🎨 5. UI/UX Tests

### 5.1 Dark Mode
- [ ] **Unit: Theme Provider**
  - Theme toggles between light/dark
  - Theme persists in localStorage
  - Theme preference respected

- [ ] **E2E: Theme Switching**
  - Toggle button switches theme
  - All components adapt to theme
  - Theme persists across sessions
  - System preference detected

### 5.2 Responsive Design
- [ ] **Visual: Breakpoints**
  - Mobile (320px-767px)
  - Tablet (768px-1023px)
  - Desktop (1024px+)
  - Navigation collapses on mobile
  - Sidebar hides on mobile

- [ ] **E2E: Mobile Experience**
  - Mobile menu works
  - Forms usable on mobile
  - Images scale correctly
  - Touch targets adequate

### 5.3 Loading States
- [ ] **Unit: Loading Components**
  - ProjectListLoadingState renders
  - UserProfileLoadingState renders
  - Skeleton loaders animate

- [ ] **E2E: Loading UX**
  - Loading shown during data fetch
  - Skeletons match content layout
  - Smooth transition to content

### 5.4 Toast Notifications
- [ ] **Unit: Toast System**
  - Success toast shows
  - Error toast shows
  - Warning toast shows
  - Info toast shows
  - Toast duration configurable

- [ ] **E2E: Toast Interactions**
  - Toast appears on action
  - Toast auto-dismisses
  - User can dismiss manually
  - Multiple toasts stack

---

## 🔒 6. Database & RLS Tests

### 6.1 Row-Level Security
- [ ] **Integration: RLS Policies**
  - Users can only read public projects
  - Users can only edit their own projects
  - Users can only delete their own projects
  - Admins bypass RLS with service role
  - Favorites respect user ownership

- [ ] **E2E: Security Enforcement**
  - User A cannot edit User B's project
  - Direct API call blocked by RLS
  - Admin can manage all content

### 6.2 Data Integrity
- [ ] **Unit: Database Actions**
  - Foreign key constraints enforced
  - Cascade deletes work
  - Unique constraints prevent duplicates
  - Timestamps auto-update

- [ ] **Integration: Transaction Safety**
  - Favorite/unfavorite atomic
  - Project deletion cascades tags
  - Profile deletion soft-deletes

---

## 📊 7. Performance Tests

### 7.1 Page Load Performance
- [ ] **Performance: Metrics**
  - Homepage loads < 2s (desktop)
  - Homepage loads < 3s (mobile)
  - Projects page loads < 2s
  - Search results < 1s
  - Lighthouse score > 90

### 7.2 API Response Times
- [ ] **Performance: API Latency**
  - `GET /api/projects` < 500ms
  - `GET /api/profiles/{username}` < 300ms
  - `POST /api/projects` < 800ms
  - Search queries < 400ms

### 7.3 Caching
- [ ] **Unit: Cache Utils**
  - Memory cache stores data
  - Cache hits return immediately
  - Cache invalidation works
  - TTL respected

- [ ] **Integration: Next.js Cache**
  - Static pages cached
  - ISR revalidation works
  - API routes tagged correctly
  - Cache purged on mutations

---

## 🚀 8. Deployment & CI/CD Tests

### 8.1 Build Tests
- [ ] **CI: Build Pipeline**
  - TypeScript compiles without errors
  - ESLint passes (warnings okay)
  - Build succeeds
  - Environment variables validated

### 8.2 Preview Deployments
- [ ] **E2E: Vercel Preview**
  - Preview deploys on PR
  - Preview URL accessible
  - Features work on preview
  - Database migrations run

### 8.3 Production Smoke Tests
- [ ] **E2E: Production**
  - Homepage loads
  - Sign in works
  - Projects load
  - Search works
  - API routes respond

---

## 🛡️ 9. Security Tests

### 9.1 Authentication Security
- [ ] **Security: Auth Flows**
  - JWT tokens validated
  - Expired tokens rejected
  - CSRF protection enabled
  - XSS prevention (input sanitization)

### 9.2 API Security
- [ ] **Security: API Protection**
  - Rate limiting works
  - Authentication required
  - Authorization enforced
  - SQL injection prevented
  - Input validation works

### 9.3 Data Privacy
- [ ] **Security: PII Protection**
  - Passwords never stored
  - Email addresses protected
  - User data encrypted at rest
  - HTTPS enforced

---

## 📱 10. Accessibility Tests

### 10.1 WCAG Compliance
- [ ] **A11y: ARIA Labels**
  - All buttons labeled
  - Form inputs labeled
  - Navigation landmarks
  - Semantic HTML used

### 10.2 Keyboard Navigation
- [ ] **A11y: Keyboard Support**
  - Tab order logical
  - Focus indicators visible
  - Escape closes modals
  - Enter submits forms

### 10.3 Screen Reader Support
- [ ] **A11y: Screen Readers**
  - Images have alt text
  - Icons have aria-labels
  - Loading states announced
  - Errors announced

---

## 🔄 11. Edge Cases & Error Handling

### 11.1 Network Errors
- [ ] **E2E: Offline Handling**
  - Network error shows message
  - Retry mechanism works
  - Offline indicator shown
  - Data queued when offline

### 11.2 Invalid Data
- [ ] **Unit: Validation**
  - Empty form submission prevented
  - Invalid email rejected
  - URL validation works
  - File type validation

### 11.3 Rate Limiting
- [ ] **Integration: Rate Limits**
  - Too many requests returns 429
  - Rate limit message shown
  - Backoff strategy works

---

## 📝 12. Documentation Tests

### 12.1 API Documentation
- [ ] **Docs: API Endpoints**
  - All routes documented
  - Request/response examples
  - Error codes listed
  - Authentication noted

### 12.2 Component Documentation
- [ ] **Docs: Component Props**
  - Props documented with JSDoc
  - Usage examples provided
  - TypeScript types exported

---

## 🎯 Priority Levels

### P0 - Critical (Must have before launch)
- Authentication flows
- Project CRUD operations
- RLS policies
- Security tests
- Production smoke tests

### P1 - High (Should have soon)
- Favorites system
- Search functionality
- User profiles
- Performance tests
- Accessibility basics

### P2 - Medium (Nice to have)
- Tag submissions
- Category filtering
- Dark mode
- Visual regression
- Advanced accessibility

### P3 - Low (Future enhancements)
- Advanced search
- Performance optimization
- Load testing
- Internationalization tests

---

## 🧪 Test Coverage Goals

| Area | Target Coverage | Current | Priority |
|------|----------------|---------|----------|
| **Authentication** | 90% | 0% | P0 |
| **Projects** | 85% | 0% | P0 |
| **API Routes** | 80% | 0% | P0 |
| **Components** | 75% | 0% | P1 |
| **Utilities** | 90% | 0% | P1 |
| **Hooks** | 85% | 0% | P1 |
| **Overall** | 80% | 0% | - |

---

## 🛠️ Test Infrastructure Setup

### Required Packages
```bash
# Unit Testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom

# E2E Testing  
npm install --save-dev @playwright/test

# Code Coverage
npm install --save-dev @jest/types @types/jest

# Mocking
npm install --save-dev msw
```

### Configuration Files Needed
- [ ] `jest.config.js` - Jest configuration
- [ ] `playwright.config.ts` - Playwright configuration
- [ ] `.github/workflows/test.yml` - CI pipeline
- [ ] `tests/setup.ts` - Test environment setup
- [ ] `tests/mocks/` - Mock data directory

---

## 📅 Implementation Timeline

### Phase 1 (Week 1-2): Foundation
- Setup test infrastructure
- Configure Jest & Playwright
- Create mock data helpers
- Write first 10 unit tests

### Phase 2 (Week 3-4): Authentication
- Auth flow tests (E2E)
- User sync tests (Integration)
- Protected routes tests
- Token handling tests

### Phase 3 (Week 5-6): Projects Core
- Project CRUD tests
- Favorites system tests
- API route tests
- Database tests

### Phase 4 (Week 7-8): UI/UX
- Component tests
- Dark mode tests
- Responsive tests
- Accessibility tests

### Phase 5 (Week 9-10): Polish
- Performance tests
- Security tests
- Edge cases
- Documentation

---

## 📊 Success Metrics

- [ ] 80%+ code coverage overall
- [ ] 100% of critical paths tested
- [ ] 0 P0/P1 bugs in production
- [ ] <2s average page load time
- [ ] Lighthouse score >90
- [ ] 100% uptime on Vercel
- [ ] All E2E tests green before deploy

---

## 🔗 Related Documents

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [API Documentation](./API.md) *(to be created)*
- [Component Library](./COMPONENTS.md) *(to be created)*
- [Deployment Guide](./DEPLOYMENT.md) *(to be created)*

---

**Last Updated:** November 18, 2025  
**Maintained By:** Developer
**Review Frequency:** Monthly
