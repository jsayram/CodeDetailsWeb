// Import the Drizzle inferred type
import type { SelectProject as DrizzleProject } from "@/db/schema/projects";
import { ProjectCategory } from "@/constants/project-categories";

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
  tags?: string[];
  
  // Owner information
  owner_username?: string; // Username of project owner
  owner_email?: string; // Email of project owner
  owner_profile_image_url?: string; // Avatar URL of project owner
  
  // Category information
  category: ProjectCategory;
}

// Helper function to convert from DrizzleProject to Project interface
export function mapDrizzleProjectToProject(
  drizzleProject: DrizzleProject
): Project {
  return {
    ...drizzleProject,
    category: (drizzleProject.category || "web") as ProjectCategory,
  };
}

// Helper function to convert from Project interface to Drizzle insert type
export function mapProjectToDrizzle(
  project: Project
): Omit<DrizzleProject, "id" | "created_at" | "updated_at" | "deleted_at"> {
  const { formattedDate, isBookmarked, displayBadge, readableSlug, owner_username, owner_email, owner_profile_image_url, ...dbFields } = project;
  return dbFields;
}
