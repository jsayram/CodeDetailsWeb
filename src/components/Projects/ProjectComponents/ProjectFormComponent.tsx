"use client";

import React from "react";
import { Project } from "@/types/models/project";
import { ProjectFormBase } from "./ProjectFormBase";

interface ProjectFormProps {
  onProjectAdded?: (newProject: Project) => void;
  className?: string;
  containerClassName?: string;
  showTitle?: boolean;
}

/**
 * A reusable component for adding new projects.
 * Can be used standalone with the projects provider or with a custom callback.
 */
export function ProjectForm({
  onProjectAdded,
  className = "",
  containerClassName = "border p-4 rounded-lg shadow-md mb-6 ",
  showTitle = true,
}: ProjectFormProps) {
  return (
    <div className={containerClassName}>
      <ProjectFormBase
        mode="create"
        onSuccess={onProjectAdded}
        className={className}
        formTitle={showTitle ? "Add New Project" : undefined}
        submitButtonText="Add Project"
        showCancelButton={false}
      />
    </div>
  );
}
