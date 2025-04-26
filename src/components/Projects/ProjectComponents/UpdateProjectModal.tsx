"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Project } from "@/types/models/project";
import { useIsBrowser } from "@/hooks/use-is-browser";
import { useProjects } from "@/providers/projects-provider";
import { useTagCache } from "@/hooks/use-tag-cache";
import { useAuth } from "@clerk/nextjs";

// Component imports
import { ProjectFormBase } from "./ProjectFormBase";

// shadcn/ui imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const isBrowser = useIsBrowser();
  const { handleProjectUpdated: contextUpdateProject } = useProjects();
  const [localProject, setLocalProject] = useState<Project | null>(null);
  const { refreshCache } = useTagCache();
  const { userId } = useAuth();

  // Check if current user is the owner
  const isOwner = project?.user_id === userId;

  // Update local state when project prop changes
  useEffect(() => {
    if (project) {
      setLocalProject(JSON.parse(JSON.stringify(project)));
    }
  }, [project, isOpen]);

  // Refresh data when modal is opened
  useEffect(() => {
    if (isOpen) {
      refreshCache();
      if (project) {
        setLocalProject(JSON.parse(JSON.stringify(project)));
      }
    }
  }, [isOpen, refreshCache, project]);

  // Prevent non-owners from accessing the modal
  useEffect(() => {
    if (isOpen && !isOwner) {
      onClose();
    }
  }, [isOpen, isOwner, onClose]);

  const handleSuccess = useCallback(async () => {
    await refreshCache();
    onClose();
    
    if (localProject) {
      onProjectUpdated?.(localProject);
    }
    
    if (isBrowser && localProject) {
      contextUpdateProject(localProject);
    }
  }, [onClose, onProjectUpdated, isBrowser, localProject, contextUpdateProject, refreshCache]);

  if (!localProject || !isOwner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Project</DialogTitle>
          <DialogDescription>
            Make changes to your project details below.
          </DialogDescription>
        </DialogHeader>
        <ProjectFormBase
          project={localProject}
          mode="update"
          onSuccess={handleSuccess}
          onCancel={onClose}
          submitButtonText="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
