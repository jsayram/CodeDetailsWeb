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
  
  // Note: tags are fetched from the related tables (tags and project_tags)
  // The tags array is added to the project by the getProjectTagNames() function
  
  // Owner information
  owner_username?: string; // Username of project owner
  owner_email?: string; // Email of project owner
  owner_profile_image_url?: string; // Avatar URL of project owner
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
    
    // tags are already fetched by getProjectTagNames() and added to drizzleProject
    // if it's undefined (e.g., in a new context where tags weren't joined), use empty array
    
    // Preserve owner information if available from the database
    owner_username: (drizzleProject as any).owner_username || undefined,
    owner_email: (drizzleProject as any).owner_email || undefined,
    owner_profile_image_url: (drizzleProject as any).owner_profile_image_url || undefined,
  };
}

// Helper function to convert from Project interface to Drizzle insert type
export function mapProjectToDrizzle(
  project: Project
): Omit<DrizzleProject, "id" | "created_at" | "updated_at" | "deleted_at"> {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // Destructure to remove UI-specific properties before database operations
  const {
    formattedDate,
    isBookmarked,
    displayBadge,
    readableSlug,
    owner_username,
    owner_email,
    owner_profile_image_url,
    ...dbFields
  } = project;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // Return the database fields with tags
  // Tags will be handled separately in the createProjectServer and updateProjectServer functions
  // by inserting/updating records in the project_tags junction table
  return dbFields;
}
