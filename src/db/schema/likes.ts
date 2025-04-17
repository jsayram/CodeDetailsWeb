// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/likes.ts
import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull(),
  project_id: uuid("project_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Export types for better type safety when working with likes
export type InsertLike = typeof likes.$inferInsert;
export type SelectLike = typeof likes.$inferSelect;