import { useCallback } from "react";
import { Project, mapProjectToDrizzle } from "@/types/models/project";
import {
  revalidateProjectsCache,
  revalidateUserCache,
} from "@/lib/ProjectsCacheUtils";
import { createProject, removeProject, updateProject } from "@/app/actions/projects";
import { InsertProject } from "@/db/schema/projects";

type ServerResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type OperationResult = {
  success: boolean;
  error?: string;
};

/**
 * Custom hook that provides functions to handle project operations (add, update, delete)
 * All operations return { success, error? } instead of throwing errors
 */
export function useProjectOperations(
  isBrowser: boolean,
  userId: string | null,
  isAuthenticated: boolean,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setFreeProjects: React.Dispatch<React.SetStateAction<Project[]>>
) {
  // Handler to add a new project
  const handleProjectAdded = useCallback(
    async (newProject: Project): Promise<OperationResult> => {
      console.log("+ Adding new project:", newProject.title);
      
      const projectData = mapProjectToDrizzle(newProject) as InsertProject;
      
      // Create the project in the database
      const response = await createProject(projectData, userId || '') as ServerResponse<Project>;
      
      if (!response.success || !response.data) {
        const errorMsg = response.error || 'Failed to create project';
        console.error("Error adding project:", errorMsg);
        return { success: false, error: errorMsg };
      }

      const createdProject = response.data;

      // Update UI state based on authentication
      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = [...prev, createdProject];
          if (userId) {
            // Invalidate user's projects cache
            revalidateUserCache(userId).catch((error: Error) =>
              console.error("Error invalidating cache after add:", error)
            );
          }
          return updatedProjects;
        });
      } else {
        setFreeProjects((prev) => {
          const updatedProjects = [...prev, createdProject];
          // Invalidate public projects cache
          revalidateProjectsCache().catch((error: Error) =>
            console.error("Error invalidating cache after add:", error)
          );
          return updatedProjects;
        });
      }
      
      return { success: true };
    },
    [isAuthenticated, userId, setProjects, setFreeProjects]
  );

  // Handler to delete a project
  const handleProjectDeleted = useCallback(
    async (projectId: string): Promise<OperationResult> => {
      console.log("- Deleting project with ID:", projectId);

      // Delete the project from the database
      const response = await removeProject(projectId, userId || '') as ServerResponse<Project>;
      
      if (!response.success) {
        const errorMsg = response.error || 'Failed to delete project';
        console.error("Error deleting project:", errorMsg);
        return { success: false, error: errorMsg };
      }

      // Update UI state based on authentication
      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = prev.filter(
            (project) => project.id !== projectId
          );
          if (userId) {
            // Invalidate user's projects cache
            revalidateUserCache(userId).catch((error: Error) =>
              console.error("Error invalidating cache after delete:", error)
            );
          }
          return updatedProjects;
        });
      }

      // Always update free projects view since deleted projects should be removed everywhere
      setFreeProjects((prev) => {
        const updatedProjects = prev.filter(
          (project) => project.id !== projectId
        );
        // Invalidate public projects cache
        revalidateProjectsCache().catch((error: Error) =>
          console.error("Error invalidating cache after delete:", error)
        );
        return updatedProjects;
      });
      
      return { success: true };
    },
    [isAuthenticated, userId, setProjects, setFreeProjects]
  );

  // Handler to update a project
  const handleProjectUpdated = useCallback(
    async (updatedProject: Project): Promise<OperationResult> => {
      console.log("✏️ Updating project:", updatedProject.title);

      // Convert project to database format
      const projectData = mapProjectToDrizzle(updatedProject);

      // Update the project in the database
      const response = await updateProject(
        updatedProject.id,
        projectData,
        userId || ''
      ) as ServerResponse<Project>;

      if (!response.success || !response.data) {
        const errorMsg = response.error || 'Failed to update project';
        console.error("Error updating project:", errorMsg);
        return { success: false, error: errorMsg };
      }

      const result = response.data;

      // Update UI state based on authentication
      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = prev.map((project) =>
            project.id === updatedProject.id ? result : project
          );
          if (userId) {
            // Invalidate user's projects cache
            revalidateUserCache(userId).catch((error: Error) =>
              console.error("Error invalidating cache after update:", error)
            );
          }
          return updatedProjects;
        });
      }

      // Update free projects view if needed
      setFreeProjects((prev) => {
        const updatedProjects = prev.map((project) =>
          project.id === updatedProject.id ? result : project
        );
        // Invalidate public projects cache
        revalidateProjectsCache().catch((error: Error) =>
          console.error("Error invalidating cache after update:", error)
        );
        return updatedProjects;
      });
      
      return { success: true };
    },
    [isAuthenticated, userId, setProjects, setFreeProjects]
  );

  return {
    handleProjectAdded,
    handleProjectDeleted,
    handleProjectUpdated,
  };
}
