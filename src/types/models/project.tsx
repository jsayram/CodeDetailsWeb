// Import the Drizzle inferred type
import type { SelectProject as DrizzleProject } from "@/db/schema/projects";

/**
 * Enhanced Project interface for application use
 * Extends database model with UI and application-specific properties
 */
export interface Project extends DrizzleProject {
  // Application-specific fields
  formattedDate?: string; // Human-readable date
  isBookmarked?: boolean; // UI state for user preferences
  displayBadge?: boolean; // UI presentation flag
  readableSlug?: string; // User-friendly version of the slug
  tagLabels?: string[]; // Processed tag information
}

// Helper function to convert from DrizzleProject to Project interface
export function mapDrizzleProjectToProject(
  drizzleProject: DrizzleProject
): Project {
  return {
    ...drizzleProject,
    // Process or add application-specific fields
    formattedDate: drizzleProject.created_at
      ? new Date(drizzleProject.created_at).toLocaleDateString()
      : undefined,
    // Default values for other fields
    isBookmarked: false,
    displayBadge: false,
    readableSlug: drizzleProject.slug?.replace(/-/g, " "),
    // Handle null tags by providing an empty array or undefined
    tagLabels: drizzleProject.tags || undefined,
  };
}

// Helper function to convert from Project interface to Drizzle insert type
export function mapProjectToDrizzle(
  project: Project
): Omit<DrizzleProject, "id" | "created_at"> {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // Destructure to remove UI-specific properties before database operations
  const {
    formattedDate,
    isBookmarked,
    displayBadge,
    readableSlug,
    tagLabels,
    ...dbFields
  } = project;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return dbFields;
}
