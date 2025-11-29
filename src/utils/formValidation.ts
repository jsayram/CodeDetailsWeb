import { FormEvent } from "react";
import { PROJECT_CATEGORIES, ProjectCategory as BaseProjectCategory } from "@/constants/project-categories";
import { TagInfo } from "@/db/operations/tag-operations";
import { 
  MAX_PROJECT_TAGS, 
  PROJECT_TEXT_LIMITS,
} from "@/constants/project-limits";

export type ProjectCategory = BaseProjectCategory;

/**
 * Error type for project form validation
 */
export interface ProjectFormErrors {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  server?: string;
}

/**
 * Project form data type
 */
export interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
}

/**
 * Validates a project form data
 * @param data Project form data to validate
 * @param tags Optional list of tags for validation
 * @returns An object containing validation errors, empty if valid
 */
export const validateProjectForm = (
  data: ProjectFormData,
  tags?: TagInfo[]
): ProjectFormErrors => {
  const errors: ProjectFormErrors = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Title is required";
  } else if (data.title.length < PROJECT_TEXT_LIMITS.MIN_TITLE_LENGTH) {
    errors.title = `Title must be at least ${PROJECT_TEXT_LIMITS.MIN_TITLE_LENGTH} characters`;
  } else if (data.title.length > PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH) {
    errors.title = `Title must be less than ${PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH} characters`;
  }

  // Slug validation
  if (!data.slug || data.slug.trim().length === 0) {
    errors.slug = "Slug is required";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
  } else if (data.slug.length > PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH) {
    errors.slug = `Slug must be less than ${PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH} characters`;
  }

  // Category validation
  if (!data.category || !(data.category in PROJECT_CATEGORIES)) {
    errors.category = "Please select a valid category";
  }

  // Description length validation
  if (data.description && data.description.length > PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be less than ${PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
  }

  // Tag limit validation
  if (tags && tags.length > MAX_PROJECT_TAGS) {
    errors.server = `Projects can have a maximum of ${MAX_PROJECT_TAGS} tags`;
  }

  return errors;
};

/**
 * Helper to handle form submission with validation
 */
export const handleFormSubmit = async (
  e: FormEvent,
  formData: ProjectFormData,
  validateFn: (data: ProjectFormData, tags?: TagInfo[]) => ProjectFormErrors,
  setErrors: (errors: ProjectFormErrors) => void,
  onSuccess: () => Promise<void>,
  tags?: TagInfo[]
) => {
  e.preventDefault();
  setErrors({});

  const errors = validateFn(formData, tags);
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  try {
    await onSuccess();
  } catch (error) {
    console.error("Form submission error:", error);
    setErrors({
      server: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
};
