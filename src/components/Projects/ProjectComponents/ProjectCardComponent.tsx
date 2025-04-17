"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Project } from "@/types/models/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Trash2, Edit, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string) => void;
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
    // Get the current user to check if the project belongs to them
    const { user } = useUser();
    
    // Prevent event bubbling for interactive elements inside the card
    const handleChildClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // Handle delete button click - simply call the parent's handler
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDeleteProject) {
        onDeleteProject(project.id);
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
          className="project-card card-container overflow-hidden w-full transition-all duration-200 hover:shadow-md relative cursor-pointer group"
          onClick={() => onViewDetails?.(project.id)}
        >
          {/* Favorite button (absolutely positioned) */}
          <button
            className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm
                    hover:bg-background text-muted-foreground hover:text-accent transition-colors 
                    opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(project.id, !isFavorite);
            }}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              size={16}
              className={isFavorite ? "fill-red-500 text-red-500" : ""}
            />
          </button>

          {/* Delete button (absolutely positioned) */}
          {onDeleteProject && (
            <button
              className="absolute top-2 right-12 p-2 rounded-full bg-background/80 backdrop-blur-sm
                      hover:bg-background text-muted-foreground hover:text-red-500 transition-colors 
                      opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              onClick={handleDeleteClick}
              aria-label="Delete project"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Update button (absolutely positioned) */}
          {onUpdateProject && (
            <button
              className="absolute top-2 right-20 p-2 rounded-full bg-background/80 backdrop-blur-sm
                      hover:bg-background text-muted-foreground hover:text-blue-500 transition-colors 
                      opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateProject?.(project);
              }}
              aria-label="Update project"
            >
              <Edit size={16} />
            </button>
          )}

          {/* Content area */}
          <div className="card-content p-3 sm:p-5 flex flex-col flex-grow">
            {/* Project title and description */}
            <h3 className="card-title text-base sm:text-lg font-semibold mb-2 line-clamp-2">
              {project.title}
            </h3>
            <p className="card-description line-clamp-3 text-xs sm:text-sm text-muted-foreground flex-grow mb-3">
              {project.description}
            </p>

            {/* Tags (show if available) */}
            {tags.length > 0 && (
              <div className="mt-auto mb-2">
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 2).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      onClick={handleChildClick}
                      className="badge text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 2 && (
                    <Badge
                      variant="outline"
                      onClick={handleChildClick}
                      className="badge text-xs"
                    >
                      +{tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Project metadata */}
            <div className="mt-auto flex items-center justify-between">
              <Badge
                variant="secondary"
                className="badge capitalize bg-gray-100 text-gray-800"
                onClick={handleChildClick}
              >
                {project.difficulty}
              </Badge>

              {project.slug && (
                <a
                  href={project.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                  onClick={handleChildClick}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Fixed height footer TODO:PROFILE IMAGE URL RERENDER CLEARING OUT THE IMAGE ON THE PROJECT */} 
          <div className="card-footer h-auto sm:h-[50px] bg-secondary/10 p-2 sm:p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7">
                {project.owner_profile_image_url ? (
                  <AvatarImage src={project.owner_profile_image_url} alt={displayUsername} />
                ) : (
                  <AvatarFallback>
                    <User size={12} />
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs truncate max-w-[120px]" title={displayUsername}>
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
      prevProps.project.difficulty === nextProps.project.difficulty
    );
  }
);
