/**
 * Zod Schemas Index
 * Central export for all validation schemas used across the application
 */

// Profile schemas
export {
  updateProfileSchema,
  createProfileSchema,
  formatZodErrors,
  type UpdateProfileInput,
  type CreateProfileInput,
} from './profile';

// Project schemas
export {
  projectLinkSchema,
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectQueryInput,
} from './project';

// Tag schemas
export {
  tagNameSchema,
  tagDescriptionSchema,
  tagArraySchema,
  submitTagSchema,
  approveTagSchema,
  addProjectTagsSchema,
  removeProjectTagSchema,
  formatTagZodErrors,
  type SubmitTagInput,
  type ApproveTagInput,
  type AddProjectTagsInput,
  type RemoveProjectTagInput,
} from './tag';

// Revalidate schemas
export {
  cacheTagSchema,
  revalidateRequestSchema,
  formatRevalidateZodErrors,
  type RevalidateRequest,
} from './revalidate';

// URL validation schemas
export {
  urlValidationRequestSchema,
  formatUrlValidationZodErrors,
  type UrlValidationRequest,
} from './url-validation';
