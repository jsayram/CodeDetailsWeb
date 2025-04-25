"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useProjects } from "@/providers/projects-provider";
import { Button } from "@/components/ui/button";
import { GridIcon, Heart, TableIcon, Trash2, Edit, Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCardComponent";
import { ProjectForm } from "../ProjectComponents/ProjectFormComponent";
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

//used for the pagination height
//imperative that this is used as this is tied to pagination height
import {
  CARD_HEIGHT,
  GRID_COLUMNS,
  GRID_GAP,
} from "@/components/navigation/Pagination/paginationConstants";

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
  } = useProjects();
  const [viewMode, setViewMode] = useState("card");
  const [internalCurrentPage, setInternalCurrentPage] = useState(externalPage);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const { userId } = useAuth();

  // Check screen sizes for responsive pagination
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsVerySmallScreen(window.innerWidth < 640);
    };

    checkScreenSize();
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCheckScreenSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkScreenSize, 100);
    };

    window.addEventListener("resize", debouncedCheckScreenSize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedCheckScreenSize);
    };
  }, []);

  // Handle filtering locally in the component using provider's filters
  const filteredProjects = useMemo(() => {
    if (!projects?.length) return [];

    let filtered = [...projects];

    // Filter by deleted status first
    if (showDeletedOnly) {
      // Only show deleted projects that belong to the current user
      filtered = filtered.filter(
        (project) =>
          project.deleted_at !== null && project.user_id === userId
      );
    } else {
      // For non-deleted views, never show deleted projects unless specifically requested
      filtered = filtered.filter((project) => project.deleted_at === null);
    }

    // Then apply other filters
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
      filtered = filtered.filter(
        (project) => project.category === filters.category
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = a.created_at ? +new Date(a.created_at) : 0;
      const dateB = b.created_at ? +new Date(b.created_at) : 0;

      switch (filters.sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "popular":
          return 0;
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [
    projects,
    filters,
    userId,
    filter,
    showUserProjectsOnly,
    showFavoritesOnly,
    showDeletedOnly,
  ]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const currentPage = Math.min(internalCurrentPage, totalPages || 1);

  // Effect to notify parent of filtered items count change
  useEffect(() => {
    if (onFilteredItemsChange) {
      onFilteredItemsChange(filteredProjects.length);
    }
  }, [filteredProjects.length, onFilteredItemsChange]);

  // Effect to handle page changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setInternalCurrentPage(1);
      if (onPageChange) onPageChange(1);
    }
  }, [totalPages, currentPage, onPageChange]);

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      setInternalCurrentPage(page);
      if (onPageChange) onPageChange(page);
    },
    [onPageChange]
  );

  // Apply pagination to filtered projects
  const displayProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

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
    if (!projectToDelete || !userId) return;

    try {
      // Set deleting state
      setDeletingProjectId(projectToDelete.id);

      // Close the dialog immediately to prevent double-rendering issues
      setShowDeleteDialog(false);

      // Use the current user's ID instead of the project creator's ID
      const result = await removeProject(projectToDelete.id, userId);

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
  }, [projectToDelete, handleProjectDeleted, userId]);

  // Handle delete button click
  const handleDeleteProject = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  }, []);

  // Handle project deletion with a flag for permanent deletion
  const handleProjectDeletion = useCallback((projectId: string, isPermanent: boolean = false) => {
    if (!isPermanent) {
      // For normal deletion, show the confirmation dialog
      const project = projects?.find(p => p.id === projectId);
      if (project) {
        handleDeleteProject(project);
      }
    } else {
      // For permanent deletion, just update the UI state
      if (handleProjectDeleted) {
        handleProjectDeleted(projectId);
      }
    }
  }, [projects, handleDeleteProject, handleProjectDeleted]);

  const handleUpdateProject = useCallback((project: Project) => {
    setEditingProject(project);
    setIsUpdateModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsUpdateModalOpen(false);
    setTimeout(() => setEditingProject(null), 300); // Clear after animation completes
  }, []);

  // Loading state with fixed height
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 sm:py-10 sm:-mt-10">
      {/* Controls Section - New Layout */}
      <div className="space-y-4 sm:space-y-0 mb-6">
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
            {!showUserProjectsOnly && (
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

          {/* Right side controls - Align everything in a single row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Filters */}
            {showSortingFilters && (
              <div className="w-full lg:w-auto flex-none">
                <FilterControls showControls={showSortingFilters} />
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex rounded-md overflow-hidden flex-none">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                className="flex-1 lg:flex-initial rounded-r-none"
                onClick={() => setViewMode("card")}
                size="sm"
              >
                <GridIcon className="h-4 w-4 mr-1" />
                Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                className="flex-1 lg:flex-initial rounded-l-none"
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

      {/* Project creation dialog */}
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

      {/* Card view using ProjectCard component */}
      {viewMode === "card" &&
        (() => {
          // Calculate rows needed for current PROJECTS_PER_PAGE
          const rows = Math.ceil(PROJECTS_PER_PAGE / GRID_COLUMNS);
          // Calculate minHeight for the container
          const minHeight = rows * CARD_HEIGHT + (rows - 1) * GRID_GAP;
          return (
            <div
              className="w-full"
              style={{
                minHeight: `${minHeight}px`,
              }}
            >
              {displayProjects.length > 0 ? (
                <div className="project-grid gap-4">
                  {displayProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onViewDetails={handleViewDetails}
                      onToggleFavorite={handleToggleFavorite}
                      onDeleteProject={handleProjectDeletion}
                      onUpdateProject={handleUpdateProject}
                      isFavorite={false}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`h-[500px] flex items-center justify-center text-center flex-col gap-4 
              ${showDeletedOnly ? "bg-gray-950/50 rounded-xl border border-red-900/20 py-8" : ""}`}
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
                      <p>OOPS ... No projects found 🥲</p>
                      <p>Adjust your filters ✅</p>
                      <Image
                        src="/images/mascot.png"
                        alt="code details mascot"
                        width={128}
                        height={128}
                      />
                      <Button
                        variant="default"
                        onClick={() => setShowAddForm(true)}
                      >
                        Add Projects Here
                      </Button>
                      {filter?.userId === userId && (
                        <Button
                          variant="default"
                          onClick={() => setShowAddForm(true)}
                        >
                          Create Your First Project
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* Table view with responsive mobile layout */}
      {viewMode === "table" && (
        <div className="min-h-[800px]">
          {" "}
          {/* Minimum height to fit table view */}
          {displayProjects.length > 0 ? (
            <div className="responsive-table mobile-card-view">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-background-lighter">
                    <th className="border p-2">Title</th>
                    <th className="border p-2">Slug</th>
                    <th className="border p-2">Tags</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Category</th>
                    <th className="border p-2">Created</th>
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
                                    #{tag}
                                  </Badge>
                                ))}
                              {project.tags.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="badge text-xs"
                                >
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
                      <td className="border p-2" data-label="Category">
                        {project.category}
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
                            onClick={() =>
                              handleToggleFavorite(project.id, false)
                            }
                            className="card-button"
                          >
                            <Heart size={14} />
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
          ) : (
            <div
              className={`h-[500px] flex items-center justify-center text-center flex-col gap-4 
              ${showDeletedOnly ? "bg-gray-950/50 rounded-xl border border-red-900/20 py-8" : ""}`}
            >
              {showDeletedOnly ? (
                <>
                  <div className="relative">
                    <Trash2 className="h-24 w-24 text-red-500/30" />
                    <div className="absolute -top-4 -right-4 text-4xl">🗑️</div>
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
                  <p>OOPS ... No projects found 🥲</p>
                  <p>Adjust your filters ✅</p>
                  <Image
                    src="/images/mascot.png"
                    alt="code details mascot"
                    width={128}
                    height={128}
                  />
                  <Button
                    variant="default"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add Projects Here
                  </Button>
                  {filter?.userId === userId && (
                    <Button
                      variant="default"
                      onClick={() => setShowAddForm(true)}
                    >
                      Create Your First Project
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex justify-center items-center mt-4">
        {filteredProjects.length > itemsPerPage ? (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="h-10">{/* Placeholder to maintain height */}</div>
        )}
      </div>

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
        projectCategory={projectToDelete?.category}
        isDeleting={deletingProjectId !== null}
      />
    </div>
  );
}
