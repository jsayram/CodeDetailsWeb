"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { useTagCache } from "@/hooks/use-tag-cache";
import { TagSubmissionModal } from "./TagSubmissionModal";
import { useAuth, useUser } from "@clerk/nextjs";
import { useProjects } from "@/providers/projects-provider";
import { SelectTagSubmission } from "@/db/schema/tag_submissions";

interface TagSelectorProps {
  projectId?: string;
  initialTags?: string[];
  onTagsChange?: (tags: TagInfo[]) => void;
  className?: string;
}

export function TagSelector({
  projectId = "new",
  initialTags = [],
  onTagsChange,
  className,
}: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [pendingTags, setPendingTags] = useState<SelectTagSubmission[]>([]);
  const { tags: cachedTags, isLoading: isTagCacheLoading } = useTagCache();
  const isMounted = useRef(false);
  const initialTagsRef = useRef<string[]>(initialTags);
  const { userId } = useAuth();
  const { user } = useUser();
  const { projects } = useProjects();

  // Check if the current user is the owner of the project
  const project = projects?.find(p => p.id === projectId);
  const isOwner = projectId === "new" || project?.user_id === userId;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSearchTags = useCallback(async (query: string): Promise<TagInfo[]> => {
    const searchTerm = query.toLowerCase();
    return cachedTags.filter(tag => tag.name.toLowerCase().includes(searchTerm));
  }, [cachedTags]);

  const handleAddTag = useCallback(async (tagId: string): Promise<void> => {
    if (!isOwner) return;

    const tagToAdd = cachedTags.find(tag => tag.id === tagId);
    if (tagToAdd && !selectedTags.some(t => t.id === tagId)) {
      const updatedTags = [...selectedTags, tagToAdd];
      setSelectedTags(updatedTags);
      onTagsChange?.(updatedTags);
    }
  }, [selectedTags, cachedTags, onTagsChange, isOwner]);

  const handleRemoveTag = useCallback(async (tagId: string): Promise<void> => {
    if (!isOwner) return;

    const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
    setSelectedTags(updatedTags);
    onTagsChange?.(updatedTags);
  }, [selectedTags, onTagsChange, isOwner]);

  // Process initial tags
  useEffect(() => {
    if (!isMounted.current || isTagCacheLoading || 
        JSON.stringify(initialTagsRef.current) === JSON.stringify(initialTags)) {
      return;
    }

    const processInitialTags = async () => {
      const processedTags: TagInfo[] = [];
      const processedTagNames = new Set<string>();
      
      for (const tagName of initialTags) {
        const normalizedTagName = tagName.trim().toLowerCase();
        if (!normalizedTagName || processedTagNames.has(normalizedTagName)) continue;
        
        const existingTag = cachedTags.find(
          t => t.name.toLowerCase() === normalizedTagName
        );
        
        if (existingTag) {
          if (!processedTags.some(t => t.id === existingTag.id)) {
            processedTags.push(existingTag);
            processedTagNames.add(normalizedTagName);
          }
        }
      }
      
      if (isMounted.current) {
        setSelectedTags(processedTags);
        onTagsChange?.(processedTags);
        initialTagsRef.current = initialTags;
      }
    };
    
    processInitialTags();
  }, [initialTags, cachedTags, isTagCacheLoading, onTagsChange]);

  const loadPendingSubmissions = useCallback(async () => {
    if (projectId === "new" || !user?.primaryEmailAddress?.emailAddress) return;

    try {
      const submissions = await fetch(
        `/api/projects/${projectId}/tag-submissions?status=pending&email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`
      ).then(res => res.json());
      
      if (Array.isArray(submissions)) {
        setPendingTags(submissions);
      } else {
        console.error("Invalid submissions response:", submissions);
        setPendingTags([]);
      }
    } catch (error) {
      console.error("Failed to load pending tag submissions:", error);
      setPendingTags([]);
    }
  }, [projectId, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    loadPendingSubmissions();
  }, [loadPendingSubmissions]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <TagInput
            tags={selectedTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            searchTags={handleSearchTags}
            placeholder={isOwner ? "Search for tags..." : "Only project owners can edit tags"}
            disabled={isTagCacheLoading || !isOwner}
            className="flex-1"
          />
          {projectId !== "new" && isOwner && (
            <TagSubmissionModal 
              projectId={projectId} 
              onSubmit={loadPendingSubmissions} 
            />
          )}
        </div>

        {pendingTags.length > 0 && (
          <div className="rounded-md bg-muted/50 p-3 space-y-2">
            <p className="text-sm font-medium">Your Pending Tag Submissions:</p>
            <div className="flex flex-wrap gap-2">
              {pendingTags.map((submission) => (
                <span
                  key={submission.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  {submission.tag_name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">These tags will appear on the project once approved.</p>
          </div>
        )}
      </div>
    </div>
  );
}