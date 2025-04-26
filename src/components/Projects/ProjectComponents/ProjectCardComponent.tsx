"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Project } from "@/types/models/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Trash2, Edit, User, Undo2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  permanentlyDeleteProject,
  restoreProject,
} from "@/app/actions/projects";
import { toast } from "sonner";
import { PermanentDeleteConfirmationModal } from "./PermanentDeleteConfirmationModal";
import { RestoreProjectConfirmationModal } from "./RestoreProjectConfirmationModal";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { getInitials } from "@/utils/stringUtils";

const categoryColors = {
  web: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
  mobile: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
  desktop: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50",
  backend: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
  "cloud-devops": "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50",
  "data-engineering": "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",
  "ai-ml": "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
  "dev-tools": "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  integration: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/50",
  "embedded-iot": "bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50",
  "gaming-graphics": "bg-fuchsia-100 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/50"
};

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
  isFavorite?: boolean;
}

export const ProjectCard = React.memo(
  function ProjectCard({
    project,
    onViewDetails,
    onToggleFavorite,
    onDeleteProject,
    onUpdateProject,
    isFavorite = false,
  }: ProjectCardProps) {
    const { user } = useUser();
    const { userId } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);

    // Check if current user is the owner
    const isOwner = project.user_id === userId;

    // Prevent event bubbling for interactive elements inside the card
    const handleChildClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // Handle permanent deletion
    const handlePermanentDelete = async (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      setShowPermanentDeleteModal(true);
    };

    const handlePermanentDeleteConfirm = async () => {
      if (!userId || !isOwner) return;
      setIsDeleting(true);

      try {
        const result = await permanentlyDeleteProject(project.id, userId);
        setShowPermanentDeleteModal(false);

        if (result.success) {
          toast.success("Project permanently deleted");
          if (onDeleteProject) {
            onDeleteProject(project.id, true);
          }
        } else {
          toast.error(result.error || "Failed to delete project permanently");
        }
      } catch (error) {
        console.error("Error permanently deleting project:", error);
        toast.error("An error occurred while deleting the project");
      } finally {
        setIsDeleting(false);
      }
    };

    // Handle restoration
    const handleRestore = async (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      setShowRestoreModal(true);
    };

    const handleRestoreConfirm = async () => {
      if (!userId || !isOwner) return;
      setIsRestoring(true);

      try {
        const result = await restoreProject(project.id, userId);
        setShowRestoreModal(false);

        if (result.success) {
          toast.success("Project restored successfully");
          if (onDeleteProject) {
            onDeleteProject(project.id, true);
          }
        } else {
          toast.error(result.error || "Failed to restore project");
        }
      } catch (error) {
        console.error("Error restoring project:", error);
        toast.error("An error occurred while restoring the project");
      } finally {
        setIsRestoring(false);
      }
    };

    // Handle delete button click
    const handleDeleteClick = (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      if (onDeleteProject) {
        onDeleteProject(project.id, false);
      }
    };

    // Safely handle tags array (could be undefined or null after migration)
    const tags = useMemo(() => {
      return project.tags || [];
    }, [project.tags]);

    // Check if the current user is the project owner
    const isCurrentUserProject = useMemo(() => {
      return user?.id === project.user_id;
    }, [user?.id, project.user_id]);

    // Display username logic
    const displayUsername = useMemo(() => {
      if (isCurrentUserProject) {
        return "Your Project";
      }
      
      // First try full name
      if (project.profile?.full_name) {
        return project.profile.full_name;
      }
      
      // Then try to combine first and last name if either exists
      if (project.profile?.first_name || project.profile?.last_name) {
        return [project.profile.first_name, project.profile.last_name]
          .filter(Boolean)  // Remove null/undefined values
          .join(" ")
          .trim();
      }
      
      // Fall back to username or email
      return project.profile?.username?.split("@")[0] ||
             project.profile?.email_address?.split("@")[0] ||
             "Unknown user";
    }, [isCurrentUserProject, project.profile]);

    // Get initials for the avatar fallback
    const userInitials = useMemo(() => {
      // Try to get initials from full name first, then username, then email
      const nameForInitials =
      project.profile?.full_name ||
      project.profile?.username?.split("@")[0] ||
      project.profile?.email_address?.split("@")[0] ||
        "??";
      return getInitials(nameForInitials);
    }, [project.profile]);

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.stopPropagation();
      window.location.href = `/tags/${encodeURIComponent(tag)}`;
    };

    const handleTagExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowAllTags(true);
    };

    const handleCategoryClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `/category/${encodeURIComponent(project.category)}`;
    };

    const handleCardClick = () => {
      router.push(`/projects/${project.slug}`);
    };

    return (
      <>
        <Card
          className={`group relative overflow-hidden w-full transition-all duration-200 project-card cursor-pointer hover:scale-[1.02]
            ${project.deleted_at ? "deleted" : ""}`}
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start px-4 -mt-1 absolute w-full">
            {/* Category Badge */}
            <div className={`category-badge category-${project.category}`}>
              <Badge
                variant={project.deleted_at ? "destructive" : "secondary"}
                className="capitalize text-sm cursor-pointer hover:bg-accent"
                onClick={handleCategoryClick}
              >
                {PROJECT_CATEGORIES[project.category]?.label || project.category}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex items-center ">
              {!project.deleted_at ? (
                <>
                  {isOwner && (
                    <div className="action-buttons-group">
                      {onUpdateProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="action-button hover:text-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateProject?.(project);
                          }}
                          aria-label="Update project"
                        >
                          <Edit size={20} />
                        </Button>
                      )}
                      {onDeleteProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="action-button hover:text-red-500"
                          onClick={handleDeleteClick}
                          aria-label="Delete project"
                        >
                          <Trash2 size={20} />
                        </Button>
                      )}
                    </div>
                  )}

                  <button
                    className="action-button favorite-button group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(project.id, !isFavorite);
                    }}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      size={20}
                      className={`transition-all duration-300 ${
                        isFavorite 
                          ? "fill-red-500 text-red-500 scale-110 animate-heartPop" 
                          : "text-muted-foreground group-hover:text-red-500"
                      }`}
                    />
                    <span className="favorite-count">{project.total_favorites || 0}</span>
                  </button>
                </>
              ) : (
                isOwner && (
                  <div className="action-buttons-group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="action-button hover:text-green-500"
                      onClick={handleRestore}
                      aria-label="Restore project"
                    >
                      <Undo2 size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="action-button hover:text-red-500"
                      onClick={handlePermanentDelete}
                      aria-label="Permanently delete project"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="card-content mx-2">
            {/* Project title and description */}
            <h3
              className={`text-lg sm:text-xl font-semibold mb-2 line-clamp-2 ${
                project.deleted_at ? "text-white/90" : ""
              }`}
            >
              {project.title}
            </h3>
            
            <div className="min-h-[3rem]">
              <p
                className={`card-description text-xs sm:text-sm ${
                  project.deleted_at ? "text-white/70" : "text-muted-foreground"
                }`}
              >
                {project.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Card footer with extended section for tags */}
          <div className="flex flex-col">
            <div className="card-footer border-t">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  {project.profile?.profile_image_url ? (
                    <AvatarImage
                      src={project.profile.profile_image_url}
                      alt={displayUsername}
                    />
                  ) : (
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {userInitials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span
                  className={`text-xs truncate max-w-[120px] ${
                    project.deleted_at ? "text-red-400/50" : ""
                  }`}
                  title={displayUsername}
                >
                  {displayUsername}
                </span>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/projects/${project.slug}`);
                }}
                className={`card-button ${project.deleted_at ? "bg-[oklch(0.3_0.05_280)] text-[oklch(0.9_0.02_280)] hover:bg-[oklch(0.35_0.05_280)]" : ""}`}
              >
                View Project Details
              </Button>
            </div>

            {/* Tags section below footer with minimum height */}
            <div className="px-6 py-3 border-t bg-muted/5 min-h-[3rem] relative">
              <div className="flex flex-wrap gap-1.5">
                {tags.length > 0 ? (
                  <>
                    {(showAllTags ? tags : tags.slice(0, 3)).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        }`}
                        onClick={(e) => handleTagClick(e, tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {!showAllTags && tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        } hover:bg-accent cursor-pointer`}
                        onClick={handleTagExpandClick}
                      >
                        +{tags.length - 3}
                      </Badge>
                    )}
                    {showAllTags && tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        } hover:bg-accent cursor-pointer ml-auto mt-2`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllTags(false);
                        }}
                      >
                        close tags
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No tags added</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Confirmation Modals */}
        <PermanentDeleteConfirmationModal
          isOpen={showPermanentDeleteModal}
          onClose={() => setShowPermanentDeleteModal(false)}
          onConfirm={handlePermanentDeleteConfirm}
          projectTitle={project.title}
          isDeleting={isDeleting}
        />

        <RestoreProjectConfirmationModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          onConfirm={handleRestoreConfirm}
          projectTitle={project.title}
          isRestoring={isRestoring}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function that only re-renders when necessary props change
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.project.title === nextProps.project.title &&
      prevProps.project.description === nextProps.project.description &&
      prevProps.isFavorite === nextProps.isFavorite &&
      JSON.stringify(prevProps.project.tags || []) ===
        JSON.stringify(nextProps.project.tags || []) &&
      prevProps.project.category === nextProps.project.category
    );
  }
);
