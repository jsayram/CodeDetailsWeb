"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Project } from "@/types/models/project";
import { InsertProject } from "@/db/schema/projects";
import { createProject, updateProject } from "@/app/actions/projects";
import { toast } from "sonner";
import { useProjects } from "@/providers/projects-provider";
import { useAuth } from "@clerk/nextjs";
import {
  validateProjectForm,
  handleFormSubmit,
  ProjectFormErrors,
  ProjectCategory,
} from "@/utils/formValidation";
import { TagInfo } from "@/db/operations/tag-operations";
import { TagSelector } from "./TagSelectorComponent";
import { slugify } from "@/utils/stringUtils";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnnoyedIcon, RefreshCcwIcon, ChevronDown } from "lucide-react";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface ProjectFormBaseProps {
  // Project data (if updating)
  project?: Project | null;
  // Mode (create or update)
  mode: "create" | "update";
  // Callbacks
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
  // UI customization
  className?: string;
  formTitle?: string;
  submitButtonText?: string;
  showCancelButton?: boolean;
}

export interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
}

export function ProjectFormBase({
  project,
  mode = "create",
  onSuccess,
  onCancel,
  className = "",
  formTitle,
  submitButtonText,
  showCancelButton = true,
}: ProjectFormBaseProps) {
  const projectsContext = useProjects();
  const { userId } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    slug: "",
    description: "",
    category: "web",
  });

  const [projectUpdateKey, setProjectUpdateKey] = useState(Date.now());
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize form data when project changes and component is mounted
  useEffect(() => {
    if (!mounted) return;

    if (project && mode === "update") {
      setOriginalProject(project);
      setFormData({
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        category: project.category || "web",
      });

      if (project.tags) {
        setSelectedTags(
          project.tags.map((name) => ({
            id: "", // ID will be populated by TagSelector
            name,
          }))
        );
      }
      setFormErrors({});
    }
  }, [project, mode, projectUpdateKey, mounted]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof ProjectFormErrors;

    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, [formErrors]);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleTagsChange = useCallback((tags: TagInfo[]) => {
    setSelectedTags(tags);
  }, []);

  const generateSlug = useCallback(() => {
    if (formData.title) {
      const newSlug = slugify(formData.title);
      setFormData((prev) => ({
        ...prev,
        slug: newSlug,
      }));

      if (formErrors.slug) {
        setFormErrors((prev) => ({
          ...prev,
          slug: undefined,
        }));
      }
    }
  }, [formData.title, formErrors.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (!userId) {
      setFormErrors((prev) => ({
        ...prev,
        server: "You must be logged in to perform this action",
      }));
      return;
    }

    handleFormSubmit(
      e,
      formData,
      validateProjectForm,
      setFormErrors,
      async () => {
        if (mode === "update" && !project?.id) {
          setFormErrors((prev) => ({
            ...prev,
            server: "Project ID is missing",
          }));
          return;
        }

        setIsSubmitting(true);

        try {
          const projectData = {
            ...formData,
            tags: selectedTags.map((tag) => tag.name),
          };

          let result;
          if (mode === "create") {
            result = await createProject(projectData as InsertProject, userId);
          } else {
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }
            result = await updateProject(project!.id, projectData, userId);
          }

          if (!result.success) {
            setFormErrors((prev) => ({
              ...prev,
              server: result.error,
            }));
            return;
          }

          if (result.data) {
            if (mode === "update" && originalProject?.slug !== projectData.slug) {
              projectsContext?.refreshProjects();
            }

            if (mode === "create") {
              onSuccess?.(result.data);
              projectsContext?.handleProjectAdded?.(result.data);
              toast.success("Project added successfully!");

              // Reset form
              setFormData({
                title: "",
                slug: "",
                description: "",
                category: "web",
              });
              setSelectedTags([]);
              setFormErrors({});
            } else {
              const updatedProject = result.data;
              onSuccess?.(updatedProject);
              projectsContext?.handleProjectUpdated?.(updatedProject);
              
              if (originalProject?.slug !== updatedProject.slug) {
                projectsContext?.refreshProjects();
              }

              toast.success("Project updated successfully!");
              setOriginalProject(updatedProject);

              if (project) {
                Object.assign(project, updatedProject);
              }

              setProjectUpdateKey(Date.now());

              // Update form with latest data
              setFormData({
                title: updatedProject.title || "",
                slug: updatedProject.slug || "",
                description: updatedProject.description || "",
                category: updatedProject.category || "web",
              });

              // Safely handle tags that might be undefined
              setSelectedTags(
                (updatedProject.tags || []).map((name) => ({
                  id: "",
                  name,
                }))
              );
            }
          }
        } catch (error) {
          console.error(`Failed to ${mode} project:`, error);
          setFormErrors((prev) => ({
            ...prev,
            server: error instanceof Error ? error.message : "Unknown error occurred",
          }));
        } finally {
          setIsSubmitting(false);
        }
      },
      selectedTags
    );
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    const currentTimeout = updateTimeoutRef.current;

    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const buttonText = isSubmitting
    ? mode === "create"
      ? "Adding Project..."
      : "Updating..."
    : submitButtonText || (mode === "create" ? "Add Project" : "Save Changes");

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full width-full p-4">
      {formTitle && <h2 className="text-lg font-semibold mb-2">{formTitle}</h2>}

      {formErrors.server && (
        <Alert variant="destructive" className="mb-4">
          <AnnoyedIcon className="h-4 w-4" />
          <AlertDescription>{formErrors.server}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
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
            <div className="flex gap-2">
              <Input
                id="slug"
                name="slug"
                placeholder="my-awesome-project"
                value={formData.slug}
                onChange={handleInputChange}
                className={`flex-1 ${formErrors.slug ? "border-red-500" : ""}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                title="Generate slug from title"
              >
                <RefreshCcwIcon className="h-4 w-4 mr-1" />
                Generate
              </Button>
            </div>
            {formErrors.slug && (
              <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Project Category <span className="text-red-500">*</span>
            </label>
            <Select
              key={`category-${formData.category}`}
              defaultValue={formData.category}
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value as ProjectCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <TagSelector
              projectId={project?.id}
              initialTags={selectedTags.map((tag) => tag.name)}
              onTagsChange={handleTagsChange}
              className="w-full"
            />
            {mode === "create" && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className=" mt-1 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Cant find a tag you need?
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted/50 shadow-sm">
                  <div className="text-xs text-muted-foreground">
                    You can request additional tags by editing your project later. Just make sure you stay within the 
                    <span className="text-purple-500"> {MAX_PROJECT_TAGS}</span> tag count limit or else it will be rejected.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
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
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Fields marked with <span className="text-red-500">*</span> are required
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          {showCancelButton && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
