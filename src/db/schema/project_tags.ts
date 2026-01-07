// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/project_tags.ts
import { pgTable, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { tags } from "./tags";

export const project_tags = pgTable("project_tags", {
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tag_id: uuid("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Composite unique index to prevent duplicate tag assignments
  projectTagIdx: uniqueIndex("project_tag_unique_idx").on(table.project_id, table.tag_id),
  // Index for efficient tag lookups by project
  projectIdx: index("project_tags_project_idx").on(table.project_id),
  // Index for efficient project lookups by tag
  tagIdx: index("project_tags_tag_idx").on(table.tag_id),
}));

// Export types for better type safety when working with project tags
export type InsertProjectTag = typeof project_tags.$inferInsert;
export type SelectProjectTag = typeof project_tags.$inferSelect;