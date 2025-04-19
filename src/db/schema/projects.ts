import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { ProjectCategory } from "@/constants/project-categories";

// Define the projects table schema
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"), // User who created the project
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 })
    .notNull()
    .default("web"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // For soft delete functionality
});

// Type definitions that include tags for backwards compatibility
export type InsertProject = typeof projects.$inferInsert & {
  tags?: string[];
};

export type SelectProject = typeof projects.$inferSelect & {
  tags?: string[];
};

//relationship is project to user profile image
export type SelectProjectWithOwner = SelectProject & {
  owner_username?: string;
  owner_email?: string;
  owner_profile_image_url?: string;
};
