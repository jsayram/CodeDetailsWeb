"use client";
import React, { useState, useCallback } from "react";
import { useProjects } from "@/providers/projects-provider";
import { Button } from "@/components/ui/button";
import { GridIcon, Heart, TableIcon, Trash2, Edit } from "lucide-react";
import { ProjectCard } from "./ProjectCardComponent";
import { Badge } from "@/components/ui/badge";
import {
  PROJECTS_PER_PAGE,
  CURRENT_PAGE,
} from "@/components/navigation/Pagination/paginationConstants";
import { FormattedDate } from "@/lib/FormattedDate";
import { removeProject } from "@/app/actions/projects";
import { toast } from "sonner";
import { Project } from "@/types/models/project";
import { UpdateProjectModal } from "./UpdateProjectModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

interface ProjectListProps {
  projectType?: "free" | "authenticated";
  currentPage?: number;
  itemsPerPage?: number;
}

export function ProjectList({
  projectType = "authenticated",
  currentPage = CURRENT_PAGE,
  itemsPerPage = PROJECTS_PER_PAGE,
}: ProjectListProps) {
  const {
    projects,
    freeProjects,
    loading,
    freeLoading,
    handleProjectDeleted,
    handleProjectUpdated,
  } = useProjects();
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  ); // Track the project being deleted
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Determine which projects and loading state to use based on projectType
  const allProjects = projectType === "free" ? freeProjects : projects;
  const isLoading = projectType === "free" ? freeLoading : loading;

  // Apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayProjects = allProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Optimize handlers with useCallback to prevent unnecessary re-renders
  const handleViewDetails = useCallback((id: string) => {
    console.log(`View details for project ${id}`);
    // Add your navigation logic here, e.g.:
    // router.push(`/projects/${id}`);
  }, []);

  // Handle toggling favorites
  const handleToggleFavorite = useCallback(
    (id: string, isFavorite: boolean) => {
      console.log(`Toggle favorite for project ${id}: ${isFavorite}`);
      // Implement your favorite toggling logic here
    },
    []
  );

  // Handle the actual deletion after confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      // Set deleting state
      setDeletingProjectId(projectToDelete.id);

      // Close the dialog immediately to prevent double-rendering issues
      setShowDeleteDialog(false);

      // Call the server action to delete the project
      const result = await removeProject(projectToDelete.id);

      if (!result.success) {
        toast.error(result.error || "Failed to delete project");
        setDeletingProjectId(null);
        return;
      }

      // Handle the deletion in the projects context
      if (handleProjectDeleted) {
        handleProjectDeleted(projectToDelete.id);
      }

      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("An error occurred while deleting the project");
    } finally {
      setDeletingProjectId(null);
      setProjectToDelete(null);
    }
  }, [projectToDelete, handleProjectDeleted]);

  // Handle delete button click
  const handleDeleteProject = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  }, []);

  const handleUpdateProject = useCallback((project: Project) => {
    setEditingProject(project);
    setIsUpdateModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsUpdateModalOpen(false);
    setTimeout(() => setEditingProject(null), 300); // Clear after animation completes
  }, []);

  // Loading state with fixed height
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        Loading {projectType} projects...
      </div>
    );
  }

  // Empty state with fixed height
  if (!allProjects.length) {
    return (
      <div className="h-[200px] flex items-center justify-center text-center">
        {projectType === "free"
          ? "No free projects available at the moment"
          : "No projects found for your tier level"}
      </div>
    );
  }

  return (
    <div>
      {/* View toggle buttons */}
      <div className="flex justify-end mb-4">
        <div className="flex rounded-md overflow-hidden">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            className="rounded-r-none"
            onClick={() => setViewMode("card")}
            size="sm"
          >
            <GridIcon className="h-4 w-4 mr-1" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            className="rounded-l-none"
            onClick={() => setViewMode("table")}
            size="sm"
          >
            <TableIcon className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>
      </div>

      {/* Empty page message */}
      {displayProjects.length === 0 && (
        <div className="h-[200px] flex items-center justify-center text-center">
          No projects on this page.
          <Button variant="link" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      )}

      {/* Card view using ProjectCard component */}
      {viewMode === "card" && displayProjects.length > 0 && (
        <div className="project-grid gap-4">
          {displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={handleViewDetails}
              onToggleFavorite={handleToggleFavorite}
              onDeleteProject={() => handleDeleteProject(project)}
              onUpdateProject={handleUpdateProject}
              isFavorite={false} // This would come from your favorites state
            />
          ))}
        </div>
      )}

      {/* Table view with responsive mobile layout */}
      {viewMode === "table" && displayProjects.length > 0 && (
        <div className="responsive-table mobile-card-view">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-background-lighter">
                <th className="border p-2">Title</th>
                <th className="border p-2">Slug</th>
                <th className="border p-2">Tags</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Tier</th>
                <th className="border p-2">Difficulty</th>
                <th className="border p-2">Created At</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.map((project) => (
                <tr key={project.id} className="border hover:bg-muted/30">
                  <td className="border p-2" data-label="Title">
                    <span className="font-medium">{project.title}</span>
                  </td>
                  <td className="border p-2" data-label="Slug">
                    {project.slug}
                  </td>
                  <td className="border p-2" data-label="Tags">
                    <div className="flex flex-wrap gap-1">
                      {project.tags && project.tags.length > 0 ? (
                        <>
                          {project.tags
                            .slice(0, 2)
                            .map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="badge text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          {project.tags.length > 2 && (
                            <Badge variant="outline" className="badge text-xs">
                              +{project.tags.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="badge text-xs">
                          No tags
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="border p-2" data-label="Description">
                    <p className="line-clamp-2 text-sm">
                      {project.description}
                    </p>
                  </td>
                  <td className="border p-2" data-label="Tier">
                    <span
                      className={`badge px-2 py-1 rounded text-xs ${
                        project.tier === "free"
                          ? "bg-green-100 text-green-800"
                          : project.tier === "pro"
                          ? "bg-blue-100 text-blue-800"
                          : project.tier === "diamond"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.tier}
                    </span>
                  </td>
                  <td className="border p-2" data-label="Difficulty">
                    {project.difficulty}
                  </td>
                  <td className="border p-2" data-label="Created">
                    {project.created_at && (
                      <FormattedDate
                        date={project.created_at}
                        format="date"
                        fallback="N/A"
                      />
                    )}
                  </td>
                  <td className="border p-2" data-label="Actions">
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewDetails(project.id)}
                        className="card-button"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFavorite(project.id, false)}
                        className="card-button"
                      >
                        <Heart
                          size={14}
                          // className={
                          //   project.isFavorite
                          //     ? "fill-red-500 text-red-500"
                          //     : ""
                          // }
                        />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProject(project)}
                        disabled={deletingProjectId === project.id}
                        className="card-button"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpdateProject(project)}
                        disabled={editingProject?.id === project.id}
                        className="card-button"
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Project Modal */}
      <UpdateProjectModal
        project={editingProject}
        isOpen={isUpdateModalOpen}
        onClose={handleModalClose}
        onProjectUpdated={(updatedProject) => {
          if (handleProjectUpdated) {
            handleProjectUpdated(updatedProject);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        projectTitle={projectToDelete?.title || ""}
        isDeleting={deletingProjectId !== null}
      />
    </div>
  );
}
