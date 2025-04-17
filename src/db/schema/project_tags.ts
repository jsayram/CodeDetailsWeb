// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/project_tags.ts
import { pgTable, uuid, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { tags } from "./tags";

export const project_tags = pgTable("project_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  project_slug: varchar("project_slug", { length: 255 }).notNull(),
  tag_id: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Adding a unique constraint to prevent duplicate project-tag associations
    // using uniqueIndex instead of a foreign key to avoid multiple primary keys
    unq_project_tag: uniqueIndex().on(table.project_id, table.tag_id),
  };
});

// Export types for better type safety when working with project tags
export type InsertProjectTag = typeof project_tags.$inferInsert;
export type SelectProjectTag = typeof project_tags.$inferSelect;