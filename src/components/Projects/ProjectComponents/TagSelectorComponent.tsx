"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { createTagAction } from "@/app/actions/tags";
import { useTagCache } from "@/hooks/use-tag-cache";

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
  const { tags: cachedTags, isLoading: isTagCacheLoading, addTagToCache } = useTagCache();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isMounted = React.useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to search for tags using the cache
  const handleSearchTags = useCallback(async (query: string): Promise<TagInfo[]> => {
    const searchTerm = query.toLowerCase();
    return cachedTags.filter(tag => tag.name.toLowerCase().includes(searchTerm));
  }, [cachedTags]);

  // Function to create a new tag
  const handleCreateTag = useCallback(async (name: string): Promise<{ id: string } | null> => {
    try {
      const result = await createTagAction(name);
      if (result && result.success && 'id' in result) {
        const newTag: TagInfo = {
          id: result.id,
          name: name,
        };
        
        // Update selected tags
        setSelectedTags(prevTags => {
          if (prevTags.some(t => t.id === result.id)) {
            return prevTags;
          }
          const updatedTags = [...prevTags, newTag];
          if (onTagsChange) {
            onTagsChange(updatedTags);
          }
          return updatedTags;
        });
        
        return { id: result.id };
      }
      return null;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  }, [onTagsChange]);

  // Function to add a tag
  const handleAddTag = useCallback((tagId: string) => {
    const tagToAdd = cachedTags.find(tag => tag.id === tagId);
    
    if (tagToAdd && !selectedTags.some(t => t.id === tagId)) {
      const updatedTags = [...selectedTags, tagToAdd];
      setSelectedTags(updatedTags);
      
      if (onTagsChange) {
        onTagsChange(updatedTags);
      }
    }
  }, [selectedTags, cachedTags, onTagsChange]);

  // Function to remove a tag
  const handleRemoveTag = useCallback((tagId: string) => {
    const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
    setSelectedTags(updatedTags);
    
    if (onTagsChange) {
      onTagsChange(updatedTags);
    }
  }, [selectedTags, onTagsChange]);

  // Process initial tags when component mounts or initialTags change
  useEffect(() => {
    if (!isMounted.current || isTagCacheLoading || isInitialized || !addTagToCache) return;

    const processInitialTags = async () => {
      const processedTags: TagInfo[] = [];
      
      for (const tagName of initialTags) {
        if (!tagName.trim()) continue;
        
        // Search in cached tags first
        const existingTag = cachedTags.find(
          t => t.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existingTag) {
          processedTags.push(existingTag);
        } else {
          // Create new tag if it doesn't exist
          const newTagResult = await createTagAction(tagName.trim());
          if (newTagResult && newTagResult.success && 'id' in newTagResult) {
            const newTagInfo: TagInfo = {
              id: newTagResult.id,
              name: tagName.trim(),
            };
            processedTags.push(newTagInfo);
            addTagToCache(newTagInfo);
          }
        }
      }
      
      if (isMounted.current) {
        setSelectedTags(processedTags);
        
        if (onTagsChange) {
          onTagsChange(processedTags);
        }
        
        setIsInitialized(true);
      }
    };
    
    processInitialTags();
  }, [initialTags, cachedTags, isTagCacheLoading, onTagsChange, isInitialized, addTagToCache]);

  return (
    <div className={className}>
      <TagInput
        tags={selectedTags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        searchTags={handleSearchTags}
        onCreateTag={handleCreateTag}
        placeholder="Search for tags or create new ones..."
        disabled={isTagCacheLoading}
      />
    </div>
  );
}