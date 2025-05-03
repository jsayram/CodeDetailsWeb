"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SelectProjectWithOwner,
  SelectUserWithProject,
} from "@/db/schema/projects";
import { ProjectContent } from "./ProjectContent";

interface ProjectCreateComponentProps {
  userProfile: SelectUserWithProject;
}

export function ProjectCreateComponent({
  userProfile,
}: ProjectCreateComponentProps) {
  const router = useRouter();

  // Create an empty project template with required properties
  const emptyProject: SelectProjectWithOwner = {
    id: "",
    title: "",
    slug: "",
    description: "",
    category: "web",
    created_at: new Date(),
    updated_at: new Date(),
    user_id: userProfile.user_id,
    deleted_at: null,
    tags: [],
    total_favorites: "0",
  };

  return (
    <ProjectContent
      project={emptyProject}
      userProfile={userProfile}
      error={undefined}
      create={true}
    />
  );
}
