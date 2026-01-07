// Export all schemas from this index file
// 📁 Location: src/db/schema/index.ts
//
// ✅ MVP Core Tables (Active) - These are included in migrations
export * from "./projects";
export * from "./profiles";
export * from "./favorites";
export * from "./tags";
export * from "./project_tags";
export * from "./tag_submissions";
export * from "./project_images";
export * from "./username-history";

// ❌ Future Features - Schemas moved to src/db/schemas-future/
// These are NOT included in the current migration.
// To activate:
// 1. Move schema file back from src/db/schemas-future/ to src/db/schema/
// 2. Uncomment export below
// 3. Run: npx drizzle-kit generate
// 4. Apply migration: npx drizzle-kit push or npx drizzle-kit migrate
//
// Available schemas in schemas-future/:
// - likes.ts (like/dislike projects)
// - tutorials.ts (educational content)
// - tutorial_tags.ts (tutorials ↔ tags)
// - snippets.ts (code snippets)
// - snippet_tags.ts (snippets ↔ tags)
// - pages.ts (project documentation)
// - page_tags.ts (pages ↔ tags)
