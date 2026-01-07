import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { tags } from "./tags";

export const tag_submissions = pgTable("tag_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "set null" }),
  tag_name: text("tag_name").notNull(),
  submitter_email: text("submitter_email").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  admin_notes: text("admin_notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  reviewed_at: timestamp("reviewed_at"),
});

export type InsertTagSubmission = typeof tag_submissions.$inferInsert;
export type SelectTagSubmission = typeof tag_submissions.$inferSelect;