// filepath: /Users/jramirez/Git/CodeDetailsWeb/src/hooks/use-tag-operations.tsx
'use client';

import { useCallback } from 'react';
import { ContentType, TagInfo } from '@/db/operations/tag-operations';
import { useContentTags } from './use-content-tags';
import { 
  searchTagsAction,
  createTagAction,
  addTagToProjectAction,
  removeTagFromProjectAction,
  replaceProjectTagsAction,
  fetchProjectTags
} from '@/app/actions/tags';

/**
 * Function to fetch content tags based on content type
 */
async function fetchContentTags(contentType: ContentType, contentId: string) {
  if (contentType === 'project') {
    return await fetchProjectTags(contentId);
  }
  // Add support for other content types as needed
  return [];
}

/**
 * Function to add a tag to content based on content type
 */
async function addTagToContentAction(
  contentType: ContentType, 
  contentId: string, 
  tagId: string,
  contentSlug?: string
) {
  if (contentType === 'project' && contentSlug) {
    return await addTagToProjectAction(contentId, tagId, contentSlug);
  }
  // Add support for other content types as needed
  return { success: false, message: `Content type ${contentType} is not supported yet` };
}

/**
 * Function to remove a tag from content based on content type
 */
async function removeTagFromContentAction(
  contentType: ContentType, 
  contentId: string, 
  tagId: string,
  contentSlug?: string
) {
  if (contentType === 'project' && contentSlug) {
    return await removeTagFromProjectAction(contentId, tagId, contentSlug);
  }
  // Add support for other content types as needed
  return { success: false, message: `Content type ${contentType} is not supported yet` };
}

/**
 * Function to replace tags for content based on content type
 */
async function replaceContentTagsAction(
  contentType: ContentType, 
  contentId: string, 
  tagIds: string[],
  contentSlug?: string
) {
  if (contentType === 'project' && contentSlug) {
    return await replaceProjectTagsAction(contentId, tagIds, contentSlug);
  }
  // Add support for other content types as needed
  return { success: false, message: `Content type ${contentType} is not supported yet` };
}

/**
 * A simplified hook that provides access to tag operations
 * for different content types. This hook uses the server actions
 * and connects them to the useContentTags hook.
 * 
 * @param contentType The type of content (project, tutorial, page, etc.)
 * @param contentId The ID of the content item
 * @param contentSlug The slug of the content item (required for projects)
 * @returns Object with tags and tag management functions
 */
export function useTagOperations(
  contentType: ContentType,
  contentId: string,
  contentSlug?: string
) {
  // Create tag operation functions that connect to server actions
  const tagOperations = {
    fetchTags: useCallback((type: ContentType, id: string) => 
      fetchContentTags(type, id), []),
    
    addTag: useCallback((type: ContentType, id: string, tagId: string) => 
      addTagToContentAction(type, id, tagId, contentSlug), [contentSlug]),
    
    removeTag: useCallback((type: ContentType, id: string, tagId: string) => 
      removeTagFromContentAction(type, id, tagId, contentSlug), [contentSlug]),
    
    replaceTags: useCallback((type: ContentType, id: string, tagIds: string[]) => 
      replaceContentTagsAction(type, id, tagIds, contentSlug), [contentSlug]),
    
    searchTags: useCallback((query: string) => 
      searchTagsAction(query), []),
  };

  // Use the generic content tags hook with our server actions
  const contentTagsHook = useContentTags(contentType, contentId, tagOperations);

  // Add a createTag function that isn't in the basic hook
  const createTag = useCallback(async (name: string) => {
    const result = await createTagAction(name);
    // Check both success status and that id exists before returning
    if (result && result.success && 'id' in result) {
      return { id: result.id };
    }
    return null;
  }, []);

  // Return everything from the content tags hook plus the createTag function
  return {
    ...contentTagsHook,
    createTag
  };
}