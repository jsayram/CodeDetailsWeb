"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { searchTagsAction, createTagAction } from "@/app/actions/tags";

interface TagSelectorProps {
  projectId?: string;
  initialTags?: string[];
  onTagsChange?: (tags: TagInfo[]) => void;
  className?: string;
}

// Helper function to validate if a string is a valid UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function TagSelector({
  projectId = "new",
  initialTags = [],
  onTagsChange,
  className,
}: TagSelectorProps) {
  // State for managing tags
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Use a ref to track if component is mounted to avoid state updates during render
  const isMounted = React.useRef(false);
  
  // Set mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to search for tags
  const handleSearchTags = useCallback(async (query: string): Promise<TagInfo[]> => {
    try {
      const results = await searchTagsAction(query);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error("Error searching tags:", error);
      return [];
    }
  }, []);

  // Function to create a new tag
  const handleCreateTag = useCallback(async (name: string): Promise<{ id: string } | null> => {
    try {
      const result = await createTagAction(name);
      if (result && result.success && 'id' in result) {
        // Instead of synchronous state update, schedule it in next tick
        setTimeout(() => {
          if (!isMounted.current) return;
          
          const newTag: TagInfo = {
            id: result.id,
            name: name,
          };
          
          setTags(prevTags => {
            // Avoid adding duplicate tags
            if (prevTags.some(t => t.id === result.id)) {
              return prevTags;
            }
            
            const updatedTags = [...prevTags, newTag];
            
            // Notify parent if needed
            if (onTagsChange) {
              onTagsChange(updatedTags);
            }
            
            return updatedTags;
          });
        }, 0);
        
        return { id: result.id };
      }
      return null;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  }, [onTagsChange]);

  // Function to add a tag
  const handleAddTag = useCallback(async (tagId: string) => {
    setIsLoading(true);
    try {
      // Find the tag details
      const searchResults = await handleSearchTags("");
      const tagToAdd = searchResults.find(tag => tag.id === tagId);
      
      if (tagToAdd && !tags.some(t => t.id === tagId)) {
        const updatedTags = [...tags, tagToAdd];
        setTags(updatedTags);
        
        if (onTagsChange) {
          onTagsChange(updatedTags);
        }
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tags, onTagsChange, handleSearchTags]);

  // Function to remove a tag
  const handleRemoveTag = useCallback(async (tagId: string) => {
    // Safety check to ensure the component is still mounted
    if (!isMounted.current) return;
    
    try {
      // Update local state immediately for better UX
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      setTags(updatedTags);
      
      // Notify parent component
      if (onTagsChange) {
        onTagsChange(updatedTags);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  }, [tags, onTagsChange]);

  // Process initial tags when component mounts or initialTags change
  useEffect(() => {
    // Skip if already initialized with the same tags
    const currentTagNames = tags.map(t => t.name).sort();
    const sortedInitialTags = [...initialTags].sort();
    
    if (isInitialized && 
        JSON.stringify(currentTagNames) === JSON.stringify(sortedInitialTags)) {
      return;
    }
    
    const processInitialTags = async () => {
      setIsLoading(true);
      try {
        const processedTags: TagInfo[] = [];
        
        for (const tagName of initialTags) {
          if (!tagName.trim()) continue;
          
          // Search for this tag name
          const searchResults = await handleSearchTags(tagName);
          const existingTag = searchResults.find(
            t => t.name.toLowerCase() === tagName.toLowerCase()
          );
          
          if (existingTag) {
            processedTags.push(existingTag);
          } else {
            // Create the tag if it doesn't exist
            const newTag = await createTagAction(tagName.trim());
            if (newTag && newTag.success && 'id' in newTag) {
              processedTags.push({
                id: newTag.id,
                name: tagName.trim(),
              });
            }
          }
        }
        
        if (isMounted.current) {
          setTags(processedTags);
          
          if (onTagsChange) {
            onTagsChange(processedTags);
          }
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error processing initial tags:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    processInitialTags();
  }, [initialTags, handleSearchTags, onTagsChange, isInitialized, tags]);

  return (
    <div className={className}>
      <TagInput
        tags={tags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        searchTags={handleSearchTags}
        onCreateTag={handleCreateTag}
        placeholder="Search for tags or create new ones..."
        disabled={isLoading}
      />
    </div>
  );
}