import React from "react";
import { useProjects } from "@/providers/projects-provider";
import { useSupabaseToken } from "@/services/clerkService";
import { AddProjectForm } from "@/components/Projects/AddProjectForm/page";

export function ProjectForm() {
  const { token } = useSupabaseToken();
  const { handleProjectAdded } = useProjects();

  return <AddProjectForm token={token} onProjectAdded={handleProjectAdded} />;
}
