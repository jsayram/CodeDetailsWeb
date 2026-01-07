/**
 * Server Action Error Helpers
 * 
 * RFC 7807 compliant error responses for server actions.
 * Unlike api-errors.ts which returns NextResponse, these return plain objects
 * suitable for server actions.
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */

import { 
  ErrorCode, 
  ERROR_HINTS, 
  ERROR_STATUS_CODES 
} from "@/constants/error-codes";
import type { 
  ApiErrorDetails, 
  ErrorContext, 
  FieldError 
} from "@/types/api-response";

// ============================================================================
// Server Action Result Types
// ============================================================================

/**
 * Successful action result
 */
export interface ActionSuccess<T = unknown> {
  success: true;
  data: T;
}

/**
 * Error action result with RFC 7807 details
 */
export interface ActionError {
  success: false;
  error: string;
  /** RFC 7807 error code */
  code?: ErrorCode;
  /** Field-level validation errors */
  validationErrors?: FieldError[];
  /** Hint for fixing the error */
  hint?: string;
}

/**
 * Union type for all action results
 */
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionError;

// ============================================================================
// Error Builder Functions
// ============================================================================

/**
 * Create a validation error response
 */
export function validationError(
  message: string,
  validationErrors?: FieldError[],
  hint?: string
): ActionError {
  return {
    success: false,
    error: message,
    code: ErrorCode.VALIDATION_ERROR,
    validationErrors,
    hint: hint ?? ERROR_HINTS[ErrorCode.VALIDATION_ERROR],
  };
}

/**
 * Create a profanity error response
 */
export function profanityError(
  field: string,
  message?: string
): ActionError {
  return {
    success: false,
    error: message ?? `The ${field} contains inappropriate content`,
    code: ErrorCode.PROFANITY_DETECTED,
    validationErrors: [{
      field,
      message: message ?? `${field} contains inappropriate content`,
    }],
    hint: ERROR_HINTS[ErrorCode.PROFANITY_DETECTED],
  };
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedError(
  message?: string
): ActionError {
  return {
    success: false,
    error: message ?? "Authentication required",
    code: ErrorCode.UNAUTHORIZED,
    hint: ERROR_HINTS[ErrorCode.UNAUTHORIZED],
  };
}

/**
 * Create a forbidden/not owner error response
 */
export function forbiddenError(
  message?: string
): ActionError {
  return {
    success: false,
    error: message ?? "You do not have permission to perform this action",
    code: ErrorCode.FORBIDDEN,
    hint: ERROR_HINTS[ErrorCode.FORBIDDEN],
  };
}

/**
 * Create a not owner error response
 */
export function notOwnerError(
  resource: string
): ActionError {
  return {
    success: false,
    error: `You do not own this ${resource}`,
    code: ErrorCode.NOT_OWNER,
    hint: ERROR_HINTS[ErrorCode.NOT_OWNER],
  };
}

/**
 * Create a not found error response
 */
export function notFoundError(
  resource: string,
  code?: ErrorCode
): ActionError {
  const errorCode = code ?? ErrorCode.RESOURCE_NOT_FOUND;
  return {
    success: false,
    error: `${resource} not found`,
    code: errorCode,
    hint: ERROR_HINTS[errorCode],
  };
}

/**
 * Create a duplicate entry error response
 */
export function duplicateError(
  field: string,
  message?: string
): ActionError {
  return {
    success: false,
    error: message ?? `A ${field} with this value already exists`,
    code: ErrorCode.DUPLICATE_ENTRY,
    validationErrors: [{
      field,
      message: message ?? `${field} already exists`,
    }],
    hint: ERROR_HINTS[ErrorCode.DUPLICATE_ENTRY],
  };
}

/**
 * Create a server error response
 */
export function serverError(
  error?: Error | unknown,
  message?: string
): ActionError {
  // Log the full error server-side
  if (error) {
    console.error("[Server Action Error]", error);
  }
  
  return {
    success: false,
    error: message ?? "An unexpected error occurred",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    hint: ERROR_HINTS[ErrorCode.INTERNAL_SERVER_ERROR],
  };
}

/**
 * Create a success response
 */
export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Parse Zod validation errors into RFC 7807 FieldError format
 */
export function parseZodErrors(
  zodIssues: Array<{ path: (string | number)[]; message: string }>
): FieldError[] {
  return zodIssues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Create a validation error from Zod safeParse result
 */
export function zodValidationError(
  zodResult: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } }
): ActionError {
  const firstError = zodResult.error.issues[0];
  const validationErrors = parseZodErrors(zodResult.error.issues);
  
  return validationError(
    firstError.message,
    validationErrors
  );
}
