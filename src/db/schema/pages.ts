// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/pages.ts
import { pgTable, text, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"), // User who created the page
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"), // The page content (could be markdown or HTML)
  is_published: boolean("is_published").default(false),
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  seo_title: text("seo_title"),
  seo_description: text("seo_description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  published_at: timestamp("published_at"), // When the page was published
  deleted_at: timestamp("deleted_at"), // For soft delete
});

// Export types for better type safety when working with pages
export type InsertPage = typeof pages.$inferInsert;
export type SelectPage = typeof pages.$inferSelect;