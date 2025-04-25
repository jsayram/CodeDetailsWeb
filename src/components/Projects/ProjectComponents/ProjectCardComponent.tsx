"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Project } from "@/types/models/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Trash2, Edit, User, Undo2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth } from "@clerk/nextjs";
import { permanentlyDeleteProject, restoreProject } from "@/app/actions/projects";
import { toast } from "sonner";
import { PermanentDeleteConfirmationModal } from "./PermanentDeleteConfirmationModal";
import { RestoreProjectConfirmationModal } from "./RestoreProjectConfirmationModal";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";

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
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    // Prevent event bubbling for interactive elements inside the card
    const handleChildClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // Handle permanent deletion
    const handlePermanentDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPermanentDeleteModal(true);
    };

    const handlePermanentDeleteConfirm = async () => {
      if (!userId) return;
      setIsDeleting(true);
      
      try {
        const result = await permanentlyDeleteProject(project.id, userId);
        setShowPermanentDeleteModal(false);
        
        if (result.success) {
          toast.success('Project permanently deleted');
          if (onDeleteProject) {
            onDeleteProject(project.id, true); // Pass true to indicate permanent deletion
          }
        } else {
          toast.error(result.error || 'Failed to delete project permanently');
        }
      } catch (error) {
        console.error('Error permanently deleting project:', error);
        toast.error('An error occurred while deleting the project');
      } finally {
        setIsDeleting(false);
      }
    };

    // Handle restoration
    const handleRestore = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRestoreModal(true);
    };

    const handleRestoreConfirm = async () => {
      if (!userId) return;
      setIsRestoring(true);
      
      try {
        const result = await restoreProject(project.id, userId);
        setShowRestoreModal(false);
        
        if (result.success) {
          toast.success('Project restored successfully');
          if (onDeleteProject) {
            onDeleteProject(project.id, true); // Pass true to skip the graveyard dialog
          }
        } else {
          toast.error(result.error || 'Failed to restore project');
        }
      } catch (error) {
        console.error('Error restoring project:', error);
        toast.error('An error occurred while restoring the project');
      } finally {
        setIsRestoring(false);
      }
    };

    // Handle delete button click - check if it's a permanent delete
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDeleteProject) {
        // Call delete handler without the permanent delete flag
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
      return project.owner_username || "Unknown user";
    }, [isCurrentUserProject, project.owner_username]);

    return (
      <>
        <Card
          className={`project-card card-container overflow-hidden w-full transition-all duration-200 hover:shadow-md relative cursor-pointer group
            ${project.deleted_at ? 'bg-gray-950/80 border-red-900/30 hover:border-red-800/50 shadow-red-900/5' : ''}`}
          onClick={() => onViewDetails?.(project.id)}
        >
          {/* Only show favorite button for non-deleted projects */}
          {!project.deleted_at && (
            <button
              className="absolute top-2 right-2 p-3 sm:p-2 rounded-full bg-background/80 backdrop-blur-sm
                      hover:bg-background text-muted-foreground hover:text-accent transition-colors 
                      opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(project.id, !isFavorite);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={18}
                className={isFavorite ? "fill-red-500 text-red-500" : ""}
              />
            </button>
          )}

          {/* Show different action buttons based on deleted status */}
          {project.deleted_at ? (
            // Deleted project actions
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 rounded-full bg-green-950/80 hover:bg-green-900 text-green-500 hover:text-green-400
                        opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                onClick={handleRestore}
                aria-label="Restore project"
              >
                <Undo2 size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-14 rounded-full bg-red-950/80 hover:bg-red-900 text-red-500 hover:text-red-400
                        opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                onClick={handlePermanentDelete}
                aria-label="Permanently delete project"
              >
                <Trash2 size={18} />
              </Button>
            </>
          ) : (
            // Non-deleted project actions
            <>
              {onDeleteProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-14 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500
                          opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  onClick={handleDeleteClick}
                  aria-label="Delete project"
                >
                  <Trash2 size={18} />
                </Button>
              )}

              {onUpdateProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-26 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-blue-500
                          opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProject?.(project);
                  }}
                  aria-label="Update project"
                >
                  <Edit size={18} />
                </Button>
              )}
            </>
          )}

          {/* Content area */}
          <div className="card-content p-3 mt-5 sm:p-5 flex flex-col flex-grow">
            {/* Project title and description */}
            <h3 className={`card-title text-base sm:text-lg font-semibold mb-2 line-clamp-2 ${project.deleted_at ? 'text-red-200/70' : ''}`}>
              {project.title}
              {project.deleted_at && (
                <span className="ml-2 inline-flex items-center text-xs font-normal text-red-500/70">
                  <Trash2 className="w-3 h-3 mr-1" /> Deleted
                </span>
              )}
            </h3>
            <p className={`card-description line-clamp-2 text-xs sm:text-sm text-muted-foreground flex-grow mb-3 ${project.deleted_at ? 'text-red-400/40' : ''}`}>
              {project.description && project.description.length > 120 
                ? `${project.description.substring(0, 120)}...` 
                : project.description || "No description provided"}
            </p>

            {/* Tags (show if available) */}
            {tags.length > 0 && (
              <div className="mt-auto mb-2">
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      variant={project.deleted_at ? "destructive" : "outline"}
                      onClick={handleChildClick}
                      className={`badge text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] ${project.deleted_at ? 'bg-red-950/40 text-red-200/70 hover:bg-red-900/30' : ''}`}
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge
                      variant={project.deleted_at ? "destructive" : "outline"}
                      onClick={handleChildClick}
                      className={`badge text-xs ${project.deleted_at ? 'bg-red-950/40 text-red-200/70 hover:bg-red-900/30' : ''}`}
                    >
                      +{tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Project metadata */}
            <div className="mt-auto flex items-center justify-between">
              <Badge
                variant={project.deleted_at ? "destructive" : "secondary"}
                className={`badge capitalize bg-gray-100 text-gray-800 ${project.deleted_at ? 'bg-red-950/40 text-red-200/70' : ''}`}
                onClick={handleChildClick}
              >
                {PROJECT_CATEGORIES[project.category]?.label || project.category}
              </Badge>

              {project.slug && (
                <a
                  href={project.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground ${project.deleted_at ? 'text-red-400/50' : ''}`}
                  onClick={handleChildClick}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Fixed height footer //TODO: PROFILE IMAGE URL RERENDER CLEARING OUT THE IMAGE ON THE PROJECT */}
          <div className="card-footer h-auto sm:h-[50px] bg-secondary/10 p-2 sm:p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7">
                {project.owner_profile_image_url ? (
                  <AvatarImage
                    src={project.owner_profile_image_url}
                    alt={displayUsername}
                  />
                ) : (
                  <AvatarFallback>
                    <User size={12} />
                  </AvatarFallback>
                )}
              </Avatar>
              <span
                className={`text-xs truncate max-w-[120px] ${project.deleted_at ? 'text-red-400/50' : ''}`}
                title={displayUsername}
              >
                {displayUsername}
              </span>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleChildClick}
              className="card-button text-xs sm:text-sm px-2 sm:px-3 h-8"
            >
              View Details
            </Button>
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
