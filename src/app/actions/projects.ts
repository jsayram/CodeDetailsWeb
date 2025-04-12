"use server";

import {
  createProjectServer,
  getProjectBySlugServer,
  getAccessibleProjectsServer,
  getFreeProjectsServer,
  deleteProjectServer,
  updateProjectServer,
} from "@/db/actions";
import { InsertProject } from "@/db/schema/projects";
import { revalidatePath } from "next/cache";
import { mapDrizzleProjectToProject } from "@/types/models/project";
import { type ValidTier } from "@/services/tierServiceServer";

// Server action to create a new project
export async function createProject(project: InsertProject) {
  try {
    // Trim title and slug to ensure no leading/trailing spaces
    const trimmedProject = {
      ...project,
      title: project.title.trim(),
      slug: project.slug.trim(),
    };

    // Basic validation
    if (!trimmedProject.title || !trimmedProject.slug) {
      return {
        success: false,
        error: "Project title and slug are required",
      };
    }

    const newProject = await createProjectServer(trimmedProject);
    // Revalidate the projects list page
    revalidatePath("/dashboard");
    return {
      success: true,
      data: mapDrizzleProjectToProject(newProject),
    };
  } catch (error) {
    console.error("Failed to create project:", error);
    // Return specific error messages for duplicate titles/slugs
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Server action to get a project by slug
export async function getProject(slug: string) {
  try {
    const project = await getProjectBySlugServer(slug);
    if (!project) {
      return { success: false, error: "Project not found" };
    }
    return {
      success: true,
      data: mapDrizzleProjectToProject(project),
    };
  } catch (error) {
    console.error("Failed to get project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server action to delete a project
export async function removeProject(id: string) {
  try {
    const deletedProject = await deleteProjectServer(id);
    revalidatePath("/dashboard");
    return {
      success: true,
      data: mapDrizzleProjectToProject(deletedProject),
    };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server action to update a project
export async function updateProject(
  id: string,
  project: Partial<InsertProject>
) {
  try {
    // Create a new project object with trimmed values
    const trimmedProject = { ...project };

    // Only trim if the fields are defined
    if (trimmedProject.title !== undefined) {
      trimmedProject.title = trimmedProject.title.trim();
    }

    if (trimmedProject.slug !== undefined) {
      trimmedProject.slug = trimmedProject.slug.trim();
    }

    // Basic validation - if slug or title is provided, ensure they're not empty
    if (trimmedProject.title !== undefined && !trimmedProject.title) {
      return {
        success: false,
        error: "Project title is required",
      };
    }

    if (trimmedProject.slug !== undefined && !trimmedProject.slug) {
      return {
        success: false,
        error: "Project slug is required",
      };
    }

    const updatedProject = await updateProjectServer(id, trimmedProject);
    // Revalidate the projects list page
    revalidatePath("/dashboard");
    return {
      success: true,
      data: mapDrizzleProjectToProject(updatedProject),
    };
  } catch (error) {
    console.error("Failed to update project:", error);
    // Return specific error messages for duplicate titles/slugs
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Server action to get all projects accessible to a user based on their tier
export async function getUserProjects(
  userTier: ValidTier | string,
  userId: string
) {
  console.log(
    `Inside getUserProjects - Fetching projects for user with tier: ${userTier} befor try`
  );
  try {
    console.log(`Fetching projects for user ${userId} with tier ${userTier}`);

    try {
      // Pass both userId and userTier to get appropriate projects
      const projects = await getAccessibleProjectsServer(userId, userTier);

      // Map the data to our Project typ
      const mappedProjects = projects.map(mapDrizzleProjectToProject);
      console.log(`Successfully fetched ${mappedProjects.length} projects`);
      return mappedProjects;
    } catch (dbError) {
      console.error("Database error when getting projects:", dbError);
      // Return empty array instead of letting the error propagate
      return [];
    }
  } catch (error) {
    console.error("Failed to get user projects:", error);
    // Return empty array instead of propagating the error to client
    return [];
  }
}

// Server action to get all free projects
export async function getAllFreeProjects() {
  try {
    const projects = await getFreeProjectsServer();

    // Return the projects directly as an array, not wrapped in an object
    return projects.map(mapDrizzleProjectToProject);
  } catch (error) {
    console.error("Failed to get free projects:", error);
    return [];
  }
}
