"use server";

import { eq, sql, and } from "drizzle-orm";
import {
  createProjectServer,
  getAccessibleProjectsServer,
  deleteProjectServer,
  updateProjectServer,
  getUserProjectsServer,
  isProjectOwner,
  getProjectTagNames,
} from "@/db/actions";
import { InsertProject } from "@/db/schema/projects";
import { projects } from "@/db/schema/projects";
import { revalidatePath } from "next/cache";
import { mapDrizzleProjectToProject } from "@/types/models/project";
import { executeQuery } from "@/db/server";
import { favorites } from "@/db/schema/favorites";
import { getProfileByUserId } from "@/db/operations";

const pathToRevalidate = "/projects";

export async function getProjectById(projectId: string) {
  return executeQuery(async (db) => {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    return results[0] || null;
  });
}

// Get a single project by slug
export async function getProjectBySlugServer(slug: string) {
  return executeQuery(async (db) => {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    return results[0] || null;
  });
}

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
export async function getUserProjects(userId: string) {
  try {
    console.log(`Fetching all projects for user ${userId}`);

    try {
      // Pass userId to get all available projects (no tier filtering)
      const projects = await getAccessibleProjectsServer(userId);

      // Map the data to our Project type
      const mappedProjects = projects.map(mapDrizzleProjectToProject);
      console.log(
        `Successfully fetched ${mappedProjects.length} projects for user ${userId}`
      );
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

// Server action to permanently delete a project
export async function permanentlyDeleteProject(id: string, userId: string) {
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

    // Permanently delete the project
    await executeQuery(async (db) => {
      // First verify the project exists and is deleted
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!project) {
        throw new Error("Project not found");
      }

      if (!project.deleted_at) {
        throw new Error("Project must be in the graveyard before permanent deletion");
      }

      // If checks pass, perform the permanent deletion
      await db.delete(projects).where(eq(projects.id, id));
    });

    revalidatePath(pathToRevalidate);
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Failed to permanently delete project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server action to restore a deleted project
export async function restoreProject(id: string, userId: string) {
  try {
    // Ensure there is a user ID
    if (!userId) {
      return {
        success: false,
        error: "User ID is required to restore a project",
      };
    }

    // First check if the user is the owner of this project
    const isOwner = await isProjectOwner(id, userId);
    if (!isOwner) {
      return {
        success: false,
        error: "You don't have permission to restore this project",
      };
    }

    // Restore the project by clearing deleted_at
    const restoredProject = await executeQuery(async (db) => {
      const [updated] = await db
        .update(projects)
        .set({ 
          deleted_at: null,
          updated_at: new Date()
        })
        .where(eq(projects.id, id))
        .returning();
      
      if (!updated) {
        throw new Error("Project not found");
      }

      const tags = await getProjectTagNames(id);
      return { ...updated, tags };
    });

    revalidatePath(pathToRevalidate);
    return {
      success: true,
      data: mapDrizzleProjectToProject(restoredProject),
    };
  } catch (error) {
    console.error("Failed to restore project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server action to add a favorite to a project
export async function addProjectFavorite(
  projectId: string,
  userId: string
) {
  try {
    if (!userId || !projectId) {
      return {
        success: false,
        error: "Both user ID and project ID are required",
      };
    }

    // First get the profile ID for the user
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    await executeQuery(async (db) => {
      // Check if favorite already exists
      const existingFavorite = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.project_id, projectId),
            eq(favorites.profile_id, profile.id)
          )
        )
        .limit(1);

      if (existingFavorite.length === 0) {
        // Create new favorite and increment total_favorites in a transaction
        await db.transaction(async (tx) => {
          // Add the favorite
          await tx
            .insert(favorites)
            .values({
              project_id: projectId,
              profile_id: profile.id,
            });

          // Increment total_favorites
          await tx
            .update(projects)
            .set({ 
              total_favorites: sql`total_favorites + 1`,
              updated_at: new Date()
            })
            .where(eq(projects.id, projectId));
        });
      }
    });

    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (error) {
    console.error("Failed to add favorite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server action to remove a favorite from a project
export async function removeProjectFavorite(
  projectId: string,
  userId: string
) {
  try {
    if (!userId || !projectId) {
      return {
        success: false,
        error: "Both user ID and project ID are required",
      };
    }

    // First get the profile ID for the user
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    await executeQuery(async (db) => {
      // Delete favorite and decrement total_favorites in a transaction
      await db.transaction(async (tx) => {
        // Remove the favorite
        await tx
          .delete(favorites)
          .where(
            and(
              eq(favorites.project_id, projectId),
              eq(favorites.profile_id, profile.id)
            )
          );

        // Decrement total_favorites, ensuring it doesn't go below 0
        await tx
          .update(projects)
          .set({ 
            total_favorites: sql`GREATEST(total_favorites - 1, 0)`,
            updated_at: new Date()
          })
          .where(eq(projects.id, projectId));
      });
    });

    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
