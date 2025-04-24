"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { useTagCache } from "@/hooks/use-tag-cache";
import { TagSubmissionModal } from "./TagSubmissionModal";
import { useAuth } from "@clerk/nextjs";
import { useProjects } from "@/providers/projects-provider";

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
  const { tags: cachedTags, isLoading: isTagCacheLoading } = useTagCache();
  const isMounted = useRef(false);
  const initialTagsRef = useRef<string[]>(initialTags);
  const { userId } = useAuth();
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
    if (!isOwner) return; // Prevent adding tags if not the owner

    const tagToAdd = cachedTags.find(tag => tag.id === tagId);
    if (tagToAdd && !selectedTags.some(t => t.id === tagId)) {
      const updatedTags = [...selectedTags, tagToAdd];
      setSelectedTags(updatedTags);
      onTagsChange?.(updatedTags);
    }
  }, [selectedTags, cachedTags, onTagsChange, isOwner]);

  const handleRemoveTag = useCallback(async (tagId: string): Promise<void> => {
    if (!isOwner) return; // Prevent removing tags if not the owner

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

  return (
    <div className={className}>
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
        {projectId !== "new" && isOwner && <TagSubmissionModal projectId={projectId} />}
      </div>
    </div>
  );
}