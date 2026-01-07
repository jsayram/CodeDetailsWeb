// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/tags.ts
import { pgTable, uuid, text, timestamp, uniqueIndex,customType } from "drizzle-orm/pg-core";

// Define citext custom type which is part of postgres extensions
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: citext("name").notNull().unique(),  // Use citext for case-insensitive unique names, so 'React' and 'react' are considered the same
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex("tags_name_idx").on(table.name),
}));

// Export types for better type safety when working with tags
export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;