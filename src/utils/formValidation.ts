import { FormEvent, Dispatch, SetStateAction } from "react";

/**
 * Error type for project form validation
 */
export type ProjectFormErrors = {
  title?: string;
  slug?: string;
  server?: string;
  [key: string]: string | undefined;
};

/**
 * Project form data type
 */
export type ProjectFormData = {
  title: string;
  slug: string;
  tags: string;
  description: string;
  difficulty: string;
};

/**
 * Validates a project form data
 * @param formData Project form data to validate
 * @returns An object containing validation errors, empty if valid
 */
export const validateProjectForm = (
  formData: ProjectFormData
): ProjectFormErrors => {
  const errors: ProjectFormErrors = {};

  // Trim values to ensure consistent validation
  const trimmedTitle = formData.title.trim();
  const trimmedSlug = formData.slug.trim();

  if (!trimmedTitle) {
    errors.title = "Project title is required";
  } else if (trimmedTitle.length < 3) {
    errors.title = "Project title must be at least 3 characters";
  }

  if (!trimmedSlug) {
    errors.slug = "Project slug is required";
  } else if (!/^[a-z0-9]+([-][a-z0-9]+)*$/.test(trimmedSlug)) {
    errors.slug =
      "Slug must start with a letter or number, and contain only lowercase letters, numbers, and hyphens";
  }

  return errors;
};

/**
 * Helper to handle form submission with validation
 */
export const handleFormSubmit = <
  T extends Record<string, string | number | boolean | string[]>
>(
  e: FormEvent,
  formData: T,
  validateFn: (data: T) => Record<string, string | undefined>,
  setFormErrors: Dispatch<SetStateAction<Record<string, string | undefined>>>,
  onValid: () => Promise<void> | void
) => {
  e.preventDefault();

  // Clear previous errors and start fresh
  const newErrors = validateFn(formData);

  // Update form errors state
  setFormErrors(newErrors);

  if (Object.keys(newErrors).length === 0) {
    // Only proceed if validation passes
    return onValid();
  }
};
