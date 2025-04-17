// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/page_tags.ts
import { pgTable, uuid, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { tags } from "./tags";

export const page_tags = pgTable("page_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  page_id: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  tag_id: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Adding a unique constraint to prevent duplicate page-tag associations
    unq_page_tag: foreignKey({
      columns: [table.page_id, table.tag_id],
      foreignColumns: [pages.id, tags.id],
    }).onDelete("cascade"),
  };
});

// Export types for better type safety when working with page tags
export type InsertPageTag = typeof page_tags.$inferInsert;
export type SelectPageTag = typeof page_tags.$inferSelect;