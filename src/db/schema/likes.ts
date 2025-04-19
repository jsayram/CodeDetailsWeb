// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/db/schema/likes.ts
import { pgTable, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  value: boolean("value").notNull().default(true), // true=like, false=dislike
  created_at: timestamp("created_at").defaultNow(),
});

// Export types for better type safety when working with likes
export type InsertLike = typeof likes.$inferInsert;
export type SelectLike = typeof likes.$inferSelect;