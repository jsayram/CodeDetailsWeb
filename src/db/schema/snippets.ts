// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/snippets.ts
import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

export const snippets = pgTable("snippets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"), // User who created the snippet
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(), // The actual code snippet content
  language: varchar("language", { length: 50 }), // Programming language of the snippet
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // For soft delete
});

// Export types for better type safety when working with snippets
export type InsertSnippet = typeof snippets.$inferInsert;
export type SelectSnippet = typeof snippets.$inferSelect;