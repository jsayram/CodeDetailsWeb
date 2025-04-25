"use client";

import React from "react";
import { Project } from "@/types/models/project";
import { ProjectCard } from "./ProjectCardComponent";
import { CARD_HEIGHT, GRID_COLUMNS, GRID_GAP } from "@/components/navigation/Pagination/paginationConstants";

interface ProjectCardViewProps {
  projects: Project[];
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
}

export function ProjectCardView({
  projects,
  onViewDetails,
  onToggleFavorite,
  onDeleteProject,
  onUpdateProject,
}: ProjectCardViewProps) {
  // Calculate rows needed based on number of projects
  const rows = Math.ceil(projects.length / GRID_COLUMNS);
  // Calculate minHeight for the container
  const minHeight = rows * CARD_HEIGHT + (rows - 1) * GRID_GAP;

  return (
    <div className="w-full" style={{ minHeight: `${minHeight}px` }}>
      <div className="project-grid gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onViewDetails={onViewDetails}
            onToggleFavorite={onToggleFavorite}
            onDeleteProject={onDeleteProject}
            onUpdateProject={onUpdateProject}
            isFavorite={project.isFavorite}
          />
        ))}
      </div>
    </div>
  );
}