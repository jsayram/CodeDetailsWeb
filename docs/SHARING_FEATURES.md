# Sharing Features - Portfolio & Project Links

> **Overview:** This document explains how users can share their projects publicly, creating a portfolio-style showcase accessible to anyone without requiring authentication.
> 
> **Created:** November 20, 2025  
> **Last Updated:** November 20, 2025

---

## 🎯 Overview

CodeDetailsWeb provides powerful sharing capabilities that allow users to:
- Share individual projects with anyone via direct links
- Share their entire project collection as a public portfolio
- Allow visitors to browse, filter, and sort projects without signing in
- Maintain full control over what's shared (deleted projects are hidden automatically)

---

## 📤 Sharing Capabilities

### 1. Share Individual Project

**How to Share:**
1. Navigate to any of your projects
2. Click the **Share** button (Share2 icon) on the project card
3. The project URL is automatically copied to your clipboard
4. Share the URL with anyone

**Share URL Format:**
```
https://codedetails.com/projects/[project-slug]
```

**Example:**
```
https://codedetails.com/projects/my-awesome-react-app
```

**What Recipients See:**
- Full project details (title, description, category)
- All project tags
- Project creation date
- Total favorites count
- Project owner information (username, profile image, full name)
- Banner prompting them to sign in to explore more projects

**Access Level:**
- ✅ **Public** - Anyone with the link can view
- ✅ **No authentication required**
- ❌ Cannot edit, delete, or favorite (requires sign-in)

---

### 2. Share All Your Projects (Portfolio Link)

**How to Share:**
1. Go to your **My Projects** page
2. Click the **"Copy Share Projects Link"** button
3. Your portfolio URL is automatically copied to your clipboard
4. Share the URL to showcase all your work

**Share URL Format:**
```
https://codedetails.com/shared-projects/[username]
```

**Example:**
```
https://codedetails.com/shared-projects/jsayram
```

**What Recipients See:**
- All your public projects (excluding deleted ones)
- Portfolio banner with your username
- Interactive filtering and sorting controls
- Pagination for large project collections
- All project details, tags, and metadata

**Access Level:**
- ✅ **Public** - Anyone with the link can view
- ✅ **No authentication required**
- ✅ **Browsable** - Visitors can filter and sort
- ❌ Cannot create, edit, or delete projects

---

## 🔍 Browsing & Discovery Features

### Available on Portfolio Page (`/shared-projects/[username]`)

#### **1. Category Filtering**
Visitors can filter projects by category:
- Web Development
- Mobile Development
- Desktop Applications
- AI/ML Projects
- Data Science
- Game Development
- DevOps/Cloud
- Cybersecurity
- Blockchain
- IoT
- Other

**UI Location:** Dropdown selector (top-left of projects grid)

**Behavior:**
- Only shows categories that have projects
- Empty categories are disabled/grayed out
- Selecting a category updates the view immediately

---

#### **2. Sorting Options**
Visitors can sort projects by:
- **Newest First** (default) - Most recent projects appear first
- **Oldest First** - Earliest projects appear first
- **Most Popular** - Projects with highest favorites count first

**UI Location:** Dropdown selector (next to category filter)

**Behavior:**
- Sorting applies to filtered results
- Persists across pagination
- Updates URL query parameters

---

#### **3. Pagination**
- **Projects per page:** 12 (configurable via `PROJECTS_PER_PAGE` constant)
- **Navigation:** Previous/Next buttons + page number indicators
- **URL persistence:** Page number stored in URL (`?page=2`)
- **Auto-scroll:** Returns to top when changing pages

---

## 🔐 Security & Privacy

### What's Public
- ✅ Project titles, descriptions, and categories
- ✅ Project tags (all visible tags)
- ✅ Project creation dates
- ✅ Project favorites count (aggregated number)
- ✅ Project owner username, full name, and profile image
- ✅ Project slugs (SEO-friendly URLs)

### What's Protected
- ❌ **Deleted projects** - Never appear in shared links (filtered by `deleted_at IS NULL`)
- ❌ **Private user data** - Email addresses are NOT exposed in API responses
- ❌ **Edit/Delete capabilities** - Requires authentication + ownership verification
- ❌ **Favoriting** - Requires authentication (guest message shown)
- ❌ **Project creation** - Requires authentication and tier verification

### Authentication Boundaries

**Public Routes (No Auth Required):**
```typescript
/shared-projects/[username]          // Portfolio page
/projects/[slug]                     // Individual project page
/api/shared-projects/[username]      // Portfolio API endpoint
```

**Protected Routes (Auth Required):**
```typescript
/dashboard                           // User dashboard
/dashboard/admin                     // Admin dashboard (admin email only)
/projects/new                        // Create new project
/projects/[slug]/edit                // Edit project (owner only)
/api/projects (POST/PUT/DELETE)      // Modify projects
/users/[username]                    // User profile pages
```

---

## 🎨 User Experience

### For Visitors (Unauthenticated)
1. Click shared link → Lands on portfolio page
2. See professional banner with creator's username
3. Browse all public projects with full filtering/sorting
4. Click any project → View full project details
5. See prompts to sign in for additional features (favoriting, following, etc.)

### For Project Owners
1. One-click sharing from any project card
2. One-click portfolio link generation
3. Automatic clipboard copy with toast confirmation
4. Preview option (ExternalLink icon) to open in new tab
5. Real-time updates (new projects automatically appear in portfolio)

---

## 🚀 Technical Implementation

### Frontend Components

**SharedProjectsGrid Component:**
- Location: `src/components/Projects/SharedProjectsGrid.tsx`
- Features: Category filter, sort controls, pagination, project cards
- State Management: Local state for filters, API calls for data

**ShareProjectsButton Component:**
- Location: `src/components/Projects/ShareProjectsButton.tsx`
- Functionality: Generates portfolio link, copies to clipboard, shows toast

**Project Card Share Button:**
- Location: `src/components/Projects/ProjectComponents/ProjectCardComponent.tsx`
- Functionality: Generates project link, copies to clipboard, shows toast with preview

### Backend API

**Shared Projects Endpoint:**
```typescript
GET /api/shared-projects/[username]
```

**Query Parameters:**
- `page` (number) - Page number for pagination (default: 1)
- `limit` (number) - Projects per page (default: 12)
- `category` (string) - Filter by category (optional)
- `sortBy` (string) - Sort order: "newest" | "oldest" | "popular" (default: "newest")

**Response Format:**
```json
{
  "data": [
    {
      "project": {
        "id": "uuid",
        "title": "Project Title",
        "slug": "project-slug",
        "description": "Project description",
        "category": "web",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "total_favorites": 42
      },
      "profile": {
        "username": "johndoe",
        "profile_image_url": "https://...",
        "full_name": "John Doe"
      },
      "tags": ["react", "typescript", "nextjs"]
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "totalPages": 5
  }
}
```

### Middleware Configuration

**Public Route Matching:**
```typescript
const isPublicRoute = createRouteMatcher([
  "/shared-projects/(.*)",      // Portfolio pages
  "/projects/:slug",             // Individual projects
  "/api/shared-projects/(.*)",  // Portfolio API
]);
```

**Database Query:**
```typescript
// Filters applied:
whereConditions = [
  eq(sql`lower(${profiles.username})`, username),  // Match username
  isNull(projects.deleted_at),                      // Exclude deleted
  eq(projects.category, category)                   // Optional category filter
]
```

---

## 📊 Use Cases

### 1. **Developer Portfolio**
Share your entire project collection with potential employers:
```
https://codedetails.com/shared-projects/your-username
```

### 2. **Project Showcase**
Share a specific project in your resume or LinkedIn:
```
https://codedetails.com/projects/your-awesome-project
```

### 3. **Team Collaboration**
Share project links with non-registered team members for review

### 4. **Social Media**
Post project links on Twitter, Reddit, or dev communities

### 5. **Blog/Website Integration**
Embed portfolio link in your personal website or blog footer

---

## 🔮 Future Enhancements

### Planned Features (Not Yet Implemented)
- [ ] **Text Search** - Search projects by title/description
- [ ] **Tag Filtering** - Filter by specific tags (multi-select)
- [ ] **Custom Portfolio Themes** - User-selectable color schemes
- [ ] **Portfolio Analytics** - Track views, clicks, and engagement
- [ ] **Embed Widgets** - Embeddable portfolio iframe for external sites
- [ ] **Export Portfolio** - PDF/HTML export of project collection
- [ ] **Project Grouping** - Organize projects into custom collections
- [ ] **Featured Projects** - Pin important projects to top of portfolio

### API Enhancements Needed
```typescript
// Future query parameters:
?search=react            // Text search in title/description
?tags=react,typescript   // Filter by multiple tags
?featured=true           // Show only featured projects
?collection=frontend     // Filter by custom collection
```

---

## 💡 Best Practices

### For Sharing
1. ✅ Use descriptive project titles and descriptions
2. ✅ Add relevant tags to improve discoverability
3. ✅ Keep deleted projects cleaned up (they won't show anyway)
4. ✅ Use high-quality project thumbnails (if/when implemented)
5. ✅ Update project details regularly to keep portfolio fresh

### For Recipients
1. ✅ Bookmark portfolio links for later reference
2. ✅ Use category filters to find relevant projects
3. ✅ Sign in to favorite projects you like
4. ✅ Check back periodically for new projects

---

## 🐛 Troubleshooting

### Shared Link Shows "No Projects"
**Cause:** User may have deleted all projects or username is incorrect

**Solution:**
- Verify username spelling (case-insensitive)
- Check if user has any public projects
- Ensure projects haven't all been deleted

### Share Button Doesn't Copy
**Cause:** Browser clipboard permissions or user profile not synced

**Solution:**
- Grant clipboard permissions in browser
- Wait for user profile to sync from Clerk
- Try clicking again after a few seconds

### Category Filter Empty
**Cause:** User has no projects in that category

**Solution:**
- This is expected behavior
- Only categories with projects are enabled
- Try "All Categories" to see all projects

---

## 📝 Related Documentation

- [Dashboard Features](./TESTING_TODO.md#3-user-profile--dashboard-tests) - User and admin dashboards
- [Middleware Configuration](../src/middleware.ts) - Route protection setup
- [API Routes](../src/constants/api-routes.tsx) - All API endpoint definitions
- [Supabase Setup](./SUPABASE_SETUP.md) - Database configuration

---

## 🤝 Contributing

If you'd like to enhance sharing features:
1. Review this documentation for current capabilities
2. Check "Future Enhancements" section for planned features
3. Submit PRs with new filtering/sorting options
4. Add tests for new sharing functionality (see `TESTING_TODO.md`)

---

**Questions or Issues?**
- File a GitHub issue with the `feature: sharing` label
- Check middleware configuration for route access issues
- Review API response in browser DevTools Network tab

---

**Last Updated:** November 20, 2025  
**Maintained By:** Development Team  
**Review Frequency:** As features are added
