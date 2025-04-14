"use client";

import React, { useEffect, useState } from "react";
import { updateProject } from "@/app/actions/projects";
import { Project } from "@/types/models/project";
import { toast } from "sonner";
import { useProjects } from "@/providers/projects-provider";
import {
  validateProjectForm,
  handleFormSubmit,
  ProjectFormErrors,
  ProjectFormData,
} from "@/utils/formValidation";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnnoyedIcon } from "lucide-react";

interface UpdateProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export function UpdateProjectModal({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}: UpdateProjectModalProps) {
  // Get global project context handler if no custom handler is provided
  const projectsContext = useProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    slug: "",
    tags: "",
    description: "",
    tier: "free",
    difficulty: "beginner",
  });

  // Initialize form data when the project changes
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        slug: project.slug || "",
        tags: project.tags ? project.tags.join(", ") : "",
        description: project.description || "",
        tier: project.tier || "free",
        difficulty: project.difficulty || "beginner",
      });
      // Reset errors when project changes
      setFormErrors({});
    }
  }, [project]);

  // Handle changes for input and textarea fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select changes (for tier and difficulty dropdowns)
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    handleFormSubmit(
      e,
      formData,
      validateProjectForm,
      setFormErrors,
      async () => {
        if (!project?.id) {
          setFormErrors((prev) => ({
            ...prev,
            server: "Project ID is missing",
          }));
          return;
        }

        setIsSubmitting(true);

        try {
          // Prepare the project data for update
          const projectData = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description,
            tags: formData.tags
              ? formData.tags.split(",").map((tag) => tag.trim())
              : [],
            tier: formData.tier as "free" | "pro" | "diamond",
            difficulty: formData.difficulty as
              | "beginner"
              | "intermediate"
              | "advanced",
          };

          // Use the server action to update the project
          const result = await updateProject(project.id, projectData);

          if (!result.success) {
            setFormErrors((prev) => ({
              ...prev,
              server: result.error,
            }));
            return;
          }

          // Notify about the updated project - use provided callback or global context
          if (result.data) {
            if (onProjectUpdated) {
              onProjectUpdated(result.data);
            } else if (projectsContext?.handleProjectUpdated) {
              projectsContext.handleProjectUpdated(result.data);
            }
            toast.success("Project updated successfully!");

            // Close the modal
            onClose();
          }
        } catch (error) {
          console.error("Failed to update project:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          setFormErrors((prev) => ({
            ...prev,
            server: errorMessage,
          }));
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update Project</DialogTitle>
          <DialogDescription>
            Make changes to the project information below.
          </DialogDescription>
        </DialogHeader>

        {formErrors.server && (
          <Alert variant="destructive" className="mb-4">
            <AnnoyedIcon className="h-4 w-4" />
            <AlertDescription>{formErrors.server}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Project Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Project Title"
                value={formData.title}
                onChange={handleInputChange}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug (URL-friendly unique identifier){" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="slug"
                name="slug"
                placeholder="my-awesome-project"
                value={formData.slug}
                onChange={handleInputChange}
                className={formErrors.slug ? "border-red-500" : ""}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                name="tags"
                placeholder="React, Next.js, TypeScript"
                value={formData.tags}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Project Description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tier" className="text-sm font-medium">
                Access Tier
              </label>
              <Select
                value={formData.tier}
                onValueChange={(value) => handleSelectChange("tier", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="difficulty" className="text-sm font-medium">
                Difficulty Level
              </label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  handleSelectChange("difficulty", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Fields marked with <span className="text-red-500">*</span> are
            required
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
