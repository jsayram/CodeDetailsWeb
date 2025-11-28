/**
 * API Response Types for CodeDetails
 * 
 * Following RFC 7807 "Problem Details for HTTP APIs" standard with extensions.
 * Provides consistent, machine-parseable responses with detailed debugging context.
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 * 
 * Example success response:
 * {
 *   success: true,
 *   data: { ... }
 * }
 * 
 * Example error response:
 * {
 *   success: false,
 *   error: {
 *     type: "error://PROFILE_NOT_FOUND",
 *     title: "Profile Not Found",
 *     status: 404,
 *     detail: "No profile exists for username 'john_doe'",
 *     instance: "/api/profiles/john_doe",
 *     code: "PROFILE_NOT_FOUND",
 *     timestamp: "2025-11-28T10:30:00Z",
 *     requestId: "req_a1b2c3d4",
 *     context: { resource: "profile", identifier: "john_doe" },
 *     hint: "Check if username is spelled correctly..."
 *   }
 * }
 */

import { ErrorCode } from "@/constants/error-codes";

/**
 * Successful API response
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  /** Optional metadata about the response */
  meta?: {
    /** Total count for paginated responses */
    total?: number;
    /** Current page */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Whether there are more results */
    hasMore?: boolean;
  };
}

/**
 * Individual field validation error
 */
export interface FieldError {
  /** The field that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** The value that was received (optional, may be omitted for security) */
  received?: unknown;
  /** The expected format or value */
  expected?: string;
}

/**
 * Context about what triggered the error
 */
export interface ErrorContext {
  /** The type of resource being accessed */
  resource?: string;
  /** The identifier used to look up the resource */
  identifier?: string;
  /** The type of identifier (e.g., "username", "id", "slug") */
  identifierType?: string;
  /** The operation being attempted */
  operation?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** The user ID making the request (if authenticated) */
  userId?: string;
  /** Additional context-specific data */
  [key: string]: unknown;
}

/**
 * Debug information (only included in development)
 */
export interface DebugInfo {
  /** Stack trace */
  stack?: string;
  /** Database query that failed */
  query?: string;
  /** Request duration */
  duration?: string;
  /** Internal error message */
  internalMessage?: string;
}

/**
 * RFC 7807 Problem Details with extensions
 */
export interface ApiErrorDetails {
  // RFC 7807 Standard Fields
  /** A URI reference that identifies the error type (searchable code reference) */
  type: string;
  /** A short, human-readable summary of the problem */
  title: string;
  /** The HTTP status code */
  status: number;
  /** A human-readable explanation specific to this occurrence */
  detail: string;
  /** A URI reference that identifies the specific occurrence (request path) */
  instance: string;
  
  // Extensions for debugging
  /** Machine-readable error code */
  code: ErrorCode;
  /** When the error occurred (ISO 8601) */
  timestamp: string;
  /** Unique identifier for this request (for log correlation) */
  requestId: string;
  
  // Contextual information
  /** What triggered the error */
  context?: ErrorContext;
  /** Actionable hint to fix the issue */
  hint: string;
  
  // Validation errors (when applicable)
  /** Field-level validation errors */
  errors?: FieldError[];
  
  // Debug info (development only)
  /** Debug information - only present in development */
  _debug?: DebugInfo;
}

/**
 * Error API response
 */
export interface ApiError {
  success: false;
  error: ApiErrorDetails;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiError {
  return response.success === false;
}

/**
 * Helper to extract data from a successful response
 * @throws Error if response is not successful
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  throw new Error(`API Error: ${response.error.detail}`);
}
