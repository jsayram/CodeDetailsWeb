import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

export function ProjectCard({
  project,
  onViewDetails,
  onToggleFavorite,
  isFavorite = false,
}: ProjectCardProps) {
  // Prevent event bubbling for interactive elements inside the card
  const handleChildClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
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
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={16}
          className={isFavorite ? "fill-red-500 text-red-500" : ""}
        />
      </button>

      {/* Content area */}
      <div className="card-content p-3 sm:p-5 flex flex-col flex-grow">
        <h3 className="card-title text-base sm:text-lg font-semibold mb-2 line-clamp-2">
          {project.title}
        </h3>
        <p className="card-description line-clamp-3 text-xs sm:text-sm text-muted-foreground flex-grow mb-3">
          {project.description}
        </p>

        {/* Tags (show if available) */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-auto mb-2">
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 2).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  onClick={handleChildClick}
                  className="badge text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]"
                >
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 2 && (
                <Badge
                  variant="outline"
                  onClick={handleChildClick}
                  className="badge text-xs"
                >
                  +{project.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Project metadata */}
        <div className="mt-auto flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`badge capitalize ${
              project.tier === "free"
                ? "bg-green-100 text-green-800"
                : project.tier === "pro"
                ? "bg-blue-100 text-blue-800"
                : project.tier === "diamond"
                ? "bg-purple-100 text-purple-800"
                : ""
            }`}
            onClick={handleChildClick}
          >
            {project.tier}
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

      {/* Fixed height footer */}
      <div className="card-footer h-auto sm:h-[50px] bg-secondary/10 p-2 sm:p-3 flex justify-between items-center">
        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
          {project.difficulty}
        </span>

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
  );
}
