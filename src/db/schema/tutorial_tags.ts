// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/tutorial_tags.ts
import { pgTable, uuid, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { tutorials } from "./tutorials";
import { tags } from "./tags";

export const tutorial_tags = pgTable("tutorial_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  tutorial_id: uuid("tutorial_id")
    .notNull()
    .references(() => tutorials.id, { onDelete: "cascade" }),
  tag_id: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Adding a unique constraint to prevent duplicate tutorial-tag associations
    unq_tutorial_tag: foreignKey({
      columns: [table.tutorial_id, table.tag_id],
      foreignColumns: [tutorials.id, tags.id],
    }).onDelete("cascade"),
  };
});

// Export types for better type safety when working with tutorial tags
export type InsertTutorialTag = typeof tutorial_tags.$inferInsert;
export type SelectTutorialTag = typeof tutorial_tags.$inferSelect;