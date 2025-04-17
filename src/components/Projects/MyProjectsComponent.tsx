"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUserOwnProjects, removeProject } from "@/app/actions/projects";
import { Project } from "@/types/models/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GridIcon, TableIcon, Plus } from "lucide-react";
import { ProjectForm } from "./ProjectComponents/ProjectFormComponent";
import { ProjectCard } from "./ProjectComponents/ProjectCardComponent";
import { UpdateProjectModal } from "./ProjectComponents/UpdateProjectModal";
import { DeleteConfirmationModal } from "./ProjectComponents/DeleteConfirmationModal";
import { toast } from "sonner";

interface MyProjectsComponentProps {
  userId: string;
}

export function MyProjectsComponent({ userId }: MyProjectsComponentProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  
  // Modal states
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch user's own projects when the component mounts or userId changes
  useEffect(() => {
    async function fetchUserProjects() {
      if (!userId) return;
      
      setLoading(true);
      try {
        const result = await getUserOwnProjects(userId);
        if (result.success && result.data) {
          setProjects(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load your projects");
          setProjects([]);
        }
      } catch (err) {
        setError("An unexpected error occurred");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProjects();
  }, [userId]);

  // Handle project added event
  const handleProjectAdded = (newProject: Project) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
    setShowAddForm(false); // Hide the form after successful addition
    toast.success("Project created successfully!");
  };

  // Handle view details click
  const handleViewDetails = useCallback((id: string) => {
    console.log(`View details for project ${id}`);
    // Add navigation logic here, e.g.:
    // router.push(`/projects/${id}`);
  }, []);

  // Handle toggling favorites
  const handleToggleFavorite = useCallback((id: string, isFavorite: boolean) => {
    console.log(`Toggle favorite for project ${id}: ${isFavorite}`);
    // Implement favorite toggling logic here
  }, []);

  // Handle delete button click
  const handleDeleteProject = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      // Set deleting state
      setDeletingProjectId(projectToDelete.id);

      // Close the dialog immediately to prevent double-rendering issues
      setShowDeleteDialog(false);

      // Call the server action to delete the project
      const result = await removeProject(projectToDelete.id, userId);

      if (!result.success) {
        toast.error(result.error || "Failed to delete project");
        setDeletingProjectId(null);
        return;
      }

      // Remove the deleted project from the state
      setProjects((prevProjects) => 
        prevProjects.filter(project => project.id !== projectToDelete.id)
      );

      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("An error occurred while deleting the project");
    } finally {
      setDeletingProjectId(null);
      setProjectToDelete(null);
    }
  }, [projectToDelete]);

  // Handle update button click
  const handleUpdateProject = useCallback((project: Project) => {
    setEditingProject(project);
    setIsUpdateModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsUpdateModalOpen(false);
    setTimeout(() => setEditingProject(null), 300); // Clear after animation completes
  }, []);

  // Handle project updated event
  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prevProjects) => 
      prevProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
    toast.success("Project updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          {showAddForm ? "Cancel" : "New Project"}
        </Button>
      </div>
      
      {/* Project creation form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm onProjectAdded={handleProjectAdded} />
          </CardContent>
        </Card>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500">Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="h-40 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-500">You haven&apos;t created any projects yet.</p>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
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

          {/* Card view */}
          {viewMode === "card" && projects.length > 0 && (
            <div className="project-grid gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={handleViewDetails}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteProject={() => handleDeleteProject(project)}
                  onUpdateProject={handleUpdateProject}
                  isFavorite={false}
                />
              ))}
            </div>
          )}

          {/* Table view would go here - omitted for brevity */}
          {viewMode === "table" && (
            <div className="p-4 text-center border rounded-md">
              Table view is available in the ProjectList component
            </div>
          )}

          {/* Update Project Modal */}
          <UpdateProjectModal
            project={editingProject}
            isOpen={isUpdateModalOpen}
            onClose={handleModalClose}
            onProjectUpdated={handleProjectUpdated}
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
      )}
    </div>
  );
}