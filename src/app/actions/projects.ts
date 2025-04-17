"use server";

import {
  createProjectServer,
  getProjectBySlugServer,
  getAccessibleProjectsServer,
  deleteProjectServer,
  updateProjectServer,
  getUserProjectsServer,
  isProjectOwner,
} from "@/db/actions";
import { InsertProject } from "@/db/schema/projects";
import { revalidatePath } from "next/cache";
import { mapDrizzleProjectToProject } from "@/types/models/project";

const pathToRevalidate = "/projects"; //TODO: Make this dynamic

// Server action to create a new project
export async function createProject(project: InsertProject, userId: string) {
  try {
    // Ensure there is a user ID
    if (!userId) {
      return {
        success: false,
        error: "User ID is required to create a project",
      };
    }

    // Trim title and slug to ensure no leading/trailing spaces
    const trimmedProject = {
      ...project,
      title: project.title.trim(),
      slug: project.slug.trim(),
      user_id: userId, // Always assign the user ID to the project
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
    revalidatePath(pathToRevalidate);
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
export async function removeProject(id: string, userId: string) {
  try {
    // Ensure there is a user ID
    if (!userId) {
      return {
        success: false,
        error: "User ID is required to delete a project",
      };
    }

    // First check if the user is the owner of this project
    const isOwner = await isProjectOwner(id, userId);
    if (!isOwner) {
      return {
        success: false,
        error: "You don't have permission to delete this project",
      };
    }

    const deletedProject = await deleteProjectServer(id);
    revalidatePath(pathToRevalidate);
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
  project: Partial<InsertProject>,
  userId: string
) {
  try {
    // Ensure there is a user ID
    if (!userId) {
      return {
        success: false,
        error: "User ID is required to update a project",
      };
    }

    // First check if the user is the owner of this project
    const isOwner = await isProjectOwner(id, userId);
    if (!isOwner) {
      return {
        success: false,
        error: "You don't have permission to update this project",
      };
    }

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
    revalidatePath(pathToRevalidate);
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

// Server action to get all projects accessible to a user
export async function getUserProjects(
  userId: string
) {
  try {
    console.log(`Fetching all projects for user ${userId}`);

    try {
      // Pass userId to get all available projects (no tier filtering)
      const projects = await getAccessibleProjectsServer(userId);

      // Map the data to our Project type
      const mappedProjects = projects.map(mapDrizzleProjectToProject);
      console.log(`Successfully fetched ${mappedProjects.length} projects for user ${userId}`);
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

// Server action to get all projects (previously free tier only)
export async function getAllProjects() {
  try {
    // Get all projects without tier filtering
    const projects = await getAccessibleProjectsServer("anonymous");

    // Return the projects directly as an array, not wrapped in an object
    return projects.map(mapDrizzleProjectToProject);
  } catch (error) {
    console.error("Failed to get projects:", error);
    return [];
  }
}

// Server action to get projects created by the current user
export async function getUserOwnProjects(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    console.log(`Fetching projects owned by user ${userId}`);
    const projects = await getUserProjectsServer(userId);

    // Map the data to our Project type
    const mappedProjects = projects.map(mapDrizzleProjectToProject);
    console.log(`Successfully fetched ${mappedProjects.length} user projects`);
    
    return {
      success: true,
      data: mappedProjects,
    };
  } catch (error) {
    console.error("Failed to get user's own projects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
