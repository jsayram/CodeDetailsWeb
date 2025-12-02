'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Link2, FolderGit2 } from 'lucide-react';
import { useProjects } from '@/providers/projects-provider';
import { useSWRConfig } from 'swr';

interface DocInfo {
  slug: string;
  projectName: string;
  linkedProjectSlug?: string | null;
  linkedProjectTitle?: string | null;
}

interface AssignToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: DocInfo;
  allDocs: DocInfo[];
  onAssigned: (projectSlug: string, projectTitle: string) => void;
}

export function AssignToProjectDialog({
  open,
  onOpenChange,
  doc,
  allDocs,
  onAssigned,
}: AssignToProjectDialogProps) {
  const { projects, loading: projectsLoading } = useProjects();
  const { mutate } = useSWRConfig();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [existingDocInfo, setExistingDocInfo] = useState<{
    docSlug: string;
    docName: string;
  } | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProjectId('');
      setError(null);
      setShowReplaceConfirm(false);
      setExistingDocInfo(null);
    }
  }, [open]);

  // Filter out deleted projects and get user's projects
  const userProjects = useMemo(() => {
    return projects.filter((p) => !p.deleted_at);
  }, [projects]);

  // Build a map of which projects already have docs linked
  const projectsWithDocs = useMemo(() => {
    const map = new Map<string, { docSlug: string; docName: string }>();
    for (const d of allDocs) {
      if (d.linkedProjectSlug && d.slug !== doc.slug) {
        map.set(d.linkedProjectSlug, {
          docSlug: d.slug,
          docName: d.projectName,
        });
      }
    }
    return map;
  }, [allDocs, doc.slug]);

  // Get the selected project info
  const selectedProject = useMemo(() => {
    return userProjects.find((p) => p.id === selectedProjectId);
  }, [userProjects, selectedProjectId]);

  // Check if selected project already has a doc
  const selectedProjectHasDoc = useMemo(() => {
    if (!selectedProject) return null;
    return projectsWithDocs.get(selectedProject.slug) || null;
  }, [selectedProject, projectsWithDocs]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowReplaceConfirm(false);
    setExistingDocInfo(null);
    setError(null);
  };

  const handleAssign = async (replace: boolean = false) => {
    if (!selectedProject) return;

    // If project has a doc and user hasn't confirmed replacement
    if (selectedProjectHasDoc && !replace) {
      setShowReplaceConfirm(true);
      setExistingDocInfo(selectedProjectHasDoc);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/docs/${doc.slug}/link-project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          projectSlug: selectedProject.slug,
          projectTitle: selectedProject.title,
          replace: replace,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle RFC 7807 error response
        const errorDetail = data.error?.detail || data.error?.title || 'Failed to assign project';
        throw new Error(errorDetail);
      }

      // Invalidate SWR caches
      mutate('/api/docs');
      mutate(`/api/projects/slug/${selectedProject.slug}/linked-doc`);
      
      // If we replaced a doc from another project, invalidate that too
      if (data.data?.replacedDoc) {
        mutate(`/api/docs/${data.data.replacedDoc}`);
      }

      // Notify parent and close
      onAssigned(selectedProject.slug, selectedProject.title);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign documentation to project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Assign to Project
          </DialogTitle>
          <DialogDescription>
            Link &quot;{doc.projectName}&quot; documentation to one of your projects.
            This will display it on your project&apos;s page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current assignment status */}
          {doc.linkedProjectSlug && (
            <Alert>
              <FolderGit2 className="h-4 w-4" />
              <AlertTitle>Currently Linked</AlertTitle>
              <AlertDescription>
                This documentation is currently linked to{' '}
                <Badge variant="secondary" className="ml-1">
                  {doc.linkedProjectTitle || doc.linkedProjectSlug}
                </Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Project selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select a Project</label>
            <Select
              value={selectedProjectId}
              onValueChange={handleSelectProject}
              disabled={projectsLoading || isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Choose a project...'} />
              </SelectTrigger>
              <SelectContent>
                {userProjects.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No projects found. Create a project first.
                  </div>
                ) : (
                  userProjects.map((project) => {
                    const hasExistingDoc = projectsWithDocs.has(project.slug);
                    return (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span>{project.title}</span>
                          {hasExistingDoc && (
                            <Badge variant="outline" className="text-xs">
                              Has Doc
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Warning when selecting a project that already has a doc */}
          {selectedProjectHasDoc && !showReplaceConfirm && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-600 dark:text-yellow-400">
                Project Already Has Documentation
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                &quot;{selectedProject?.title}&quot; already has &quot;{selectedProjectHasDoc.docName}&quot; linked.
                Assigning will replace the existing documentation.
              </AlertDescription>
            </Alert>
          )}

          {/* Replacement confirmation */}
          {showReplaceConfirm && existingDocInfo && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirm Replacement</AlertTitle>
              <AlertDescription>
                This will unlink &quot;{existingDocInfo.docName}&quot; from &quot;{selectedProject?.title}&quot; and replace it with &quot;{doc.projectName}&quot;.
                <br />
                <span className="text-xs opacity-80">
                  The previous documentation will not be deleted, just unlinked.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          {showReplaceConfirm ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplaceConfirm(false);
                  setExistingDocInfo(null);
                }}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAssign(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  'Replace & Assign'
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => handleAssign(false)}
              disabled={!selectedProjectId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Assign to Project
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
