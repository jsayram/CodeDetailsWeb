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
  isFavorite?: boolean; // UI state for user favorites
  displayBadge?: boolean; // UI presentation flag
  readableSlug?: string; // User-friendly version of the slug
  
  // Note: tags are fetched from the related tables (tags and project_tags)
  // The tags array is added to the project by the getProjectTagNames() function
  tags?: string[];
  
  // Profile relationship fields
  profile?: {
    username: string | null;
    email_address: string | null;
    profile_image_url?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  // Category information
  category: ProjectCategory;
}

// Helper function to convert from DrizzleProject to Project interface
export function mapDrizzleProjectToProject(
  drizzleProject: DrizzleProject & {
    owner_username?: string | null;
    owner_email?: string | null;
    owner_profile_image_url?: string | null;
    owner_full_name?: string | null;
    owner_first_name?: string | null;
    owner_last_name?: string | null;
  }
): Project {
  return {
    ...drizzleProject,
    category: (drizzleProject.category || "web") as ProjectCategory,
    // Map to profile object
    profile: {
      username: drizzleProject.owner_username || null,
      email_address: drizzleProject.owner_email || null,
      profile_image_url: drizzleProject.owner_profile_image_url || null,
      full_name: drizzleProject.owner_full_name || null,
      first_name: drizzleProject.owner_first_name || null,
      last_name: drizzleProject.owner_last_name || null,
    }
  };
}

// Helper function to convert from Project interface to Drizzle insert type
export function mapProjectToDrizzle(
  project: Project
): Omit<DrizzleProject, "id" | "created_at" | "updated_at" | "deleted_at"> {
  const { formattedDate, isFavorite, displayBadge, readableSlug, ...dbFields } = project;
  return dbFields;
}
