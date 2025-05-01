"use client";

import React from "react";
import { Project } from "@/types/models/project";
import { ProjectCategory } from "@/constants/project-categories";
import { ProjectCard } from "./ProjectCardComponent";
import {
  CARD_HEIGHT,
  GRID_COLUMNS,
  GRID_GAP,
} from "@/components/navigation/Pagination/paginationConstants";

interface ProjectCardViewProps {
  projects: Project[];
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
  hideActions?: boolean;
}

export function ProjectCardView({
  projects,
  onViewDetails,
  onToggleFavorite,
  onDeleteProject,
  onUpdateProject,
  hideActions = false,
}: ProjectCardViewProps) {
  // Log if projects array is undefined
  if (!projects) {
    console.error("ProjectCardView: Projects array is undefined", {
      onViewDetails: !!onViewDetails,
      onToggleFavorite: !!onToggleFavorite,
      onDeleteProject: !!onDeleteProject,
      onUpdateProject: !!onUpdateProject,
      hideActions,
    });
    return null;
  }

  // Normalize project data and filter out invalid projects
  const validProjects = projects
    .filter((projectData) => {
      if (!projectData) {
        console.error(
          "ProjectCardView: Encountered undefined project in projects array"
        );
        return false;
      }

      // Check if this is a nested project structure
      const projectDetails = projectData.project || projectData;
      if (!projectDetails?.id) {
        console.error("ProjectCardView: Project is missing ID", projectData);
        return false;
      }
      return true;
    })
    .map((projectData) => {
      // If the project is nested (comes from API), flatten it
      if (projectData.project) {
        return {
          ...projectData.project,
          profile: projectData.profile,
          tags: projectData.tags || [],
          category: projectData.project.category as ProjectCategory,
          isFavorite: false, // Default to false for nested structure
        };
      }
      // If it's already flat, just ensure tags exist and category is properly typed
      return {
        ...projectData,
        tags: projectData.tags || [],
        category: projectData.category as ProjectCategory,
        isFavorite: projectData.isFavorite || false,
      };
    });

  // Calculate rows needed based on number of projects
  const rows = Math.ceil(validProjects.length / GRID_COLUMNS);
  // Calculate minHeight for the container
  const minHeight = rows * CARD_HEIGHT + (rows - 1) * GRID_GAP;

  return (
    <div className="w-full" style={{ minHeight: `${minHeight}px` }}>
      <div className="project-grid gap-4">
        {validProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onViewDetails={onViewDetails}
            onToggleFavorite={onToggleFavorite}
            onDeleteProject={onDeleteProject}
            onUpdateProject={onUpdateProject}
            isFavorite={project.isFavorite}
            hideActions={hideActions}
          />
        ))}
      </div>
    </div>
  );
}
