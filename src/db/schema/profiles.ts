// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/profiles.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  full_name: text("full_name"),
  profile_image_url: text("profile_image_url"),
  email_address: text("email_address"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Export types for better type safety when working with profiles
export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;