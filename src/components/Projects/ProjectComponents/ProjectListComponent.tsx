"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useProjects } from "@/providers/projects-provider";
import { Button } from "@/components/ui/button";
import { GridIcon, TableIcon, Trash2, Plus } from "lucide-react";
import { ProjectCardView } from "./ProjectCardViewComponent";
import { ProjectTableView } from "./ProjectTableViewComponent";
import { ProjectForm } from "../ProjectComponents/ProjectFormComponent";
import {
  PROJECTS_PER_PAGE,
  TABLE_PROJECTS_PER_PAGE,
  CURRENT_PAGE,
} from "@/components/navigation/Pagination/paginationConstants";

import { removeProject, addProjectFavorite, removeProjectFavorite } from "@/app/actions/projects";
import { toast } from "sonner";
import { Project } from "@/types/models/project";
import { UpdateProjectModal } from "./UpdateProjectModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { UnfavoriteConfirmationModal } from "./UnfavoriteConfirmationModal";
import { useAuth } from "@clerk/nextjs";
import { FilterControls } from "@/components/navigation/Filter/FilterControlsComponent";
import { PaginationControls } from "@/components/navigation/Pagination/PaginationControlComponent";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectListProps {
  currentPage: number;
  itemsPerPage: number;
  filter?: {
    userId?: string;
    all?: boolean;
  };
  showSortingFilters?: boolean;
  onPageChange: (page: number) => void;
  onFilteredItemsChange?: (count: number) => void;
  showUserProjectsOnly?: boolean;
  showFavoritesOnly?: boolean;
  showDeletedOnly?: boolean;
}

export function ProjectList({
  currentPage: externalPage = CURRENT_PAGE,
  itemsPerPage = PROJECTS_PER_PAGE,
  filter,
  showSortingFilters = true,
  onPageChange,
  onFilteredItemsChange,
  showUserProjectsOnly = false,
  showFavoritesOnly = false,
  showDeletedOnly = false,
}: ProjectListProps) {
  const {
    projects,
    loading,
    handleProjectDeleted,
    handleProjectUpdated,
    handleProjectAdded: contextHandleProjectAdded,
    isAuthenticated,
    filters,
    setFilters,
    setProjects,
  } = useProjects();
  const [viewMode, setViewMode] = useState("card");
  const [internalCurrentPage, setInternalCurrentPage] = useState(externalPage);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const [unfavoritingProject, setUnfavoritingProject] = useState<{ id: string; title: string } | null>(null);
  const [isUnfavoriting, setIsUnfavoriting] = useState(false);
  const { userId } = useAuth();

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    if (!projects?.length) return [];

    let filtered = [...projects];

    // Filter by deleted status
    if (showDeletedOnly) {
      filtered = filtered.filter(
        (project) => project.deleted_at !== null && project.user_id === userId
      );
    } else {
      filtered = filtered.filter((project) => project.deleted_at === null);
    }

    // Apply other filters
    if (showUserProjectsOnly && userId) {
      filtered = filtered.filter((project) => project.user_id === userId);
    } else if (showFavoritesOnly) {
      filtered = filtered.filter((project) => project.isFavorite);
    } else if (filters.showMyProjects && userId) {
      filtered = filtered.filter((project) => project.user_id === userId);
    } else if (filter?.userId) {
      filtered = filtered.filter((project) => project.user_id === filter.userId);
    }

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((project) => project.category === filters.category);
    }

    return filtered;
  }, [projects, filters, userId, filter, showUserProjectsOnly, showFavoritesOnly, showDeletedOnly]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.ceil(
      filteredProjects.length / (viewMode === "table" ? TABLE_PROJECTS_PER_PAGE : itemsPerPage)
    );
  }, [filteredProjects.length, itemsPerPage, viewMode]);

  const currentPage = Math.min(internalCurrentPage, totalPages || 1);

  // Apply pagination to filtered projects
  const displayProjects = useMemo(() => {
    const effectiveItemsPerPage = viewMode === "table" ? TABLE_PROJECTS_PER_PAGE : itemsPerPage;
    const startIndex = (currentPage - 1) * effectiveItemsPerPage;
    const endIndex = startIndex + effectiveItemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage, viewMode]);

  // Handlers
  const handleViewDetails = useCallback((id: string) => {
    console.log(`View details for project ${id}`);
  }, []);

  const handleToggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    if (!userId) return;
    
    try {
      // If trying to unfavorite, show confirmation dialog
      if (!isFavorite) {
        const project = projects.find(p => p.id === id);
        if (project) {
          setUnfavoritingProject({ id, title: project.title });
          setShowUnfavoriteModal(true);
          return;
        }
      }

      await handleFavoriteAction(id, isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  }, [userId, setProjects, showFavoritesOnly, projects]);

  const handleFavoriteAction = async (id: string, isFavorite: boolean) => {
    try {
      // Make API call first
      if (isFavorite) {
        await addProjectFavorite(id, userId!);
      } else {
        await removeProjectFavorite(id, userId!);
      }

      // After successful API call, update UI
      if (!isFavorite) {
        if (showFavoritesOnly) {
          // If we're in favorites view, remove the project from the list immediately
          setProjects(prev => prev.filter(p => p.id !== id));
          toast.success("Removed from favorites");
          return;
        }
      }

      // Update the projects state to reflect the new favorite status
      setProjects(prev => prev.map(project => {
        if (project.id === id) {
          const currentFavorites = Number(project.total_favorites || 0);
          const newFavorites = isFavorite ? currentFavorites + 1 : Math.max(0, currentFavorites - 1);
          return {
            ...project,
            isFavorite,
            total_favorites: newFavorites.toString()
          };
        }
        return project;
      }));

      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
    } finally {
      setIsUnfavoriting(false);
      setUnfavoritingProject(null);
      setShowUnfavoriteModal(false);
    }
  };

  const handleUnfavoriteConfirm = async () => {
    if (!unfavoritingProject) return;
    setIsUnfavoriting(true);
    await handleFavoriteAction(unfavoritingProject.id, false);
  };

  const handleProjectDeletion = useCallback((projectId: string, isPermanent: boolean = false) => {
    if (!isPermanent) {
      const project = projects?.find(p => p.id === projectId);
      if (project) {
        setProjectToDelete(project);
        setShowDeleteDialog(true);
      }
    } else {
      if (handleProjectDeleted) {
        handleProjectDeleted(projectId);
      }
    }
  }, [projects, handleProjectDeleted]);

  const handleUpdateProject = useCallback((project: Project) => {
    setEditingProject(project);
    setIsUpdateModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsUpdateModalOpen(false);
    setTimeout(() => setEditingProject(null), 300);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!projectToDelete || !userId) return;

    try {
      setDeletingProjectId(projectToDelete.id);
      setShowDeleteDialog(false);

      const result = await removeProject(projectToDelete.id, userId);

      if (!result.success) {
        toast.error(result.error || "Failed to delete project");
        return;
      }

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
  }, [projectToDelete, handleProjectDeleted, userId]);

  const handlePageChange = useCallback((page: number) => {
    setInternalCurrentPage(page);
    onPageChange(page);
  }, [onPageChange]);

  // Loading state
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 sm:py-10 sm:-mt-10">
      {/* Controls Section */}
      <div className="space-y-4 mb-6">
        {/* Top Row - Create Project and Show All/My Projects buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Left side buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Create Project Button */}
            {!showDeletedOnly && userId && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="w-full sm:w-auto hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" />
                Create Project
              </Button>
            )}

            {/* Filter Toggle Button */}
            {!showUserProjectsOnly && !showDeletedOnly &&(
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ showMyProjects: !filters.showMyProjects });
                  toast.success(
                    filters.showMyProjects
                      ? "Showing complete list of projects"
                      : "Showing your projects only"
                  );
                }}
                className="w-full sm:w-auto"
              >
                {filters.showMyProjects ? "Show All Projects" : "Show My Projects"}
              </Button>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Filters and View Toggle wrapper */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Filters */}
              {showSortingFilters && (
                <div className="w-full lg:w-auto">
                  <FilterControls showControls={showSortingFilters} />
                </div>
              )}

              {/* View Mode Toggle - Hidden on mobile */}
              <div className="hidden md:flex rounded-md overflow-hidden flex-none ml-auto">
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
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {displayProjects.length === 0 ? (
        <div
          className={`h-[500px] flex items-center justify-center text-center flex-col gap-4 
          ${showDeletedOnly ? "rounded-xl border border-red-900/20 py-8" : ""}`}
        >
          {showDeletedOnly ? (
            <>
              <div className="relative">
                <Trash2 className="h-24 w-24 text-red-500/30" />
              </div>
              <p className="text-red-200/70 font-semibold">
                No projects in the graveyard
              </p>
              <p className="text-gray-500 text-sm max-w-md">
                Your digital cemetery is empty. Deleted projects will appear here, where
                they can rest in peace... or be restored. 🪦
              </p>
            </>
          ) : (
            <>
              <Image
                src="/images/mascot.png"
                alt="code details mascot"
                width={128}
                height={128}
              />
              <p>OOPS ... No projects found 🥲</p>
              <p>Adjust your filters ✅</p>
              {filter?.userId === userId && (
                <Button variant="default" onClick={() => setShowAddForm(true)}>
                  Create Your First Project
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        // Force card view on mobile, otherwise use selected view mode
        (viewMode === "card" || isMobile) ? (
          <ProjectCardView
            projects={displayProjects}
            onViewDetails={handleViewDetails}
            onToggleFavorite={handleToggleFavorite}
            onDeleteProject={handleProjectDeletion}
            onUpdateProject={handleUpdateProject}
          />
        ) : (
          <div className="hidden md:block">
            <ProjectTableView
              projects={displayProjects}
              onViewDetails={handleViewDetails}
              onToggleFavorite={handleToggleFavorite}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleProjectDeletion}
            />
          </div>
        )
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4">
        {filteredProjects.length > itemsPerPage && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modals */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-[900px] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to share with the community.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm onProjectAdded={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      <UpdateProjectModal
        project={editingProject}
        isOpen={isUpdateModalOpen}
        onClose={handleModalClose}
        onProjectUpdated={handleProjectUpdated}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        projectTitle={projectToDelete?.title || ""}
        projectCategory={projectToDelete?.category}
        isDeleting={deletingProjectId !== null}
      />

      <UnfavoriteConfirmationModal
        isOpen={showUnfavoriteModal}
        onClose={() => {
          setShowUnfavoriteModal(false);
          setUnfavoritingProject(null);
        }}
        onConfirm={handleUnfavoriteConfirm}
        projectTitle={unfavoritingProject?.title || ""}
        isUnfavoriting={isUnfavoriting}
      />
    </div>
  );
}
