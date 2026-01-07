/**
 * RepoScrapper Errors
 * RFC 7807 compliant error classes for repository scraping operations
 */

import type { ProblemDetail } from './types';

// ============================================================================
// Error Type Constants
// ============================================================================

export const REPO_ERROR_TYPES = {
  GITHUB_AUTH: 'https://api.example.com/problems/github-auth-error',
  GITHUB_RATE_LIMIT: 'https://api.example.com/problems/github-rate-limited',
  GITHUB_NOT_FOUND: 'https://api.example.com/problems/github-not-found',
  GITHUB_API: 'https://api.example.com/problems/github-api-error',
  CRAWLER_ERROR: 'https://api.example.com/problems/crawler-error',
  CACHE_ERROR: 'https://api.example.com/problems/cache-error',
  GENERATION_ERROR: 'https://api.example.com/problems/generation-error',
  VALIDATION_ERROR: 'https://api.example.com/problems/validation-error',
  NETWORK_ERROR: 'https://api.example.com/problems/network-error',
  TIMEOUT_ERROR: 'https://api.example.com/problems/timeout-error',
} as const;

export type RepoErrorType = typeof REPO_ERROR_TYPES[keyof typeof REPO_ERROR_TYPES];

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * RFC 7807 compliant error for repository operations
 */
export class RepoError extends Error {
  public readonly type: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly instance?: string;
  public readonly extensions: Record<string, unknown>;

  constructor(
    type: string,
    title: string,
    status: number,
    detail: string,
    instance?: string,
    extensions: Record<string, unknown> = {}
  ) {
    super(title);
    this.name = 'RepoError';
    this.type = type;
    this.status = status;
    this.detail = detail;
    this.instance = instance;
    this.extensions = extensions;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, RepoError.prototype);
  }

  /**
   * Convert to RFC 7807 Problem Detail format
   */
  toProblemDetail(): ProblemDetail {
    return {
      type: this.type,
      title: this.message,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
      ...this.extensions,
    };
  }

  /**
   * Create from a generic Error
   */
  static fromError(error: unknown, defaultType: string = REPO_ERROR_TYPES.CRAWLER_ERROR): RepoError {
    if (error instanceof RepoError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new RepoError(
      defaultType,
      'Repository Operation Error',
      500,
      message
    );
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a generic repo error
 */
export function createRepoError(
  type: string,
  title: string,
  status: number,
  detail: string,
  extensions?: Record<string, unknown>
): RepoError {
  return new RepoError(type, title, status, detail, undefined, extensions);
}

/**
 * GitHub authentication error
 */
export function githubAuthError(detail?: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.GITHUB_AUTH,
    'GitHub Authentication Failed',
    401,
    detail || 'Invalid or expired GitHub token. Please check your credentials.',
    undefined,
    {
      helpUrl: 'https://github.com/settings/tokens',
      instructions: [
        'Go to GitHub Settings > Developer settings > Personal access tokens',
        'Generate a new token with "repo" scope for private repos or "public_repo" for public only',
        'Copy the token and provide it in the configuration',
      ],
    }
  );
}

/**
 * GitHub rate limit error
 */
export function githubRateLimitError(
  remaining?: number,
  resetTime?: Date
): RepoError {
  const resetStr = resetTime ? ` Rate limit resets at ${resetTime.toLocaleTimeString()}.` : '';
  
  return new RepoError(
    REPO_ERROR_TYPES.GITHUB_RATE_LIMIT,
    'GitHub Rate Limit Exceeded',
    429,
    `GitHub API rate limit exceeded. ${remaining !== undefined ? `Remaining: ${remaining}.` : ''}${resetStr}`,
    undefined,
    {
      remaining,
      resetTime: resetTime?.toISOString(),
      helpUrl: 'https://docs.github.com/en/rest/rate-limit',
      instructions: [
        'Wait for the rate limit to reset',
        'Use a GitHub personal access token to increase your limit from 60 to 5,000 requests/hour',
        'Consider caching responses to reduce API calls',
      ],
    }
  );
}

/**
 * GitHub repository not found error
 */
export function githubNotFoundError(repoUrl: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.GITHUB_NOT_FOUND,
    'Repository Not Found',
    404,
    `The repository "${repoUrl}" was not found. This could mean:\n` +
    `• The repository URL is incorrect (check spelling)\n` +
    `• The repository is private (add GITHUB_TOKEN to .env.local)\n` +
    `• The repository has been deleted or renamed\n\n` +
    `Expected format: https://github.com/owner/repo or owner/repo`,
    undefined,
    {
      repoUrl,
      instructions: [
        'Verify the repository URL is correct (e.g., https://github.com/facebook/react)',
        'For private repositories, add GITHUB_TOKEN=ghp_xxxx to your .env.local file',
        'Check if the repository has been renamed or deleted',
        'Try with a public repository first to verify the setup works',
      ],
    }
  );
}

/**
 * Generic GitHub API error
 */
export function githubApiError(status: number, message: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.GITHUB_API,
    'GitHub API Error',
    status,
    message
  );
}

/**
 * Crawler operation error
 */
export function crawlerError(detail: string, phase?: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.CRAWLER_ERROR,
    'Crawler Error',
    500,
    detail,
    undefined,
    phase ? { phase } : {}
  );
}

/**
 * Cache operation error
 */
export function cacheError(detail: string, operation?: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.CACHE_ERROR,
    'Cache Error',
    500,
    detail,
    undefined,
    operation ? { operation } : {}
  );
}

/**
 * Documentation generation error
 */
export function generationError(detail: string, phase?: string, chapterSlug?: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.GENERATION_ERROR,
    'Generation Error',
    500,
    detail,
    undefined,
    { phase, chapterSlug }
  );
}

/**
 * Validation error
 */
export function validationError(detail: string, field?: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.VALIDATION_ERROR,
    'Validation Error',
    400,
    detail,
    undefined,
    field ? { field } : {}
  );
}

/**
 * Network error
 */
export function networkError(detail: string): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.NETWORK_ERROR,
    'Network Error',
    503,
    detail,
    undefined,
    {
      instructions: [
        'Check your internet connection',
        'Verify the GitHub API is accessible',
        'Try again in a few moments',
      ],
    }
  );
}

/**
 * Timeout error
 */
export function timeoutError(operation: string, timeoutMs: number): RepoError {
  return new RepoError(
    REPO_ERROR_TYPES.TIMEOUT_ERROR,
    'Operation Timed Out',
    504,
    `The ${operation} operation timed out after ${timeoutMs}ms.`,
    undefined,
    {
      operation,
      timeoutMs,
      instructions: [
        'Try with a smaller repository',
        'Reduce the number of files to process',
        'Check your network connection',
      ],
    }
  );
}

// ============================================================================
// Error Parsing Utilities
// ============================================================================

/**
 * Parse GitHub API error response into a RepoError
 */
export function parseGitHubError(
  status: number,
  errorText: string,
  headers?: Headers
): RepoError {
  // Check for bad credentials
  if (status === 401 || errorText.includes('Bad credentials')) {
    return githubAuthError(errorText);
  }

  // Check for rate limit
  if (status === 403 && errorText.includes('rate limit')) {
    let resetTime: Date | undefined;
    let remaining: number | undefined;

    if (headers) {
      const resetHeader = headers.get('x-ratelimit-reset');
      const remainingHeader = headers.get('x-ratelimit-remaining');

      if (resetHeader) {
        resetTime = new Date(parseInt(resetHeader) * 1000);
      }
      if (remainingHeader) {
        remaining = parseInt(remainingHeader);
      }
    }

    return githubRateLimitError(remaining, resetTime);
  }

  // Check for not found
  if (status === 404) {
    return githubNotFoundError(errorText);
  }

  // Generic API error
  return githubApiError(status, errorText);
}

/**
 * Check if an error is a specific type
 */
export function isRepoErrorType(error: unknown, type: RepoErrorType): boolean {
  return error instanceof RepoError && error.type === type;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof RepoError)) return false;

  // Rate limits and network errors are retryable
  const retryableTypes = [
    REPO_ERROR_TYPES.GITHUB_RATE_LIMIT,
    REPO_ERROR_TYPES.NETWORK_ERROR,
    REPO_ERROR_TYPES.TIMEOUT_ERROR,
  ] as const;
  
  return (retryableTypes as readonly string[]).includes(error.type);
}
