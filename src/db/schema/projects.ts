import { pgTable, text, varchar, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
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
  total_favorites: numeric("total_favorites").notNull().default("0"), // Track total favorites for popularity sorting
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
  owner_id?: string;
  owner_user_id?: string;
  owner_username?: string;
  owner_full_name?: string;
  owner_profile_image_url?: string;
  owner_tier?: string;
  owner_email_address?: string;
  owner_created_at?: Date;
  owner_updated_at?: Date;
};
