"use client";

import { useState, useEffect, useCallback } from "react";
import { SelectTagSubmission } from "@/db/schema/tag_submissions";
import { useUser } from "@clerk/nextjs";

/**
 * Hook to fetch and manage pending tag submissions for a project
 *
 * @param projectId The ID of the project
 * @returns Object with pending tag submissions and a refresh function
 */
export function useProjectTagSubmissions(projectId: string) {
  const [pendingTags, setPendingTags] = useState<SelectTagSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchPendingTags = useCallback(async () => {
    if (!projectId || !user?.primaryEmailAddress?.emailAddress) {
      setPendingTags([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tag-submissions?status=pending&email=${encodeURIComponent(
          user.primaryEmailAddress.emailAddress
        )}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pending tags: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setPendingTags(data);
      } else {
        console.error("Invalid submissions response:", data);
        setPendingTags([]);
      }
    } catch (err) {
      console.error("Error fetching pending tags:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch pending tag submissions"
      );
      setPendingTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    fetchPendingTags();

    // Set up polling for updates every minute
    const interval = setInterval(fetchPendingTags, 60000);

    return () => clearInterval(interval);
  }, [fetchPendingTags]);

  return {
    pendingTags,
    isLoading,
    error,
    refreshPendingTags: fetchPendingTags,
  };
}
