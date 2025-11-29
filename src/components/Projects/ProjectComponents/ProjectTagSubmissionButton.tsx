"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MAX_PROJECT_TAGS } from "@/constants/project-limits";
import { Tag as TagIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface ProjectTagSubmissionButtonProps {
  projectId: string;
  projectTitle: string;
  currentTags: string[];
  pendingTags?: any[];
  onSubmit?: () => Promise<void>;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ProjectTagSubmissionButton({
  projectId,
  projectTitle,
  currentTags,
  pendingTags = [],
  onSubmit,
  variant = "default",
  size = "default",
  className,
}: ProjectTagSubmissionButtonProps) {
  const router = useRouter();
  const params = useParams();
  const projectSlug = params.slug as string;

  // Calculate tag slots
  const currentTagCount = currentTags.length;
  const remainingTagSlots = MAX_PROJECT_TAGS - currentTagCount;

  const handleClick = () => {
    router.push(`/projects/${projectSlug}/suggest-tags`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={remainingTagSlots <= 0}
      title={
        remainingTagSlots <= 0
          ? "Maximum tags reached. Please refresh the page after removing tags to request new ones."
          : "Suggest tags for this project"
      }
      className={`hover:cursor-pointer ${className}`}
    >
      <TagIcon className="mr-2 h-4 w-4" />
      Suggest Tags
    </Button>
  );
}