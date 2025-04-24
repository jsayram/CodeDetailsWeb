// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/tags.ts
import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex("tags_name_idx").on(table.name),
}));

// Export types for better type safety when working with tags
export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;