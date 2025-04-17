import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull(),
  project_id: uuid("project_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Export types for better type safety when working with favorites
export type InsertFavorite = typeof favorites.$inferInsert;
export type SelectFavorite = typeof favorites.$inferSelect;