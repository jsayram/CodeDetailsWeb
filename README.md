# 🚀 CodeDetailsWeb

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

**A modern full-stack web application for managing, categorizing, and documenting code projects with AI-powered GitHub repository analysis.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [API Reference](#-api-design)

</div>

---

> ⚠️ **Work in Progress**: This project is actively under development. Features and documentation are continuously being improved.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Skills Demonstrated](#-skills-demonstrated)
- [Project Architecture](#-project-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [GitHub Scrapper Module](#-github-scrapper-module)
- [API Design](#-api-design)
- [Security & Safety](#-security--safety)
- [Logging & Monitoring](#-logging--monitoring)
- [Testing](#-testing)
- [Project Structure](#-project-structure)

---

## ✨ Features

### Core Functionality
- **📂 Project Management** - Create, organize, and manage code projects with rich metadata
- **🏷️ Dynamic Tagging System** - Flexible tagging with tag submissions and moderation
- **📁 Category Organization** - 19+ project categories (Web, Mobile, AI/ML, DevOps, etc.)
- **⭐ Favorites System** - Track and organize favorite projects
- **👤 User Profiles** - Comprehensive user management with Clerk authentication
- **🔍 Advanced Search** - Filter by category, tags, user, and more

### GitHub Scrapper & Documentation Generator
- **🕷️ Repository Crawler** - Crawl any public/private GitHub repository
- **🤖 AI-Powered Documentation** - Generate architecture documentation using multiple LLM providers:
  - OpenAI (GPT-4o, GPT-4o-mini)
  - Anthropic (Claude)
  - Google (Gemini)
- **📖 Chapter-Based Documentation** - Auto-generated tutorials organized by abstraction layers
- **💾 Smart Caching** - Pluggable storage adapters with change detection

### User Experience
- **🌓 Dark/Light Theme** - System-aware theme switching
- **📱 Responsive Design** - Mobile-first approach with adaptive layouts
- **🎨 Modern UI Components** - Built with shadcn/ui and Radix primitives
- **✨ Smooth Animations** - Framer Motion powered interactions

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router & Turbopack |
| **React 19** | UI library with latest features |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Accessible component library |
| **Radix UI** | Headless UI primitives |
| **Framer Motion** | Animation library |
| **Lucide React** | Icon library |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Auth + Storage |
| **Drizzle ORM** | Type-safe SQL query builder |
| **PostgreSQL** | Primary database |
| **Server Actions** | Next.js server-side mutations |

### Authentication & Security
| Technology | Purpose |
|------------|---------|
| **Clerk** | Authentication provider |
| **Supabase RLS** | Row Level Security policies |
| **JWT Tokens** | Secure API authentication |
| **Webhook Verification** | Svix-powered webhook security |

### AI & LLM Integration
| Technology | Purpose |
|------------|---------|
| **OpenAI SDK** | GPT model integration |
| **Anthropic SDK** | Claude model integration |
| **Google Generative AI** | Gemini model integration |
| **PocketFlow** | LLM pipeline orchestration |

### Development & Tooling
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **Drizzle Kit** | Database migrations |
| **cross-env** | Cross-platform env variables |
| **ts-node** | TypeScript execution |

---

## 🎯 Skills Demonstrated

This project showcases proficiency in:

### Full-Stack Development
- ✅ Modern React patterns (hooks, context, server components)
- ✅ Next.js App Router architecture
- ✅ RESTful API design with RFC 7807 error handling
- ✅ Database design and ORM usage
- ✅ Type-safe full-stack development

### Architecture & Design Patterns
- ✅ **Repository Pattern** - Abstracted database operations
- ✅ **Factory Pattern** - Error creation utilities
- ✅ **Singleton Pattern** - Database connection management
- ✅ **Provider Pattern** - Context-based state management
- ✅ **Adapter Pattern** - Pluggable storage backends

### DevOps & Infrastructure
- ✅ Docker containerization (Supabase local dev)
- ✅ Environment management (dev/test/prod)
- ✅ Database migrations with Drizzle
- ✅ Graceful shutdown handling

### Security Best Practices
- ✅ Input validation with Zod
- ✅ Profanity filtering
- ✅ Rate limiting awareness
- ✅ Secure token handling
- ✅ Row Level Security (RLS)

---

## 🏗 Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   React     │  │   SWR       │  │   Clerk     │  │   Theme     │ │
│  │   Components│  │   Caching   │  │   Auth UI   │  │   Provider  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js App Router                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Server Actions │  │   API Routes    │  │   Server Components │  │
│  │  (Mutations)    │  │   (REST API)    │  │   (Data Fetching)   │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
└───────────┼────────────────────┼─────────────────────┼──────────────┘
            │                    │                     │
            ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Database  │  │   Cache     │  │   LLM       │  │   Validation│ │
│  │   Operations│  │   Manager   │  │   Services  │  │   (Zod)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │
│  │   Drizzle ORM           │  │   External APIs                 │   │
│  │   ├── Migrations        │  │   ├── GitHub API                │   │
│  │   ├── Schema            │  │   ├── OpenAI API                │   │
│  │   └── Queries           │  │   ├── Anthropic API             │   │
│  └───────────┬─────────────┘  │   └── Google AI API             │   │
│              │                └─────────────────────────────────┘   │
└──────────────┼──────────────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase (Docker Container)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │   Auth      │  │   Storage   │  │   Realtime  │ │
│  │  (port 54322)│  │(Clerk JWT) │  │   (Files)   │  │  (Disabled) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

The application uses a PostgreSQL database with the following core tables:

### Current Tables (MVP)

| Table | Description |
|-------|-------------|
| `projects` | Main projects table with category, links, and metadata |
| `profiles` | User profiles synced from Clerk |
| `tags` | Reusable tags for categorization |
| `project_tags` | Many-to-many project ↔ tags relationship |
| `favorites` | User favorites tracking |
| `tag_submissions` | User-submitted tags pending approval |
| `project_images` | Project screenshot/image storage |
| `username_history` | Username change audit trail |

### Projects Table Schema

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,                           -- Clerk user ID
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'web',
  total_favorites BIGINT DEFAULT 0,
  url_links JSONB,                        -- Array of project links
  category_data JSONB,                    -- Category-specific fields
  field_order JSONB,                      -- Display order for fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMP                    -- Soft delete
);
```

### Future Tables (Planned)

| Table | Description |
|-------|-------------|
| `tutorials` | Educational content |
| `snippets` | Code snippet library |
| `pages` | Project documentation pages |
| `content_tags` | Polymorphic content tagging |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Docker Desktop** (for local Supabase)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jsayram/CodeDetailsWeb.git
   cd CodeDetailsWeb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.development
   
   # Edit with your credentials
   nano .env.development
   ```

4. **Start Docker Desktop**
   
   Ensure Docker Desktop is running before proceeding.

5. **Start Supabase locally**
   ```bash
   # Start all Supabase services
   npx supabase start
   ```

   This will start:
   - **PostgreSQL** on port `54322`
   - **Supabase Studio** on port `54323`
   - **API Gateway** on port `54321`

6. **Run database migrations**
   ```bash
   npm run db:push
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:migrate` | Run pending migrations |

---

## ⚙️ Environment Configuration

The project uses a multi-environment setup with automatic validation.

### Environment Files

```
.env.development    # Local development
.env.test          # Testing environment
.env.production    # Production environment
.env.local         # Local overrides (gitignored)
```

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Optional: LLM API Keys (for GitHub Scrapper)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
GITHUB_TOKEN=ghp_...
```

### Environment Validation

The app automatically validates environment variables on startup:

```typescript
// scripts/validateEnv.ts
const requiredEnvVars = [
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  // ... more
];
```

---

## 🕷️ GitHub Scrapper Module

The `repoScrapper` module is a portable, self-contained library for crawling GitHub repositories and generating AI-powered documentation.

### Features

- **GitHub API Integration** - Direct API access with token support
- **Pattern Matching** - Include/exclude files with glob patterns
- **Smart Caching** - Content-hash based change detection
- **Multiple LLM Providers** - OpenAI, Anthropic, Google
- **RFC 7807 Errors** - Standard error handling

### Module Structure

```
src/repoScrapper/
├── index.ts              # Module exports
├── crawler.ts            # Client-side crawler
├── server-crawler.ts     # Server-side crawler
├── patterns.ts           # File pattern definitions
├── errors.ts             # RFC 7807 error classes
├── types.ts              # TypeScript definitions
├── nodes.ts              # PocketFlow node definitions
├── flow.ts               # Documentation generation flow
├── cache/
│   ├── index.ts          # Cache exports
│   ├── manager.ts        # Cache operations
│   └── adapters.ts       # Storage adapters
└── generator/
    └── ...               # Doc generation utilities
```

### Usage Example

```typescript
import { 
  githubFileCrawler, 
  getDefaultPatterns,
  LocalStorageAdapter,
  saveRepoCache,
} from '@/repoScrapper';

// Get default patterns
const { includePatterns, excludePatterns } = getDefaultPatterns();

// Crawl a repository
const result = await githubFileCrawler({
  repoUrl: 'https://github.com/owner/repo',
  token: process.env.GITHUB_TOKEN,
  includePatterns,
  excludePatterns,
  maxFileSize: 500 * 1024,
});

console.log(`Downloaded ${result.stats.downloaded_count} files`);
```

### Documentation Generation Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  FetchRepo  │───▶│  Identify   │───▶│  Analyze    │───▶│  Generate   │
│  (Crawl)    │    │ Abstractions│    │ Relationships│    │  Chapters   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                  │                  │
                          ▼                  ▼                  ▼
                   ┌─────────────────────────────────────────────────┐
                   │              LLM Provider (GPT-4o, Claude)       │
                   └─────────────────────────────────────────────────┘
```

---

## 🔌 API Design

### RESTful Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List projects with filters |
| `/api/projects` | POST | Create new project |
| `/api/projects/[slug]` | GET | Get project by slug |
| `/api/projects/[slug]` | PUT | Update project |
| `/api/projects/[slug]` | DELETE | Soft delete project |
| `/api/categories/counts` | GET | Get project counts by category |
| `/api/profiles` | GET | List user profiles |
| `/api/profiles/[username]` | GET | Get profile by username |
| `/api/docs/[slug]` | GET | Get generated documentation |
| `/api/generate-docs` | POST | Generate new documentation |
| `/api/repo/crawl` | POST | Crawl GitHub repository |

### RFC 7807 Error Response

All API errors follow the RFC 7807 "Problem Details" standard:

```json
{
  "type": "https://api.codedetails.dev/problems/not-found",
  "title": "Project Not Found",
  "status": 404,
  "detail": "The project with slug 'my-project' was not found",
  "instance": "/api/projects/my-project",
  "hint": "Check if the project exists or if the slug is spelled correctly",
  "requestId": "req_abc123",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Authentication (401)
  UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED,
  
  // Authorization (403)
  FORBIDDEN, INSUFFICIENT_PERMISSIONS, NOT_OWNER,
  
  // Not Found (404)
  PROFILE_NOT_FOUND, PROJECT_NOT_FOUND, USER_NOT_FOUND,
  
  // Validation (400)
  VALIDATION_ERROR, PROFANITY_DETECTED,
  
  // Conflict (409)
  DUPLICATE_ENTRY, SLUG_TAKEN,
  
  // Server (500)
  INTERNAL_SERVER_ERROR, DATABASE_ERROR
}
```

---

## 🔒 Security & Safety

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Clerk   │────▶│  Next.js │────▶│ Supabase │
│          │◀────│  Auth    │◀────│  Server  │◀────│    DB    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │   JWT Token  │
              │  (Supabase   │
              │   Custom)    │
              └──────────────┘
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Clerk with Supabase JWT integration |
| **Authorization** | Row Level Security (RLS) policies |
| **Input Validation** | Zod schema validation on all endpoints |
| **Profanity Filter** | Custom word list filtering |
| **Rate Limiting** | GitHub API rate limit awareness |
| **Webhook Security** | Svix signature verification |
| **CSRF Protection** | Next.js built-in protection |
| **SQL Injection** | Prevented via Drizzle ORM |

### Profanity Filtering

```typescript
// src/constants/profanity-list.ts
export const PROFANITY_LIST = [
  // Curated list of blocked words
];

// Validation in actions
if (containsProfanity(input)) {
  throw new ValidationError("PROFANITY_DETECTED");
}
```

---

## 📊 Logging & Monitoring

### Server-Side Logging

```typescript
// Structured logging with context
console.log('[FetchRepo] Crawling repository:', repoUrl);
console.log('[API] Request received:', { method, path, userId });
console.error('[Database Error]', error);
```

### Database Connection Logging

```typescript
// Graceful shutdown logging
console.log("🔄 Gracefully shutting down database connections...");
console.log("✅ Database connections closed successfully");
```

### Environment Logging

```typescript
// Startup validation
console.log("🚀 Loading environment for:", process.env.NODE_ENV);
console.log("✅ Using environment configuration from:", envFile);
console.log("✅ All required environment variables are set");
```

### API Request Logging

```typescript
// Project search logging
console.log('🔍 API Request - Projects:');
console.log('   - Category:', category);
console.log('   - User:', userId);
console.log('   - Sort By:', sortBy);
console.log('   - Page:', page);
```

---

## 🧪 Testing

### Test Setup

```bash
# Run all tests
npm run test

# Run Jest unit tests
npx jest

# Run Playwright E2E tests
npx playwright test
```

### Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| Unit Tests | Jest | Components, utilities |
| Integration | Jest | API routes, actions |
| E2E Tests | Playwright | User flows |

---

## 📁 Project Structure

```
CodeDetailsWeb/
├── 📄 package.json              # Dependencies & scripts
├── 📄 next.config.ts            # Next.js configuration
├── 📄 drizzle.config.ts         # Drizzle ORM config
├── 📄 tailwind.config.mts       # Tailwind CSS config
├── 📄 tsconfig.json             # TypeScript config
│
├── 📁 docs/                     # Project documentation
│   ├── CACHING_STRATEGY.md
│   ├── FILTERING_AND_SORTING.md
│   ├── PROJECT_DELETION_SYSTEM.md
│   ├── SEARCH_ARCHITECTURE.md
│   ├── SHARING_FEATURES.md
│   └── SUPABASE_SETUP.md
│
├── 📁 scripts/                  # Build & utility scripts
│   ├── setEnv.ts                # Environment setup
│   └── validateEnv.ts           # Env validation
│
├── 📁 supabase/                 # Supabase configuration
│   ├── config.toml              # Local dev config
│   └── migrations/              # SQL migrations
│
├── 📁 public/                   # Static assets
│   └── images/
│
└── 📁 src/                      # Source code
    ├── 📁 app/                  # Next.js App Router
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Home page
    │   ├── 📁 (sidebar-footer)/ # Layout group
    │   │   ├── github-scrapper/
    │   │   ├── about/
    │   │   └── community/
    │   ├── 📁 (administrator)/  # Admin layout group
    │   │   ├── dashboard/
    │   │   └── scrapper-demo/
    │   ├── 📁 api/              # API routes
    │   │   ├── projects/
    │   │   ├── profiles/
    │   │   ├── generate-docs/
    │   │   └── repo/
    │   └── 📁 actions/          # Server actions
    │
    ├── 📁 components/           # React components
    │   ├── 📁 ui/               # shadcn/ui components
    │   ├── 📁 Projects/         # Project components
    │   ├── 📁 sidebar/          # Navigation sidebar
    │   ├── 📁 layout/           # Layout components
    │   └── 📁 llm/              # LLM provider UI
    │
    ├── 📁 constants/            # Application constants
    │   ├── api-routes.tsx
    │   ├── error-codes.ts
    │   ├── profanity-list.ts
    │   └── project-categories.ts
    │
    ├── 📁 db/                   # Database layer
    │   ├── server.ts            # DB connection
    │   ├── actions.ts           # DB actions
    │   ├── 📁 schema/           # Drizzle schemas
    │   ├── 📁 operations/       # DB operations
    │   └── 📁 migrations/       # Migration files
    │
    ├── 📁 hooks/                # React hooks
    │   ├── use-auth-state.ts
    │   ├── use-projects.ts
    │   ├── use-tags.ts
    │   └── use-theme.ts
    │
    ├── 📁 lib/                  # Utility libraries
    │   ├── api-errors.ts        # Error factories
    │   ├── swr-fetchers.ts      # SWR data fetchers
    │   └── supabase-storage.ts  # Storage utilities
    │
    ├── 📁 providers/            # React context providers
    │   ├── theme-provider.tsx
    │   ├── swr-provider.tsx
    │   └── projects-provider.tsx
    │
    ├── 📁 repoScrapper/         # GitHub scrapper module
    │   ├── index.ts             # Module exports
    │   ├── crawler.ts           # Repository crawler
    │   ├── server-crawler.ts    # Server-side crawler
    │   ├── patterns.ts          # File patterns
    │   ├── errors.ts            # Error handling
    │   ├── 📁 cache/            # Caching system
    │   └── 📁 generator/        # Doc generation
    │
    ├── 📁 services/             # External services
    ├── 📁 styles/               # Global styles
    ├── 📁 types/                # TypeScript types
    └── 📁 utils/                # Utility functions
```

---

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Jose U. Ramirez-Villa**

- GitHub: [@jsayram](https://github.com/jsayram)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Built with ❤️ using Next.js, TypeScript, and Supabase

</div>
