import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Username History Table
 * 
 * Tracks historical usernames to support permanent redirects when users
 * change their username. This follows the GitHub/Twitter pattern where
 * old profile URLs continue to work by redirecting to the new username.
 * 
 * The old_username is the primary key since each old username can only
 * map to one user (usernames are unique). This also provides fast lookups
 * when checking if a requested username is a historical one.
 */
export const usernameHistory = pgTable("username_history", {
  // The old username that was changed from - primary key for fast lookups
  old_username: text("old_username").primaryKey(),
  // The user_id who owned this username (links to profiles.user_id)
  user_id: text("user_id").notNull(),
  // The new username they changed to (helps with redirect response)
  new_username: text("new_username").notNull(),
  // When the change occurred
  changed_at: timestamp("changed_at").defaultNow(),
});

// Export types for better type safety
export type InsertUsernameHistory = typeof usernameHistory.$inferInsert;
export type SelectUsernameHistory = typeof usernameHistory.$inferSelect;
