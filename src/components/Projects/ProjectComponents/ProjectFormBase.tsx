"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ProjectFormData,
} from "@/utils/formValidation";
import { TagInfo } from "@/db/operations/tag-operations";
import { TagSelector } from "./TagSelectorComponent";
import { slugify } from "@/utils/stringUtils";

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
import { AnnoyedIcon, RefreshCcwIcon } from "lucide-react";

interface ProjectFormBaseProps {
  // Project data (if updating)
  project?: Project | null;
  // Mode (create or update)
  mode: 'create' | 'update';
  // Callbacks
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
  // UI customization
  className?: string;
  formTitle?: string;
  submitButtonText?: string;
  showCancelButton?: boolean;
}

export function ProjectFormBase({
  project,
  mode = 'create',
  onSuccess,
  onCancel,
  className = "",
  formTitle,
  submitButtonText,
  showCancelButton = true,
}: ProjectFormBaseProps) {
  // Get global project context handler
  const projectsContext = useProjects();
  
  // Get current user information from Clerk
  const { userId } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    slug: "",
    tags: "",
    description: "",
    difficulty: "beginner",
  });
  
  // Add a key to track project data updates and force re-initialization
  const [projectUpdateKey, setProjectUpdateKey] = useState(Date.now());

  // Store selected tags separately from form data
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);

  // Track the original project data for comparison when updating
  const [originalProject, setOriginalProject] = useState<Project | null>(null);

  // Initialize form data when the project changes
  useEffect(() => {
    if (project && mode === 'update') {
      // Store the original project for later comparison
      setOriginalProject(project);

      // Update form data with project values
      setFormData({
        title: project.title || "",
        slug: project.slug || "", // Ensure slug is properly loaded from project
        tags: project.tags ? project.tags.join(", ") : "",
        description: project.description || "",
        difficulty: project.difficulty || "beginner",
      });

      console.log("Loaded project for edit with slug:", project.slug);

      // Reset errors when project changes
      setFormErrors({});
      
      // We'll let the TagSelector handle the initialization of tags
      setSelectedTags([]);
    }
  }, [project, mode, projectUpdateKey]); // Add projectUpdateKey as a dependency

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

  // Handle select changes (for difficulty dropdown)
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Use a ref to track if component is mounted to avoid state updates during render
  const isMounted = React.useRef(false);

  // Set mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle tag changes from TagSelector component  TODO: NEED TO FIX TAGS
  const handleTagsChange = useCallback((tags: TagInfo[]) => {
    // Use a safe way to update state to avoid "Cannot update during render" errors
    setTimeout(() => {
      if (!isMounted.current) return;

      setSelectedTags(tags);

      // Update form data with tag names as well for consistency
      const tagNames = tags.map((tag) => tag.name);
      setFormData((prev) => ({
        ...prev,
        tags: tagNames.join(", "),
      }));
    }, 0);
  }, []);

  // Generate a slug from the title
  const generateSlug = useCallback(() => {
    if (formData.title) {
      // Use our slugify utility to generate a clean slug from the title
      const newSlug = slugify(formData.title);
      
      // Update formData with the new slug
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
      
      // Clear any errors associated with the slug field
      if (formErrors.slug) {
        setFormErrors(prev => ({
          ...prev,
          slug: undefined
        }));
      }
      
      console.log("Generated slug:", newSlug);
    }
  }, [formData.title, formErrors.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    handleFormSubmit(
      e,
      formData,
      validateProjectForm,
      setFormErrors,
      async () => {
        if (mode === 'update' && !project?.id) {
          setFormErrors((prev) => ({
            ...prev,
            server: "Project ID is missing",
          }));
          return;
        }

        // Check that we have a valid user ID before proceeding
        if (!userId) {
          setFormErrors((prev) => ({
            ...prev,
            server: "You must be logged in to perform this action",
          }));
          return;
        }

        setIsSubmitting(true);

        try {
          // Prepare the project data
          const projectData = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description || undefined,
            // Use selected tags instead of comma-separated string
            tags: selectedTags.map((tag) => tag.name),
            difficulty: formData.difficulty as
              | "beginner"
              | "intermediate"
              | "advanced",
          };

          let result;
          if (mode === 'create') {
            // Use the server action to create the project
            result = await createProject(projectData as InsertProject, userId);
          } else {
            // Use the server action to update the project
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
            // If we're updating, check if slug changed
            if (mode === 'update' && originalProject?.slug !== projectData.slug) {
              console.log(
                `Project slug changed from ${originalProject?.slug} to ${projectData.slug}`
              );
            }

            // Call the appropriate handler based on mode
            if (mode === 'create') {
              if (onSuccess) {
                onSuccess(result.data);
              } else if (projectsContext?.handleProjectAdded) {
                projectsContext.handleProjectAdded(result.data);
              }
              toast.success("Project added successfully!");
              
              // Reset form after creation
              setFormData({
                title: "",
                slug: "",
                tags: "",
                description: "",
                difficulty: "beginner",
              });
              setSelectedTags([]);
              setFormErrors({});
            } else {
              // Store the updated project data
              const updatedProject = result.data;
              
              if (onSuccess) {
                onSuccess(updatedProject);
              } 
              
              if (projectsContext?.handleProjectUpdated) {
                // Update the project in the global context
                projectsContext.handleProjectUpdated(updatedProject);
                
                // Force a refresh of projects to ensure UI is updated with latest data
                projectsContext.refreshProjects();
              }
              
              toast.success("Project updated successfully!");
              
              // Update the originalProject to match the latest changes
              setOriginalProject(updatedProject);
              
              // Also update the project state to ensure formData is set correctly on reopen
              if (project) {
                Object.assign(project, updatedProject);
              }
              
              // Force UI to update by setting a new key to trigger re-initialization
              setProjectUpdateKey(Date.now());
              
              // Log the updated slug to confirm it changed
              console.log("Project updated with new slug:", updatedProject.slug);
              
              // Force re-render by updating form data
              setFormData({
                title: updatedProject.title || "",
                slug: updatedProject.slug || "",
                tags: updatedProject.tags ? updatedProject.tags.join(", ") : "",
                description: updatedProject.description || "",
                difficulty: updatedProject.difficulty || "beginner",
              });
            }
          }
        } catch (error) {
          console.error(`Failed to ${mode} project:`, error);
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

  // Determine button text based on mode and loading state
  const buttonText = isSubmitting
    ? mode === 'create' ? "Adding Project..." : "Updating..."
    : submitButtonText || (mode === 'create' ? "Add Project" : "Save Changes");

  return (
    <>
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
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <TagSelector
              projectId={project?.id}
              initialTags={mode === 'update' ? (project?.tags || []) : 
                (formData.tags ? formData.tags.split(",").map(t => t.trim()) : [])}
              onTagsChange={handleTagsChange}
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
            <label htmlFor="difficulty" className="text-sm font-medium">
              Difficulty Level
            </label>
            <Select
              key={`difficulty-${formData.difficulty}`}
              defaultValue={formData.difficulty}
              value={formData.difficulty}
              onValueChange={(value) => handleSelectChange("difficulty", value)}
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

        <div className="flex justify-end mt-4 space-x-2">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {buttonText}
          </Button>
        </div>
      </form>
    </>
  );
}