import { FormEvent } from "react";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";

/**
 * Error type for project form validation
 */
export interface ProjectFormErrors {
  title?: string;
  slug?: string;
  tags?: string;
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
  tags: string;
  description: string;
  category: ProjectCategory;
}

/**
 * Validates a project form data
 * @param data Project form data to validate
 * @returns An object containing validation errors, empty if valid
 */
export const validateProjectForm = (data: ProjectFormData): ProjectFormErrors => {
  const errors: ProjectFormErrors = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Title is required";
  } else if (data.title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (data.title.length > 100) {
    errors.title = "Title must be less than 100 characters";
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.slug = "Slug is required";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug =
      "Slug must contain only lowercase letters, numbers, and hyphens";
  }

  if (!data.category || !(data.category in PROJECT_CATEGORIES)) {
    errors.category = "Please select a valid category";
  }

  return errors;
};

/**
 * Helper to handle form submission with validation
 */
export const handleFormSubmit = async (
  e: FormEvent,
  formData: ProjectFormData,
  validateFn: (data: ProjectFormData) => ProjectFormErrors,
  setErrors: (errors: ProjectFormErrors) => void,
  onSuccess: () => Promise<void>
) => {
  e.preventDefault();
  setErrors({});

  const errors = validateFn(formData);
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  await onSuccess();
};
