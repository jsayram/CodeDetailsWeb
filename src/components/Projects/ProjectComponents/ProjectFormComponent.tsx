import React from "react";
import { useProjects } from "@/providers/projects-provider";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { AddProjectForm } from "@/components/Projects/ProjectComponents/AddProjectFormComponent";

export function ProjectForm() {
  const { token } = useSupabaseToken();
  const { handleProjectAdded } = useProjects();

  return <AddProjectForm token={token} onProjectAdded={handleProjectAdded} />;
}
