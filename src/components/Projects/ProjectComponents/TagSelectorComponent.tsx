"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { TagInfo } from "@/db/operations/tag-operations";
import { useTagCache } from "@/hooks/use-tag-cache";
import { TagSubmissionModal } from "./TagSubmissionModal";
import { useUser } from "@clerk/nextjs";
import { useProjects } from "@/providers/projects-provider";
import { SelectTagSubmission } from "@/db/schema/tag_submissions";
import { toast } from "sonner";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";

interface TagSelectorProps {
  projectId?: string;
  initialTags?: string[];
  onTagsChange?: (tags: TagInfo[]) => void;
  className?: string;
  isOwner?: boolean;
}

export function TagSelector({
  projectId = "new",
  initialTags = [],
  onTagsChange,
  className,
  isOwner = false,
}: TagSelectorProps) {
  const prevInitialTagsRef = useRef<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [pendingTags, setPendingTags] = useState<SelectTagSubmission[]>([]);
  const {
    tags: cachedTags,
    isLoading: isTagCacheLoading,
    refreshCache,
  } = useTagCache();
  const isMounted = useRef(false);
  const { user } = useUser();
  const { projects } = useProjects();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const areTagsEqual = useCallback((tagsA: string[], tagsB: string[]) => {
    if (tagsA.length !== tagsB.length) return false;
    const sortedA = [...tagsA].sort();
    const sortedB = [...tagsB].sort();
    return sortedA.every((tag, i) => tag === sortedB[i]);
  }, []);

  useEffect(() => {
    if (!isMounted.current || isTagCacheLoading || !cachedTags.length) return;

    if (areTagsEqual(initialTags, prevInitialTagsRef.current)) return;

    prevInitialTagsRef.current = [...initialTags];

    const processInitialTags = () => {
      const processedTags: TagInfo[] = [];
      const processedTagNames = new Set<string>();

      for (const tagName of initialTags) {
        const normalizedTagName = tagName.trim().toLowerCase();

        if (!normalizedTagName || processedTagNames.has(normalizedTagName))
          continue;

        const existingTag = cachedTags.find(
          (t) => t.name.toLowerCase() === normalizedTagName
        );

        if (existingTag) {
          if (!processedTags.some((t) => t.id === existingTag.id)) {
            processedTags.push(existingTag);
            processedTagNames.add(normalizedTagName);
          }
        } else {
          processedTags.push({
            id: `temp-${normalizedTagName}`,
            name: normalizedTagName,
            count: 0,
          });
          processedTagNames.add(normalizedTagName);
        }
      }

      const didTagsChange = !areTagsEqual(
        processedTags.map((t) => t.name),
        selectedTags.map((t) => t.name)
      );

      if (didTagsChange && isMounted.current) {
        setSelectedTags(processedTags);
        onTagsChange?.(processedTags);
      }
    };

    processInitialTags();
  }, [initialTags, cachedTags, isTagCacheLoading, onTagsChange, areTagsEqual]);

  const handleSearchTags = useCallback(
    async (query: string): Promise<TagInfo[]> => {
      if (selectedTags.length >= MAX_PROJECT_TAGS) {
        toast.error(`Projects can have a maximum of ${MAX_PROJECT_TAGS} tags`);
        return [];
      }

      const searchTerm = query.toLowerCase();
      return cachedTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchTerm) &&
          !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
      );
    },
    [selectedTags, cachedTags]
  );

  const handleAddTag = useCallback(
    async (tagId: string): Promise<void> => {
      if (!isOwner) {
        toast.error("Only project owners can modify tags");
        return;
      }

      if (selectedTags.length >= MAX_PROJECT_TAGS) {
        toast.error(`Projects can have a maximum of ${MAX_PROJECT_TAGS} tags`);
        return;
      }

      const tagToAdd = cachedTags.find((tag) => tag.id === tagId);
      if (tagToAdd && !selectedTags.some((t) => t.id === tagId)) {
        const updatedTags = [...selectedTags, tagToAdd];
        setSelectedTags(updatedTags);
        onTagsChange?.(updatedTags);
      }
    },
    [selectedTags, cachedTags, onTagsChange, isOwner]
  );

  const handleRemoveTag = useCallback(
    async (tagId: string): Promise<void> => {
      if (!isOwner) {
        toast.error("Only project owners can modify tags");
        return;
      }

      const updatedTags = selectedTags.filter((tag) => tag.id !== tagId);
      setSelectedTags(updatedTags);
      onTagsChange?.(updatedTags);
    },
    [selectedTags, onTagsChange, isOwner]
  );

  const loadPendingSubmissions = useCallback(async () => {
    if (projectId === "new" || !user?.primaryEmailAddress?.emailAddress) return;

    try {
      const submissions = await fetch(
        `/api/projects/${projectId}/tag-submissions?status=pending&email=${encodeURIComponent(
          user.primaryEmailAddress.emailAddress
        )}`,
        { cache: "no-store" }
      ).then((res) => res.json());

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
    if (isMounted.current) {
      loadPendingSubmissions();
    }
  }, [loadPendingSubmissions]);

  useEffect(() => {
    if (projectId === "new") return;

    const interval = setInterval(() => {
      loadPendingSubmissions();
    }, 60000);

    return () => clearInterval(interval);
  }, [projectId, loadPendingSubmissions]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Project Tags ({selectedTags.length}/{MAX_PROJECT_TAGS})
            </label>
            <p className="text-xs text-muted-foreground">
              Optimal: 6-10 tags for best discoverability
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <TagInput
              tags={selectedTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              searchTags={handleSearchTags}
              placeholder={
                isOwner
                  ? "Search for tags..."
                  : "Only project owners can edit tags"
              }
              disabled={isTagCacheLoading || !isOwner}
              className="flex-1"
            />
            {projectId !== "new" && isOwner && (
              <TagSubmissionModal
                projectId={projectId}
                onSubmit={loadPendingSubmissions}
                isOwner={isOwner}
              />
            )}
          </div>
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
            <p className="text-xs text-muted-foreground">
              These tags will appear on the project once approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
