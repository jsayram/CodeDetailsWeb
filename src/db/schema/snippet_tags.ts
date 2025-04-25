// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/snippet_tags.ts
import { pgTable, uuid, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { snippets } from "./snippets";
import { tags } from "./tags";

export const snippet_tags = pgTable("snippet_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  snippet_id: uuid("snippet_id")
    .notNull()
    .references(() => snippets.id, { onDelete: "cascade" }),
  tag_id: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Adding a unique constraint to prevent duplicate snippet-tag associations
    unq_snippet_tag: foreignKey({
      columns: [table.snippet_id, table.tag_id],
      foreignColumns: [snippets.id, tags.id],
    }).onDelete("cascade"),
  };
});

// Export types for better type safety when working with snippet tags
export type InsertSnippetTag = typeof snippet_tags.$inferInsert;
export type SelectSnippetTag = typeof snippet_tags.$inferSelect;