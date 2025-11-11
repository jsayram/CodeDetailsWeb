"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitNewTag } from "@/app/actions/tag-submissions";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/providers/projects-provider";
import { ClientOnly } from "@/components/ClientOnly";
import { searchTagsAction } from "@/app/actions/tags";
import { useTagCache } from "@/hooks/use-tag-cache";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";

interface TagSubmissionModalProps {
  projectId: string;
  onSubmit?: () => void;
  isOwner?: boolean; // Add this prop
}

// Validation function for tag names
const validateTagName = async (
  tag: string
): Promise<{ isValid: boolean; message?: string }> => {
  const normalized = tag.trim().toLowerCase();

  if (!normalized) {
    return { isValid: false, message: "Tag name cannot be empty" };
  }

  if (normalized.length < 2) {
    return {
      isValid: false,
      message: "Tag name must be at least 2 characters long",
    };
  }

  if (normalized.length > 30) {
    return {
      isValid: false,
      message: "Tag name must be less than 30 characters",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return {
      isValid: false,
      message: "Tags can only contain lowercase letters, numbers, and hyphens",
    };
  }

  return { isValid: true };
};

export function TagSubmissionModal({
  projectId,
  onSubmit,
  isOwner = false, // Default to false for safety
}: TagSubmissionModalProps) {
  const { user, isLoaded } = useUser();
  const { projects } = useProjects();
  const { refreshCache } = useTagCache();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [processedTags, setProcessedTags] = useState<
    Array<{
      name: string;
      isValid: boolean;
      message?: string;
      willBeSubmitted?: boolean;
    }>
  >([]);

  // Get project details
  const project = projects?.find((p) => p.id === projectId);
  const currentTagCount = project?.tags?.length || 0;
  const remainingTagSlots = MAX_PROJECT_TAGS - currentTagCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user, isLoaded, mounted]);

  // Reset form when dialog is closed
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTagInput("");
      setDescription("");
      setProcessedTags([]);
      setTagError(null);
    }
  };

  const processTagInput = async (input: string) => {
    setProcessedTags([]); // Clear existing tags while processing

    // Keep track of normalized tags we've seen
    const seenNormalizedTags = new Set<string>();

    const tagPromises = input
      .split(",")
      .map((tag) => ({
        original: tag,
        normalized: tag.trim().toLowerCase(),
      }))
      .filter(({ normalized }) => normalized) // Remove empty tags
      .filter(({ normalized }) => {
        // If we've seen this normalized tag before, filter it out
        if (seenNormalizedTags.has(normalized)) {
          return false;
        }
        // Otherwise, add it to our set and keep it
        seenNormalizedTags.add(normalized);
        return true;
      })
      .map(async ({ normalized }, index) => {
        const validation = await validateTagName(normalized);

        // Mark which tags will be submitted based on remaining slots
        const willBeSubmitted = index < remainingTagSlots;

        // If valid but exceeds limit, add a note about submission status
        if (validation.isValid) {
          if (!willBeSubmitted) {
            return {
              name: normalized,
              isValid: true,
              willBeSubmitted: false,
              message: `Will not be submitted - exceeds the limit of ${MAX_PROJECT_TAGS} tags`,
            };
          }
          return {
            name: normalized,
            isValid: true,
            willBeSubmitted: true,
          };
        }

        return {
          name: normalized,
          isValid: false,
          message: validation.message,
          willBeSubmitted: false,
        };
      });

    const processedResults = await Promise.all(tagPromises);

    // Add a warning if some valid tags won't be submitted
    const validTags = processedResults.filter((tag) => tag.isValid);
    const willBeSubmitted = validTags.filter((tag) => tag.willBeSubmitted);
    const willNotBeSubmitted = validTags.filter((tag) => !tag.willBeSubmitted);

    if (willNotBeSubmitted.length > 0) {
      setTagError(
        `Only ${willBeSubmitted.length} tag(s) will be submitted to stay within the ${MAX_PROJECT_TAGS} tag limit`
      );
    } else {
      setTagError(
        processedResults.some((tag) => !tag.isValid)
          ? "Please fix invalid tags"
          : null
      );
    }

    setProcessedTags(processedResults);
    return !processedResults.some((tag) => !tag.isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error("You are not authorized to request a tag for this project.");
      return;
    }

    if (!email) {
      toast.error("Email is required");
      return;
    }

    const isValid = await processTagInput(tagInput);
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // Submit each valid tag that's within the limit
      const validTags = processedTags.filter(
        (tag) => tag.isValid && tag.willBeSubmitted
      );

      if (validTags.length === 0) {
        toast.error("No valid tags to submit");
        setIsSubmitting(false);
        return;
      }

      const results = [];
      const errors = [];
      const autoApproved = [];

      for (const tag of validTags) {
        try {
          const result = await submitNewTag(
            tag.name,
            projectId,
            email,
            description
          );
          if (result.status === "auto_approved") {
            autoApproved.push(tag.name);
          } else {
            results.push(result);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          errors.push(`${tag.name}: ${errorMessage}`);
          console.error(`Error submitting tag ${tag.name}:`, error);
        }
      }

      // If any tags were auto-approved, refresh the tag cache
      if (autoApproved.length > 0) {
        await refreshCache();
      }

      if (errors.length > 0) {
        // Show errors for failed submissions
        toast.error(
          <div>
            <p>Some tags could not be submitted:</p>
            <ul className="list-disc pl-4 mt-2">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        );
      }

      // Show message for auto-approved tags
      if (autoApproved.length > 0) {
        toast.success(
          `${autoApproved.join(", ")} ${
            autoApproved.length === 1 ? "has" : "have"
          } been automatically added to your project`
        );
      }

      // Show message for pending tags
      if (results.length > 0) {
        const message =
          results.length === 1
            ? "Tag submission received! Once approved, it will be automatically connected to this project."
            : `${results.length} tag submissions received! Once approved, they will be automatically connected to this project.`;
        toast.success(message);
      }

      // If any tags were processed successfully (either auto-approved or submitted)
      if (results.length > 0 || autoApproved.length > 0) {
        // Reset form
        setTagInput("");
        setDescription("");
        setProcessedTags([]);
        setTagError(null);

        // Call onSubmit callback to refresh pending tags and project tags
        await onSubmit?.();

        // Close modal after everything is done
        setOpen(false);
      }
    } catch (error) {
      console.error("Error in tag submission:", error);
      toast.error("Failed to submit tag(s). Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {isOwner ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Submit New Tag</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    Propose new tags for this project.{" "}
                    <span className="font-medium">
                      ({currentTagCount}/{MAX_PROJECT_TAGS} tags used)
                    </span>
                  </p>
                  {remainingTagSlots > 0 ? (
                    <p className="text-sm bg-muted/50 p-2 rounded-md">
                      You can request up to{" "}
                      <span className="font-medium">{remainingTagSlots}</span>{" "}
                      more tag{remainingTagSlots !== 1 ? "s" : ""}.
                      {remainingTagSlots < MAX_PROJECT_TAGS &&
                        ` Any additional tag requests will be automatically rejected.`}
                    </p>
                  ) : (
                    <p className="text-sm bg-destructive/10 text-destructive p-2 rounded-md">
                      This project has reached the maximum limit of{" "}
                      {MAX_PROJECT_TAGS} tags. Remove some existing tags before
                      requesting new ones.
                    </p>
                  )}
                  <ClientOnly>
                    {project && (
                      <p className="bg-muted/50 p-2 rounded-md text-sm">
                        <Badge variant="outline" className="mb-1">
                          {project.title}
                        </Badge>
                      </p>
                    )}
                  </ClientOnly>
                  <p className="text-xs text-muted-foreground">
                    You can submit multiple tags by separating them with commas.
                    Tags must be lowercase, no spaces, URL-safe, and contain
                    only letters, numbers, and hyphens.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="tag-name">Tag Name</label>
                <Input
                  id="tag-name"
                  placeholder="e.g. react, next-js, typescript"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (!e.target.value) {
                      setProcessedTags([]);
                      setTagError(null);
                    }
                  }}
                  onBlur={() => processTagInput(tagInput)}
                  required
                />
                {processedTags.length > 0 && (
                  <div className="space-y-2">
                    {processedTags.map((tag, index) => (
                      <div
                        key={index}
                        className={`text-sm ${
                          tag.isValid
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {tag.name} {!tag.isValid && `- ${tag.message}`}
                      </div>
                    ))}
                  </div>
                )}
                {tagError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {tagError}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Your Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description (Optional)</label>
                <Textarea
                  id="description"
                  placeholder="Why should these tags be added to this project?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !!tagError}>
                {isSubmitting ? "Submitting..." : "Submit Tag"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-sm text-muted-foreground">
            You are not authorized to request a tag for this project.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
