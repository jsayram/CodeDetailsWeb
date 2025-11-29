import { pgTable, text, varchar, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * Project Images Table
 * Stores references to images uploaded to Supabase Storage
 */
export const project_images = pgTable("project_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  // Storage reference
  storage_path: text("storage_path").notNull(), // e.g., "user123/project456/uuid-image.jpg"
  storage_url: text("storage_url").notNull(), // Full public URL from Supabase

  // Image metadata
  file_name: text("file_name").notNull(), // Original filename
  file_size: integer("file_size"), // Size in bytes
  mime_type: varchar("mime_type", { length: 50 }), // image/jpeg, image/png, etc.
  width: integer("width"), // Image width in pixels
  height: integer("height"), // Image height in pixels

  // Image purpose & display
  image_type: varchar("image_type", { length: 20 }).notNull(), // 'cover', 'screenshot', 'diagram', 'logo'
  display_order: integer("display_order").default(0), // Order to show images
  alt_text: text("alt_text"), // Accessibility description
  caption: text("caption"), // Optional caption for galleries

  // Metadata
  uploaded_by: text("uploaded_by").notNull(), // User ID who uploaded
  created_at: timestamp("created_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // Soft delete
});

// Type definitions
export type InsertProjectImage = typeof project_images.$inferInsert;
export type SelectProjectImage = typeof project_images.$inferSelect;

/**
 * Valid image types
 */
export const IMAGE_TYPES = ['cover', 'screenshot', 'diagram', 'logo'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

/**
 * Project image with additional metadata
 */
export interface ProjectImageWithMetadata extends SelectProjectImage {
  is_cover?: boolean;
  is_deleted?: boolean;
}
