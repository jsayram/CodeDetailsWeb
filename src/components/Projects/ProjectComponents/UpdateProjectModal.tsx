"use client";

import React, { useEffect, useState } from "react";
import { Project } from "@/types/models/project";
import { useIsBrowser } from "@/hooks/use-is-browser";
import { useProjects } from "@/providers/projects-provider";
import { useTagCache } from "@/hooks/use-tag-cache";

// Component imports
import { ProjectFormBase } from "./ProjectFormBase";

// shadcn/ui imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UpdateProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export function UpdateProjectModal({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}: UpdateProjectModalProps) {
  // Get isBrowser flag for cache operations
  const isBrowser = useIsBrowser();
  
  // Access the projects context to ensure global state updates
  const { handleProjectUpdated: contextUpdateProject } = useProjects();
  
  // Create a local copy of the project to avoid reference issues
  const [localProject, setLocalProject] = useState<Project | null>(null);
  
  // Access tag cache hook
  const { refreshCache } = useTagCache();

  // Update local state when project prop changes
  useEffect(() => {
    if (project) {
      // Create a deep copy to avoid reference issues
      setLocalProject(JSON.parse(JSON.stringify(project)));
    }
  }, [project, isOpen]);

  // Refresh tag cache when modal is opened
  useEffect(() => {
    if (isOpen) {
      refreshCache();
    }
  }, [isOpen, refreshCache]);

  // Handle successful project update
  const handleProjectUpdated = (updatedProject: Project) => {
    // Update the project in the global context
    contextUpdateProject(updatedProject);
    
    // Call the callback if provided
    if (onProjectUpdated) {
      onProjectUpdated(updatedProject);
    }
    
    // Close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Update Project</DialogTitle>
          <DialogDescription>
            Make changes to the project information below.
          </DialogDescription>
        </DialogHeader>

        <ProjectFormBase
          project={localProject}
          mode="update"
          onSuccess={handleProjectUpdated}
          onCancel={onClose}
          showCancelButton={true}
          submitButtonText="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
