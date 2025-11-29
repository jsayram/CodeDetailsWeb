"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useProjects, invalidateProjectsCache } from "@/providers/projects-provider";
import { Button } from "@/components/ui/button";
import { GridIcon, TableIcon, Plus, ExternalLink } from "lucide-react";
import { ProjectCardView } from "./ProjectCardViewComponent";
import { ProjectTableView } from "./ProjectTableViewComponent";
import { ProjectForm } from "../ProjectComponents/ProjectFormComponent";
import {
  PROJECT_CATEGORIES,
  ProjectCategory,
} from "@/constants/project-categories";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";

import {
  removeProject,
  addProjectFavorite,
  removeProjectFavorite,
} from "@/app/actions/projects";
import { toast } from "sonner";
import { Project } from "@/types/models/project";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { UnfavoriteConfirmationModal } from "./UnfavoriteConfirmationModal";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { PaginationControls } from "@/components/navigation/Pagination/PaginationControlComponent";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectFilters } from "@/providers/projects-provider";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { SignInButtonComponent } from "@/components/auth/SignInButtonComponent";
import ShareProjectsButton from "../ShareProjectsButton";
import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface ProjectListProps {
  currentPage: number;
  filter?: {
    userId?: string;
    all?: boolean;
  };
  showSortingFilters?: boolean;
  hideCategoryFilter?: boolean;
  onPageChange: (page: number) => void;
  onFilteredItemsChange?: (count: number) => void;
  showUserProjectsOnly?: boolean;
  showFavoritesOnly?: boolean;
  showDeletedOnly?: boolean;
  allowAnonymousView?: boolean;
}

export const ProjectList = React.memo(function ProjectList({
  currentPage: externalPage = CURRENT_PAGE,
  filter,
  showSortingFilters = true,
  hideCategoryFilter = false,
  onPageChange,
  onFilteredItemsChange,
  showUserProjectsOnly = false,
  showFavoritesOnly = false,
  showDeletedOnly = false,
  allowAnonymousView = false,
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
    pagination,
  } = useProjects();

  const { userId } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState("card");
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const [unfavoritingProject, setUnfavoritingProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isUnfavoriting, setIsUnfavoriting] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const user = useSession();

  // Wait for layout to be ready before showing skeleton
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Sync external page changes with provider
  useEffect(() => {
    if (externalPage !== filters.page) {
      setFilters({ page: externalPage });
    }
  }, [externalPage, filters.page, setFilters]);

  // Notify parent of filtered items count changes
  useEffect(() => {
    if (onFilteredItemsChange) {
      onFilteredItemsChange(pagination.total);
    }
  }, [pagination.total, onFilteredItemsChange]);

  // Set initial view state
  useEffect(() => {
    setFilters({
      showMyProjects: showUserProjectsOnly,
      showFavorites: showFavoritesOnly,
      showDeleted: showDeletedOnly,
      page: externalPage,
    });
  }, [
    showUserProjectsOnly,
    showFavoritesOnly,
    showDeletedOnly,
    externalPage,
    setFilters,
  ]);

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      // Store the current scroll position and container height
      const scrollPosition = window.scrollY;
      const container = document.querySelector(".projects-container");
      const containerHeight = container?.getBoundingClientRect().height;

      // Apply the container height to prevent content shift
      if (container && containerHeight) {
        (container as HTMLElement).style.minHeight = `${containerHeight}px`;
      }

      if (page > pagination.totalPages) {
        page = pagination.totalPages;
      }

      if (page === pagination.currentPage) {
        return;
      }

      const newFilters: Partial<ProjectFilters> = { page };
      setFilters(newFilters);

      if (onPageChange) {
        onPageChange(page);
      }

      // Restore scroll position after content update
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: "instant",
        });

        // Reset the container height after the content has updated
        if (container) {
          setTimeout(() => {
            (container as HTMLElement).style.minHeight = "";
          }, 100);
        }
      });
    },
    [setFilters, onPageChange, pagination.totalPages, pagination.currentPage]
  );

  // Handlers
  const handleViewDetails = useCallback((id: string) => {
    // TODO: View details handler - currently unused but kept for future implementation
  }, []);

  const handleToggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      if (!userId) return;

      try {
        if (!isFavorite) {
          const project = projects.find((p) => p.id === id);
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
    },
    [userId, setProjects, projects]
  );

  const handleFavoriteAction = async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await addProjectFavorite(id, userId!);
      } else {
        await removeProjectFavorite(id, userId!);
      }

      // If we're unfavoriting and on the favorites page, remove from UI immediately
      if (!isFavorite && showFavoritesOnly) {
        // Remove from current state immediately
        setProjects((prev) => (prev ?? projects).filter((p) => p.id !== id));

        // Force a refresh of the projects list
        if (handleProjectDeleted) {
          await handleProjectDeleted(id);
        }

        toast.success("Removed from favorites");
        return;
      }

      // For all other cases, update the project in the current state
      const updatedProject = projects.find((p) => p.id === id);
      if (updatedProject) {
        const currentFavorites = Number(updatedProject.total_favorites || 0);
        const newFavorites = isFavorite
          ? currentFavorites + 1
          : Math.max(0, currentFavorites - 1);
        const projectWithUpdatedFavorite = {
          ...updatedProject,
          isFavorite,
          total_favorites: newFavorites.toString(),
        };

        // Update local state immediately for optimistic UI
        // This preserves the current sort order (favorite actions shouldn't change "recently edited" order)
        setProjects((prev) =>
          (prev ?? projects).map((project) =>
            project.id === id ? projectWithUpdatedFavorite : project
          )
        );

        // Invalidate all project caches so other pages (favorites, community, portfolio) get fresh data
        // The current page keeps its local state, so sort order is preserved
        invalidateProjectsCache();
      }

      toast.success(
        isFavorite ? "Added to favorites" : "Removed from favorites"
      );
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("Failed to update favorite status");
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

  const handleProjectDeletion = useCallback(
    (projectId: string, isPermanent: boolean = false) => {
      if (!isPermanent) {
        const project = projects?.find((p) => p.id === projectId);
        if (project) {
          setProjectToDelete(project);
          setShowDeleteDialog(true);
        }
      } else {
        if (handleProjectDeleted) {
          handleProjectDeleted(projectId);
        }
      }
    },
    [projects, handleProjectDeleted]
  );

  const handleUpdateProject = useCallback(
    (project: Project) => {
      router.push(`/projects/${project.slug}?edit=true`);
    },
    [router]
  );

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

      // Remove from current state immediately
      setProjects((prev) => (prev ?? projects).filter((p) => p.id !== projectToDelete.id));

      // Call the context handler to ensure global state is updated
      if (handleProjectDeleted) {
        await handleProjectDeleted(projectToDelete.id);
      }

      toast.success("Project sent to graveyard");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("An error occurred while deleting the project");
    } finally {
      setDeletingProjectId(null);
      setProjectToDelete(null);
    }
  }, [projectToDelete, handleProjectDeleted, userId, setProjects]);

  // Category change handler with proper typing
  const handleCategoryChange = useCallback(
    (category: ProjectCategory | "all") => {
      // Store the current scroll position and container height
      const scrollPosition = window.scrollY;
      const container = document.querySelector(".projects-container");
      const containerHeight = container?.getBoundingClientRect().height;

      // Apply the container height to prevent content shift
      if (container && containerHeight) {
        (container as HTMLElement).style.minHeight = `${containerHeight}px`;
      }

      // Create a completely new filter state object preserving existing filters
      const newFilters = {
        ...filters,
        category,
        page: 1,
        showMyProjects: showUserProjectsOnly,
        showFavorites: showFavoritesOnly,
        showDeleted: showDeletedOnly,
      };

      // Set the complete new state
      setFilters(newFilters);

      // Ensure parent components are notified of page change
      if (onPageChange) {
        onPageChange(1);
      }

      // Restore scroll position after content update
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: "instant",
        });

        // Reset the container height after the content has updated
        if (container) {
          setTimeout(() => {
            (container as HTMLElement).style.minHeight = "";
          }, 100);
        }
      });
    },
    [
      filters,
      setFilters,
      showUserProjectsOnly,
      showFavoritesOnly,
      showDeletedOnly,
      onPageChange,
    ]
  );

  // Sort change handler with proper typing
  const handleSortChange = useCallback(
    (sortBy: string) => {
      const newFilters: Partial<ProjectFilters> = { sortBy, page: 1 };
      setFilters(newFilters);

      if (onPageChange) {
        onPageChange(1);
      }
    },
    [setFilters, onPageChange]
  );

  // Show projects even when not authenticated if allowAnonymousView is true
  if (!isAuthenticated && !allowAnonymousView) {
    return (
      <div className="h-[500px] flex items-center justify-center text-center flex-col gap-4">
        <Image
          src="/images/mascot.png"
          alt="code details mascot"
          width={128}
          height={128}
        />
        <p>Please sign in to view projects 🔐</p>
        <SignInButtonComponent
          text="Sign In"
          useTypingEffect={false}
          variant="plain"
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    // Don't show skeleton until layout is ready to avoid width calculation issues
    if (!layoutReady) {
      return null;
    }
    return <ProjectListLoadingState />;
  }

  return (
    <div className="flex flex-col py-6 sm:py-10 sm:-mt-10">
      {/* Controls Section */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Left side buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Create Project Button - only show for authenticated users */}
            {!showDeletedOnly && userId && (
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push("/projects/new")}
                className="w-full sm:w-auto hover:bg-primary/90 cursor-pointer"
              >
                <Plus size={16} className="mr-2" />
                Create Project
              </Button>
            )}
            {/* Share Projects Button - only show for authenticated users */}
            {userId && showUserProjectsOnly && (
              <ShareProjectsButton userId={userId} />
            )}
          </div>

          {/* Right side controls */}
          {showSortingFilters && (
            <div className="flex flex-col w-full sm:w-auto sm:flex-row items-center justify-center sm:justify-end gap-3">
              {/* Sort Controls */}
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently-edited">Recently Edited</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter - only show if not hidden */}
              {!hideCategoryFilter && (
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    handleCategoryChange(value as ProjectCategory | "all")
                  }
                >
                  <SelectTrigger className="w-full sm:w-auto">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(PROJECT_CATEGORIES).map(
                      ([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* View Mode Toggle */}
              <div className="hidden md:flex rounded-md">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  className="rounded-r-none cursor-pointer"
                  onClick={() => setViewMode("card")}
                  size="sm"
                >
                  <GridIcon className="h-4 w-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  className="rounded-l-none cursor-pointer"
                  onClick={() => setViewMode("table")}
                  size="sm"
                >
                  <TableIcon className="h-4 w-4 mr-1" />
                  Table
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Display */}
      {projects.length === 0 ? (
        <>
          <CodeParticlesElement
            quantity={"medium"}
            speed={"fast"}
            size={"large"}
            containerClassName={"w-full h-[800px] relative top-0 "}
            includeEmojis={true}
            includeSymbols={true}
            includeKeywords={true}
            depth="layered"
            opacityRange={[0.1, 0.3]}
            lightModeOpacityRange={[0.1, 0.4]}
          />
          <div
            className={`aboslute flex items-center justify-center text-center flex-col `}
          >
            <div className="absolute w-[800px] h-[800px] flex items-center justify-center px-4">
              <Image
                src="/images/mascot.png"
                alt="code details mascot"
                className="absolute -top-55"
                width={300}
                height={300}
              />
            </div>
            <div className="text-2xl font-bold text-primary/90 dark:text-primary/80 -mt-90 px-2 border-1 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
              {showDeletedOnly
                ? "The Project Graveyard is Empty! 🪦"
                : showFavoritesOnly
                ? "Your Collection Awaits! ⭐"
                : showUserProjectsOnly
                ? "Time to Showcase Your Genius! 🚀"
                : "It's your time to shine! 💫"}

              <p className="text-xl font-medium text-muted-foreground dark:text-muted-foreground/90">
                {showDeletedOnly
                  ? "Looks like all projects are alive and kicking!"
                  : showFavoritesOnly
                  ? "Start exploring and mark your favorite projects"
                  : showUserProjectsOnly
                  ? "Share your coding adventures with the community"
                  : "Be the creator and let the world see your brilliance!"}
              </p>
            </div>
            {filter?.userId === userId && !showDeletedOnly && (
              <Button variant="default" onClick={() => setShowAddForm(true)}>
                Create Your First Project or Keep Exploring
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {viewMode === "card" || isMobile ? (
            <ProjectCardView
              projects={projects}
              onViewDetails={handleViewDetails}
              onToggleFavorite={handleToggleFavorite}
              onDeleteProject={handleProjectDeletion}
              onUpdateProject={handleUpdateProject}
            />
          ) : (
            <div className="hidden md:block">
              <ProjectTableView
                projects={projects}
                onToggleFavorite={handleToggleFavorite}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleProjectDeletion}
              />
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-4">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-[900px] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to share with the community.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onProjectAdded={(newProject) => {
              // Close the modal
              setShowAddForm(false);
              // Call the context handler to update the project list
              contextHandleProjectAdded(newProject);
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        project={projectToDelete}
        isDeleting={Boolean(deletingProjectId)}
      />

      <UnfavoriteConfirmationModal
        project={unfavoritingProject}
        isOpen={showUnfavoriteModal}
        onClose={() => {
          setShowUnfavoriteModal(false);
          setUnfavoritingProject(null);
        }}
        onConfirm={handleUnfavoriteConfirm}
        isUnfavoriting={isUnfavoriting}
      />
    </div>
  );
});
