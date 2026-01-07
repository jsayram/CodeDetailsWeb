/**
 * API Error Factory Functions
 * 
 * Provides easy-to-use functions for creating RFC 7807 compliant error responses.
 * These functions automatically include request context, timestamps, and helpful hints.
 * 
 * Usage:
 *   import { notFound, unauthorized, validationError } from "@/lib/api-errors";
 *   
 *   // Simple usage
 *   return notFound("profile", { identifier: username });
 *   
 *   // With custom message
 *   return unauthorized("You must be signed in to update your profile");
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { 
  ErrorCode, 
  ERROR_HINTS, 
  ERROR_STATUS_CODES 
} from "@/constants/error-codes";
import type { 
  ApiError, 
  ApiErrorDetails, 
  ErrorContext, 
  FieldError,
  ApiSuccess 
} from "@/types/api-response";

/**
 * Generate a unique request ID
 * Uses Vercel's request ID if available, otherwise generates a UUID
 */
async function getRequestId(): Promise<string> {
  try {
    const headersList = await headers();
    const vercelId = headersList.get("x-vercel-id");
    if (vercelId) return vercelId;
    
    const requestId = headersList.get("x-request-id");
    if (requestId) return requestId;
  } catch {
    // headers() might fail in some contexts
  }
  
  return `req_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Get the current request path
 */
async function getRequestPath(): Promise<string> {
  try {
    const headersList = await headers();
    const referer = headersList.get("referer");
    if (referer) {
      const url = new URL(referer);
      return url.pathname;
    }
  } catch {
    // headers() might fail in some contexts
  }
  return "/unknown";
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Base error builder
 */
async function buildError(
  code: ErrorCode,
  detail: string,
  options: {
    context?: ErrorContext;
    errors?: FieldError[];
    instance?: string;
    debugInfo?: {
      stack?: string;
      query?: string;
      internalMessage?: string;
    };
  } = {}
): Promise<ApiErrorDetails> {
  const status = ERROR_STATUS_CODES[code];
  const hint = ERROR_HINTS[code];
  const requestId = await getRequestId();
  const instance = options.instance || await getRequestPath();
  
  // Build the error title from the code
  const title = code
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
  
  const errorDetails: ApiErrorDetails = {
    type: `error://${code}`,
    title,
    status,
    detail,
    instance,
    code,
    timestamp: new Date().toISOString(),
    requestId,
    hint,
    context: options.context,
    errors: options.errors,
  };
  
  // Add debug info only in development
  if (isDevelopment() && options.debugInfo) {
    errorDetails._debug = {
      stack: options.debugInfo.stack,
      query: options.debugInfo.query,
      internalMessage: options.debugInfo.internalMessage,
    };
  }
  
  return errorDetails;
}

/**
 * Create an error response
 */
async function createErrorResponse(
  code: ErrorCode,
  detail: string,
  options: {
    context?: ErrorContext;
    errors?: FieldError[];
    instance?: string;
    debugInfo?: {
      stack?: string;
      query?: string;
      internalMessage?: string;
    };
  } = {}
): Promise<NextResponse<ApiError>> {
  const errorDetails = await buildError(code, detail, options);
  const status = ERROR_STATUS_CODES[code];
  
  return NextResponse.json(
    {
      success: false as const,
      error: errorDetails,
    },
    { status }
  );
}

// ============================================================================
// Convenience Factory Functions
// ============================================================================

/**
 * 401 Unauthorized - User is not authenticated
 */
export async function unauthorized(
  detail: string = "Authentication required",
  context?: ErrorContext
): Promise<NextResponse<ApiError>> {
  return createErrorResponse(ErrorCode.UNAUTHORIZED, detail, { context });
}

/**
 * 403 Forbidden - User lacks permission
 */
export async function forbidden(
  detail: string = "You do not have permission to perform this action",
  context?: ErrorContext
): Promise<NextResponse<ApiError>> {
  return createErrorResponse(ErrorCode.FORBIDDEN, detail, { context });
}

/**
 * 403 Not Owner - User doesn't own the resource
 */
export async function notOwner(
  resource: string,
  context?: ErrorContext
): Promise<NextResponse<ApiError>> {
  return createErrorResponse(
    ErrorCode.NOT_OWNER,
    `You do not own this ${resource}`,
    { context: { resource, ...context } }
  );
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export async function notFound(
  resource: string,
  options: {
    identifier?: string;
    identifierType?: string;
    detail?: string;
  } = {}
): Promise<NextResponse<ApiError>> {
  const detail = options.detail || 
    `The requested ${resource} was not found${options.identifier ? `: '${options.identifier}'` : ""}`;
  
  // Map common resources to specific error codes
  const codeMap: Record<string, ErrorCode> = {
    profile: ErrorCode.PROFILE_NOT_FOUND,
    project: ErrorCode.PROJECT_NOT_FOUND,
    user: ErrorCode.USER_NOT_FOUND,
    tag: ErrorCode.TAG_NOT_FOUND,
    category: ErrorCode.CATEGORY_NOT_FOUND,
  };
  
  const code = codeMap[resource.toLowerCase()] || ErrorCode.RESOURCE_NOT_FOUND;
  
  return createErrorResponse(code, detail, {
    context: {
      resource,
      identifier: options.identifier,
      identifierType: options.identifierType,
    },
  });
}

/**
 * 400 Validation Error - Request data is invalid
 */
export async function validationError(
  errors: FieldError[],
  detail: string = "Request validation failed"
): Promise<NextResponse<ApiError>> {
  return createErrorResponse(ErrorCode.VALIDATION_ERROR, detail, { errors });
}

/**
 * 400 Invalid Input - Generic bad request
 */
export async function invalidInput(
  detail: string,
  context?: ErrorContext
): Promise<NextResponse<ApiError>> {
  return createErrorResponse(ErrorCode.INVALID_INPUT, detail, { context });
}

/**
 * 409 Conflict - Resource already exists
 */
export async function conflict(
  resource: string,
  field: string,
  value?: string
): Promise<NextResponse<ApiError>> {
  const detail = value 
    ? `A ${resource} with ${field} '${value}' already exists`
    : `A ${resource} with this ${field} already exists`;
  
  // Map to specific conflict codes
  const codeMap: Record<string, ErrorCode> = {
    username: ErrorCode.USERNAME_TAKEN,
    slug: ErrorCode.SLUG_TAKEN,
    email: ErrorCode.EMAIL_ALREADY_EXISTS,
  };
  
  const code = codeMap[field.toLowerCase()] || ErrorCode.DUPLICATE_ENTRY;
  
  return createErrorResponse(code, detail, {
    context: { resource, field, value },
  });
}

/**
 * 429 Rate Limited
 */
export async function rateLimited(
  detail: string = "Too many requests. Please try again later.",
  retryAfter?: number
): Promise<NextResponse<ApiError>> {
  const response = await createErrorResponse(ErrorCode.RATE_LIMIT_EXCEEDED, detail);
  
  if (retryAfter) {
    response.headers.set("Retry-After", retryAfter.toString());
  }
  
  return response;
}

/**
 * 500 Internal Server Error
 */
export async function serverError(
  error?: Error | unknown,
  detail: string = "An unexpected error occurred"
): Promise<NextResponse<ApiError>> {
  const debugInfo = error instanceof Error ? {
    stack: error.stack,
    internalMessage: error.message,
  } : undefined;
  
  // Log the full error server-side
  console.error("[API Error]", error);
  
  return createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR, detail, {
    debugInfo,
  });
}

/**
 * 500 Database Error
 */
export async function databaseError(
  error?: Error | unknown,
  detail: string = "A database error occurred"
): Promise<NextResponse<ApiError>> {
  const debugInfo = error instanceof Error ? {
    stack: error.stack,
    internalMessage: error.message,
  } : undefined;
  
  // Log the full error server-side
  console.error("[Database Error]", error);
  
  return createErrorResponse(ErrorCode.DATABASE_ERROR, detail, {
    debugInfo,
  });
}

// ============================================================================
// Success Response Helper
// ============================================================================

/**
 * Create a successful response
 */
export function success<T>(
  data: T,
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  }
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return NextResponse.json(response);
}
