import { useCallback } from "react";
import { Project } from "@/types/models/project";
import { canAccessTier } from "@/services/tierServiceServer";
import {
  cacheAuthenticatedProjects,
  cacheFreeProjects,
  updateProjectInCache,
} from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook that provides functions to handle project operations (add, update, delete)
 */
export function useProjectOperations(
  isBrowser: boolean,
  userId: string | null,
  isAuthenticated: boolean,
  userTier: string,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setFreeProjects: React.Dispatch<React.SetStateAction<Project[]>>
) {
  // Handler to add a new project
  const handleProjectAdded = useCallback(
    (newProject: Project) => {
      console.log("+ Adding new project:", newProject.title);
      // Only add to visible projects if user can access this tier
      if (canAccessTier(userTier, newProject.tier)) {
        setProjects((prev) => {
          const updatedProjects = [...prev, newProject];
          // Update cache for authenticated projects
          if (userId && isAuthenticated) {
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

      // Also add to free projects if it's a free tier project
      if (newProject.tier === "free") {
        setFreeProjects((prev) => {
          const updatedFreeProjects = [...prev, newProject];
          // Update cache with new project
          cacheFreeProjects(updatedFreeProjects, isBrowser).catch((err) =>
            console.error("Error caching free projects after add:", err)
          );
          return updatedFreeProjects;
        });
      }
    },
    [userTier, isBrowser, userId, isAuthenticated, setProjects, setFreeProjects]
  );

  // Handler to delete a project
  const handleProjectDeleted = useCallback(
    (projectId: string) => {
      console.log("- Deleting project with ID:", projectId);
      setProjects((prev) => {
        const updatedProjects = prev.filter(
          (project) => project.id !== projectId
        );
        // Update cache for authenticated projects
        if (userId && isAuthenticated) {
          console.log(
            `💾 Caching ${updatedProjects.length} projects after deletion`
          );
          cacheAuthenticatedProjects(updatedProjects, isBrowser, userId).catch(
            (err) => console.error("Error caching projects after delete:", err)
          );
        }
        return updatedProjects;
      });

      setFreeProjects((prev) => {
        const updatedFreeProjects = prev.filter(
          (project) => project.id !== projectId
        );
        // Update cache for free projects
        if (updatedFreeProjects.length !== prev.length) {
          cacheFreeProjects(updatedFreeProjects, isBrowser).catch((err) =>
            console.error("Error caching free projects after delete:", err)
          );
        }
        return updatedFreeProjects;
      });
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

      setProjects((prev) => {
        const updatedProjects = prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        );

        // Also ensure the full cache is updated
        if (userId && isAuthenticated) {
          console.log(
            `💾 Updating cache with ${updatedProjects.length} projects after project update`
          );
          cacheAuthenticatedProjects(updatedProjects, isBrowser, userId).catch(
            (err) => console.error("Error caching projects after update:", err)
          );
        }

        return updatedProjects;
      });

      setFreeProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
      );
    },
    [isBrowser, userId, isAuthenticated, setProjects, setFreeProjects]
  );

  return {
    handleProjectAdded,
    handleProjectDeleted,
    handleProjectUpdated,
  };
}
