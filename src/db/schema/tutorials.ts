// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/tutorials.ts
import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

export const tutorials = pgTable("tutorials", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"), // User who created the tutorial
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"), // The actual tutorial content (could be markdown or HTML)
  level: varchar("level", { length: 50 }).default("beginner"), // e.g., beginner, intermediate, advanced
  estimated_time: varchar("estimated_time", { length: 50 }), // e.g., "30 minutes", "1 hour"
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  published_at: timestamp("published_at"), // When the tutorial was published
  deleted_at: timestamp("deleted_at"), // For soft delete
});

// Export types for better type safety when working with tutorials
export type InsertTutorial = typeof tutorials.$inferInsert;
export type SelectTutorial = typeof tutorials.$inferSelect;