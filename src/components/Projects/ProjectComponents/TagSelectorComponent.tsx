"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { useTagCache } from "@/hooks/use-tag-cache";
import { TagSubmissionModal } from "./TagSubmissionModal";

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
    const tagToAdd = cachedTags.find(tag => tag.id === tagId);
    if (tagToAdd && !selectedTags.some(t => t.id === tagId)) {
      const updatedTags = [...selectedTags, tagToAdd];
      setSelectedTags(updatedTags);
      onTagsChange?.(updatedTags);
    }
  }, [selectedTags, cachedTags, onTagsChange]);

  const handleRemoveTag = useCallback(async (tagId: string): Promise<void> => {
    const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
    setSelectedTags(updatedTags);
    onTagsChange?.(updatedTags);
  }, [selectedTags, onTagsChange]);

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
          placeholder="Search for tags..."
          disabled={isTagCacheLoading}
          className="flex-1"
        />
        {projectId !== "new" && <TagSubmissionModal projectId={projectId} />}
      </div>
    </div>
  );
}