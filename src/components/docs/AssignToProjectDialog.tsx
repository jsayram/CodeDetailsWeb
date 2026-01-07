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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Link2, FolderGit2, FileText, Calendar, Tag } from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '@clerk/nextjs';
import { Project } from '@/types/models/project';
import { API_ROUTES } from '@/constants/api-routes';

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

// Fetcher for user's projects
async function userProjectsFetcher(url: string): Promise<Project[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.data ?? [];
}

export function AssignToProjectDialog({
  open,
  onOpenChange,
  doc,
  allDocs,
  onAssigned,
}: AssignToProjectDialogProps) {
  const { mutate } = useSWRConfig();
  const { userId } = useAuth();
  
  // Fetch ALL of the current user's non-deleted projects when dialog opens
  // Uses the same API_ROUTES helper as the projects portfolio page
  const cacheKey = open && userId 
    ? API_ROUTES.PROJECTS.WITH_FILTERS({
        showAll: false,
        userId: userId,
        limit: 100,
        showDeleted: false,
      })
    : null;
    
  const { data: allUserProjects, isLoading: projectsLoading } = useSWR<Project[]>(
    cacheKey,
    userProjectsFetcher,
    { revalidateOnFocus: false }
  );
  
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

  // Filter out deleted projects (API should already filter, but double-check)
  const userProjects = useMemo(() => {
    if (!allUserProjects) return [];
    return allUserProjects.filter((p) => !p.deleted_at);
  }, [allUserProjects]);

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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Assign to Project
          </DialogTitle>
          <DialogDescription className="text-sm">
            Link your documentation to a project in your portfolio.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {/* Documentation info card */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate" title={doc.projectName}>
                    {doc.projectName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Documentation to be linked
                  </p>
                </div>
              </div>
            </div>

            {/* Current assignment status */}
            {doc.linkedProjectSlug && (
              <Alert className="border-blue-500/30 bg-blue-500/5">
                <FolderGit2 className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-600 dark:text-blue-400">Currently Linked</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  Already linked to{' '}
                  <Badge variant="secondary" className="ml-1 font-medium">
                    {doc.linkedProjectTitle || doc.linkedProjectSlug}
                  </Badge>
                </AlertDescription>
              </Alert>
            )}

            {/* Project selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Select a Project
              </label>
              <Select
                value={selectedProjectId}
                onValueChange={handleSelectProject}
                disabled={projectsLoading || isSubmitting}
              >
                <SelectTrigger className="w-full h-auto min-h-[44px] py-2.5">
                  <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Choose a project from your portfolio...'} />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  <ScrollArea className="max-h-[300px]">
                    {userProjects.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <FolderGit2 className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No projects found
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Create a project in your portfolio first
                        </p>
                      </div>
                    ) : (
                      userProjects.map((project) => {
                        const hasExistingDoc = projectsWithDocs.has(project.slug);
                        const createdDate = project.created_at 
                          ? new Date(project.created_at).toLocaleDateString()
                          : null;
                        return (
                          <SelectItem 
                            key={project.id} 
                            value={project.id}
                            className="py-4 px-3 cursor-pointer border-b border-border/30 last:border-b-0"
                          >
                            <div className="flex items-center gap-3 w-full min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-medium truncate max-w-[280px] block"
                                    title={project.title}
                                  >
                                    {project.title}
                                  </span>
                                  {hasExistingDoc && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0 border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
                                    >
                                      Has Doc
                                    </Badge>
                                  )}
                                </div>
                                {createdDate && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {createdDate}
                                    </span>
                                    {project.category && (
                                      <>
                                        <span className="text-muted-foreground mx-1">•</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                          {project.category}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
              
              {/* Project count indicator */}
              {userProjects.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {userProjects.length} project{userProjects.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            {/* Warning when selecting a project that already has a doc */}
            {selectedProjectHasDoc && !showReplaceConfirm && (
              <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-600 dark:text-yellow-400">
                  Project Already Has Documentation
                </AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                  <span className="font-medium">&quot;{selectedProject?.title}&quot;</span> already has{' '}
                  <span className="font-medium">&quot;{selectedProjectHasDoc.docName}&quot;</span> linked.
                  <br />
                  <span className="text-xs opacity-80">Assigning will replace the existing documentation.</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Replacement confirmation */}
            {showReplaceConfirm && existingDocInfo && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confirm Replacement</AlertTitle>
                <AlertDescription className="text-sm">
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
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 border-t">
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
