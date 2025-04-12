import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  tags: text("tags").array(),
  tier: varchar("tier", { length: 50 }).notNull().default("free"),
  difficulty: varchar("difficulty", { length: 50 })
    .notNull()
    .default("beginner"),
  created_at: timestamp("created_at").defaultNow(),
});

// Export types for better type safety when working with projects
export type InsertProject = typeof projects.$inferInsert;
export type SelectProject = typeof projects.$inferSelect;
