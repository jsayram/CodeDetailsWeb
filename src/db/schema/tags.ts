// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/tags.ts
import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Export types for better type safety when working with tags
export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;