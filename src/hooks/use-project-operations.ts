import { useCallback } from "react";
import { Project } from "@/types/models/project";
import {
  cacheAuthenticatedProjects,
  cacheProjects,
  updateProjectInCache,
} from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook that provides functions to handle project operations (add, update, delete)
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
    (newProject: Project) => {
      console.log("+ Adding new project:", newProject.title);
      
      // Add to user's visible projects if authenticated
      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = [...prev, newProject];
          // Update cache for authenticated projects
          if (userId) {
            console.log(
              `💾 Caching ${updatedProjects.length} projects after adding new project`
            );
            cacheAuthenticatedProjects(
              updatedProjects,
              isBrowser,
              userId
            ).catch((err) =>
              console.error("Error caching projects after add:", err)
            );
          }
          return updatedProjects;
        });
      } 
      
      // Add to non-authenticated projects view
      if (!isAuthenticated) {
        setFreeProjects((prev) => {
          const updatedProjects = [...prev, newProject];
          // Update cache with new project
          cacheProjects(updatedProjects, isBrowser).catch((err) =>
            console.error("Error caching projects after add:", err)
          );
          return updatedProjects;
        });
      }
    },
    [isBrowser, userId, isAuthenticated, setProjects, setFreeProjects]
  );

  // Handler to delete a project
  const handleProjectDeleted = useCallback(
    (projectId: string) => {
      console.log("- Deleting project with ID:", projectId);
      
      // Remove from authenticated user's view
      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = prev.filter(
            (project) => project.id !== projectId
          );
          // Update cache for authenticated projects
          if (userId) {
            console.log(
              `💾 Caching ${updatedProjects.length} projects after deletion`
            );
            cacheAuthenticatedProjects(updatedProjects, isBrowser, userId).catch(
              (err) => console.error("Error caching projects after delete:", err)
            );
          }
          return updatedProjects;
        });
      }

      // Remove from non-authenticated view
      if (!isAuthenticated) {
        setFreeProjects((prev) => {
          const updatedProjects = prev.filter(
            (project) => project.id !== projectId
          );
          // Update cache for projects
          cacheProjects(updatedProjects, isBrowser).catch((err) =>
            console.error("Error caching projects after delete:", err)
          );
          return updatedProjects;
        });
      }
    },
    [isBrowser, userId, isAuthenticated, setProjects, setFreeProjects]
  );

  // Handler to update a project
  const handleProjectUpdated = useCallback(
    (updatedProject: Project) => {
      console.log("✏️ Updating project:", updatedProject.title);

      // Use the optimized cache update function
      updateProjectInCache(
        updatedProject,
        isBrowser,
        isAuthenticated ? userId : null
      ).catch((err) => console.error("Error updating project in cache:", err));

      if (isAuthenticated) {
        setProjects((prev) => {
          const updatedProjects = prev.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          );

          // Also ensure the full cache is updated
          if (userId) {
            console.log(
              `💾 Updating cache with ${updatedProjects.length} projects after project update`
            );
            cacheAuthenticatedProjects(updatedProjects, isBrowser, userId).catch(
              (err) => console.error("Error caching projects after update:", err)
            );
          }

          return updatedProjects;
        });
      }

      if (!isAuthenticated) {
        setFreeProjects((prev) => {
          const updatedProjects = prev.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          );
          
          cacheProjects(updatedProjects, isBrowser).catch(
            (err) => console.error("Error caching projects after update:", err)
          );
          
          return updatedProjects;
        });
      }
    },
    [isBrowser, userId, isAuthenticated, setProjects, setFreeProjects]
  );

  return {
    handleProjectAdded,
    handleProjectDeleted,
    handleProjectUpdated,
  };
}
