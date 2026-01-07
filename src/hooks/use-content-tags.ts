// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/hooks/use-content-tags.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType, TagInfo } from '@/db/operations/tag-operations';

// Type for tag operations responses
type TagOperationResponse = {
  success: boolean;
  message?: string;
};

// Define the tag operations server actions
// These will be implemented in a separate file
interface TagOperations {
  fetchTags: (contentType: ContentType, contentId: string) => Promise<TagInfo[]>;
  addTag: (contentType: ContentType, contentId: string, tagId: string) => Promise<TagOperationResponse>;
  removeTag: (contentType: ContentType, contentId: string, tagId: string) => Promise<TagOperationResponse>;
  replaceTags: (contentType: ContentType, contentId: string, tagIds: string[]) => Promise<TagOperationResponse>;
  searchTags: (query: string) => Promise<TagInfo[]>;
}

// Type for the hook return value
interface UseContentTagsReturn {
  tags: TagInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTag: (tagId: string) => Promise<void>;
  removeTag: (tagId: string) => Promise<void>;
  replaceTags: (tagIds: string[]) => Promise<void>;
  searchTags: (query: string) => Promise<TagInfo[]>;
}

/**
 * Custom hook for managing content tags
 * 
 * @param contentType - Type of content (project, tutorial, page, snippet, etc.)
 * @param contentId - ID of the content item
 * @param tagOperations - Object containing tag operation functions (can be injected for testing)
 * @returns Object with tags and tag management functions
 */
export function useContentTags(
  contentType: ContentType,
  contentId: string,
  tagOperations: TagOperations
): UseContentTagsReturn {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Track if a tag operation is in progress to prevent concurrent operations
  const isOperationInProgress = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch tags for this content item
  const fetchTags = useCallback(async () => {
    // Skip if another operation is in progress
    if (isOperationInProgress.current) return;
    
    try {
      isOperationInProgress.current = true;
      setLoading(true);
      setError(null);
      const fetchedTags = await tagOperations.fetchTags(contentType, contentId);
      if (isMounted.current) {
        setTags(fetchedTags);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isOperationInProgress.current = false;
    }
  }, [contentType, contentId, tagOperations]);

  // Initial fetch
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Refresh function exposed to consumers
  const refresh = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  // Add a tag to the content
  const addTag = useCallback(async (tagId: string) => {
    // Skip if another operation is in progress
    if (isOperationInProgress.current) return;
    
    try {
      isOperationInProgress.current = true;
      if (isMounted.current) {
        setError(null);
      }
      const response = await tagOperations.addTag(contentType, contentId, tagId);
      
      if (response.success) {
        // Refresh tags after adding
        await fetchTags();
        router.refresh(); // Refresh the page to update any server components
      } else if (isMounted.current) {
        setError(response.message || 'Failed to add tag');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to add tag');
      }
    } finally {
      isOperationInProgress.current = false;
    }
  }, [contentType, contentId, fetchTags, router, tagOperations]);

  // Remove a tag from the content
  const removeTag = useCallback(async (tagId: string) => {
    // Skip if another operation is in progress
    if (isOperationInProgress.current) return;
    
    try {
      isOperationInProgress.current = true;
      if (isMounted.current) {
        setError(null);
      }
      const response = await tagOperations.removeTag(contentType, contentId, tagId);
      
      if (response.success) {
        // Refresh tags after removing
        await fetchTags();
        router.refresh(); // Refresh the page to update any server components
      } else if (isMounted.current) {
        setError(response.message || 'Failed to remove tag');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to remove tag');
      }
    } finally {
      isOperationInProgress.current = false;
    }
  }, [contentType, contentId, fetchTags, router, tagOperations]);

  // Replace all tags for the content
  const replaceTags = useCallback(async (tagIds: string[]) => {
    // Skip if another operation is in progress
    if (isOperationInProgress.current) return;
    
    try {
      isOperationInProgress.current = true;
      if (isMounted.current) {
        setError(null);
      }
      const response = await tagOperations.replaceTags(contentType, contentId, tagIds);
      
      if (response.success) {
        // Refresh tags after replacing
        await fetchTags();
        router.refresh(); // Refresh the page to update any server components
      } else if (isMounted.current) {
        setError(response.message || 'Failed to update tags');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to update tags');
      }
    } finally {
      isOperationInProgress.current = false;
    }
  }, [contentType, contentId, fetchTags, router, tagOperations]);

  // Search for tags (useful for tag pickers)
  const searchTags = useCallback(async (query: string) => {
    try {
      return await tagOperations.searchTags(query);
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to search tags');
      }
      return [];
    }
  }, [tagOperations]);

  return {
    tags,
    loading,
    error,
    refresh,
    addTag,
    removeTag,
    replaceTags,
    searchTags
  };
}