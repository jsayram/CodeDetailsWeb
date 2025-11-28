import { pgTable, text, varchar, timestamp, uuid, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { ProjectCategory } from "@/constants/project-categories";
import { ProjectLink } from "@/types/project-links";

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
  url_links: jsonb("url_links").$type<ProjectLink[]>(), // Flexible array of project links
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // For soft delete functionality
}, (table) => ({
  userIdIdx: index("projects_user_id_idx").on(table.user_id),
}));

// Type definitions that include tags for backwards compatibility
export type InsertProject = typeof projects.$inferInsert & {
  tags?: string[];
};

export type SelectProject = typeof projects.$inferSelect & {
  tags?: string[];
};

//relationship is project to user profile image
export type SelectProjectWithOwner = SelectProject & {
  owner_id?: string | null;
  owner_user_id?: string | null;
  owner_username?: string | null;
  owner_full_name?: string | null;
  owner_profile_image_url?: string | null;
  owner_tier?: string | null;
  owner_email_address?: string | null;
  owner_created_at?: Date | null;
  owner_updated_at?: Date | null;
};

//user information from gathering project
export type SelectUserWithProject = SelectProject & {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  tier: string;
  email_address: string;
  created_at: Date;
  updated_at: Date;
};

