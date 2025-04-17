import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

// Define the projects table schema without tier field
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"), // User who created the project
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  difficulty: varchar("difficulty", { length: 50 })
    .notNull()
    .default("beginner"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // For soft delete functionality
});

// Type definitions that include tags for backwards compatibility
export type InsertProject = typeof projects.$inferInsert & { 
  tags?: string[] 
};

export type SelectProject = typeof projects.$inferSelect & { 
  tags?: string[] 
};
