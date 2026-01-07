/**
 * Error Codes for CodeDetails API
 * 
 * Following RFC 7807 "Problem Details for HTTP APIs" standard.
 * Each error code has a corresponding hint to help developers fix the issue.
 * 
 * Usage:
 *   import { ErrorCode, ERROR_HINTS } from "@/constants/error-codes";
 *   const hint = ERROR_HINTS[ErrorCode.PROFILE_NOT_FOUND];
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */

export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  
  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  NOT_OWNER = "NOT_OWNER",
  
  // Not found errors (404)
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  TAG_NOT_FOUND = "TAG_NOT_FOUND",
  CATEGORY_NOT_FOUND = "CATEGORY_NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  DOC_NOT_FOUND = "DOC_NOT_FOUND",
  
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  PROFANITY_DETECTED = "PROFANITY_DETECTED",
  
  // Conflict errors (409)
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  USERNAME_TAKEN = "USERNAME_TAKEN",
  SLUG_TAKEN = "SLUG_TAKEN",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  
  // Server errors (500)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Business logic errors
  PROJECT_LIMIT_REACHED = "PROJECT_LIMIT_REACHED",
  PROJECT_DELETED = "PROJECT_DELETED",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  DOC_ALREADY_LINKED = "DOC_ALREADY_LINKED",
  PROJECT_HAS_DOC = "PROJECT_HAS_DOC",
}

/**
 * Human-readable hints for each error code.
 * These help developers understand what went wrong and how to fix it.
 */
export const ERROR_HINTS: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: 
    "Authentication required. Ensure you are signed in and your session is valid.",
  [ErrorCode.INVALID_TOKEN]: 
    "The provided authentication token is invalid. Try signing out and signing back in.",
  [ErrorCode.TOKEN_EXPIRED]: 
    "Your session has expired. Please sign in again to continue.",
  
  // Authorization
  [ErrorCode.FORBIDDEN]: 
    "You do not have permission to perform this action.",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 
    "Your account does not have the required permissions for this operation.",
  [ErrorCode.NOT_OWNER]: 
    "Only the owner of this resource can perform this action.",
  
  // Not found
  [ErrorCode.PROFILE_NOT_FOUND]: 
    "The requested user profile was not found. Check if the username is spelled correctly or if the user may have changed their username.",
  [ErrorCode.PROJECT_NOT_FOUND]: 
    "The requested project was not found. It may have been deleted or the slug may be incorrect.",
  [ErrorCode.USER_NOT_FOUND]: 
    "The specified user does not exist. They may have deleted their account.",
  [ErrorCode.TAG_NOT_FOUND]: 
    "The specified tag does not exist.",
  [ErrorCode.CATEGORY_NOT_FOUND]: 
    "The specified category does not exist. Check available categories.",
  [ErrorCode.RESOURCE_NOT_FOUND]: 
    "The requested resource was not found.",
  [ErrorCode.DOC_NOT_FOUND]: 
    "The requested generated documentation was not found. It may have been deleted.",
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: 
    "The request data failed validation. Check the 'errors' field for specific issues.",
  [ErrorCode.INVALID_INPUT]: 
    "One or more input values are invalid. Review the request body.",
  [ErrorCode.MISSING_REQUIRED_FIELD]: 
    "A required field is missing from the request.",
  [ErrorCode.INVALID_FORMAT]: 
    "A field has an invalid format. Check the expected format in the API documentation.",
  [ErrorCode.PROFANITY_DETECTED]: 
    "The input contains inappropriate content that violates community guidelines.",
  
  // Conflict
  [ErrorCode.DUPLICATE_ENTRY]: 
    "This record already exists. Check for duplicate values.",
  [ErrorCode.USERNAME_TAKEN]: 
    "This username is already in use. Please choose a different username.",
  [ErrorCode.SLUG_TAKEN]: 
    "This project URL slug is already in use. Try a different title or add a unique identifier.",
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 
    "An account with this email already exists.",
  
  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 
    "You have exceeded the rate limit. Please wait before making more requests.",
  [ErrorCode.TOO_MANY_REQUESTS]: 
    "Too many requests in a short period. Slow down and try again.",
  
  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 
    "An unexpected error occurred on the server. If this persists, please contact support.",
  [ErrorCode.DATABASE_ERROR]: 
    "A database error occurred. Please try again. If persistent, contact support.",
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 
    "An external service is unavailable. Please try again later.",
  
  // Business logic
  [ErrorCode.PROJECT_LIMIT_REACHED]: 
    "You have reached your project limit. Upgrade your plan or delete existing projects.",
  [ErrorCode.PROJECT_DELETED]: 
    "This project has been deleted and cannot be accessed.",
  [ErrorCode.ACCOUNT_SUSPENDED]: 
    "Your account has been suspended. Contact support for assistance.",
  [ErrorCode.DOC_ALREADY_LINKED]: 
    "This documentation is already linked to a project. Unlink it first to assign to a different project.",
  [ErrorCode.PROJECT_HAS_DOC]: 
    "This project already has documentation linked. Unlink the existing documentation first or replace it.",
};

/**
 * HTTP status codes for each error type
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 401 Unauthorized
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  
  // 403 Forbidden
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.NOT_OWNER]: 403,
  
  // 404 Not Found
  [ErrorCode.PROFILE_NOT_FOUND]: 404,
  [ErrorCode.PROJECT_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.TAG_NOT_FOUND]: 404,
  [ErrorCode.CATEGORY_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.DOC_NOT_FOUND]: 404,
  
  // 400 Bad Request
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.PROFANITY_DETECTED]: 400,
  
  // 409 Conflict
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.USERNAME_TAKEN]: 409,
  [ErrorCode.SLUG_TAKEN]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  
  // 429 Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  
  // 500 Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,
  
  // 400/403 Business Logic
  [ErrorCode.PROJECT_LIMIT_REACHED]: 403,
  [ErrorCode.PROJECT_DELETED]: 410, // Gone
  [ErrorCode.ACCOUNT_SUSPENDED]: 403,
  [ErrorCode.DOC_ALREADY_LINKED]: 409,
  [ErrorCode.PROJECT_HAS_DOC]: 409,
};
