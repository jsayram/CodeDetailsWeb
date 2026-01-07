/**
 * LLM Errors - RFC 7807 Compliant Error Handling
 * 
 * Extends CodeDetailsWeb's error system with LLM-specific error types.
 * All errors follow RFC 7807 Problem Details format.
 */

import { ErrorCode, ERROR_HINTS, ERROR_STATUS_CODES } from '@/constants/error-codes';

// ============================================================================
// LLM Error Codes (extend existing ErrorCode enum in your project)
// ============================================================================

/**
 * LLM-specific error codes
 * Add these to your ErrorCode enum in constants/error-codes.ts
 */
export const LLM_ERROR_CODES = {
  LLM_PROVIDER_ERROR: 'LLM_PROVIDER_ERROR',
  LLM_RATE_LIMITED: 'LLM_RATE_LIMITED',
  LLM_AUTHENTICATION_FAILED: 'LLM_AUTHENTICATION_FAILED',
  LLM_QUOTA_EXCEEDED: 'LLM_QUOTA_EXCEEDED',
  LLM_MODEL_NOT_FOUND: 'LLM_MODEL_NOT_FOUND',
  LLM_TOKEN_LIMIT_EXCEEDED: 'LLM_TOKEN_LIMIT_EXCEEDED',
  LLM_CONTENT_FILTERED: 'LLM_CONTENT_FILTERED',
  LLM_CONNECTION_FAILED: 'LLM_CONNECTION_FAILED',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  LLM_INVALID_RESPONSE: 'LLM_INVALID_RESPONSE',
} as const;

export type LLMErrorCode = typeof LLM_ERROR_CODES[keyof typeof LLM_ERROR_CODES];

// ============================================================================
// LLM Error Hints
// ============================================================================

export const LLM_ERROR_HINTS: Record<LLMErrorCode, string> = {
  [LLM_ERROR_CODES.LLM_PROVIDER_ERROR]: 'Check your API configuration and try again.',
  [LLM_ERROR_CODES.LLM_RATE_LIMITED]: 'Wait a moment and retry your request.',
  [LLM_ERROR_CODES.LLM_AUTHENTICATION_FAILED]: 'Verify your API key is valid and properly configured.',
  [LLM_ERROR_CODES.LLM_QUOTA_EXCEEDED]: 'Add credits to your account or check billing settings.',
  [LLM_ERROR_CODES.LLM_MODEL_NOT_FOUND]: 'Select a different model that is available.',
  [LLM_ERROR_CODES.LLM_TOKEN_LIMIT_EXCEEDED]: 'Reduce content size or use a model with larger context window.',
  [LLM_ERROR_CODES.LLM_CONTENT_FILTERED]: 'Modify your prompt to comply with content policies.',
  [LLM_ERROR_CODES.LLM_CONNECTION_FAILED]: 'Check your internet connection or service availability.',
  [LLM_ERROR_CODES.LLM_TIMEOUT]: 'The service may be slow. Try again later.',
  [LLM_ERROR_CODES.LLM_INVALID_RESPONSE]: 'The API returned an unexpected response format.',
};

// ============================================================================
// LLM Error Status Codes
// ============================================================================

export const LLM_ERROR_STATUS_CODES: Record<LLMErrorCode, number> = {
  [LLM_ERROR_CODES.LLM_PROVIDER_ERROR]: 502,
  [LLM_ERROR_CODES.LLM_RATE_LIMITED]: 429,
  [LLM_ERROR_CODES.LLM_AUTHENTICATION_FAILED]: 401,
  [LLM_ERROR_CODES.LLM_QUOTA_EXCEEDED]: 402,
  [LLM_ERROR_CODES.LLM_MODEL_NOT_FOUND]: 404,
  [LLM_ERROR_CODES.LLM_TOKEN_LIMIT_EXCEEDED]: 413,
  [LLM_ERROR_CODES.LLM_CONTENT_FILTERED]: 422,
  [LLM_ERROR_CODES.LLM_CONNECTION_FAILED]: 503,
  [LLM_ERROR_CODES.LLM_TIMEOUT]: 504,
  [LLM_ERROR_CODES.LLM_INVALID_RESPONSE]: 502,
};

// ============================================================================
// RFC 7807 Problem Detail Interface
// ============================================================================

export interface LLMProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: LLMErrorCode | ErrorCode;
  hint: string;
  timestamp: string;
  provider?: string;
  model?: string;
  tokenInfo?: {
    requested?: number;
    limit?: number;
  };
}

// ============================================================================
// LLM Error Class
// ============================================================================

export class LLMError extends Error {
  public readonly code: LLMErrorCode;
  public readonly status: number;
  public readonly hint: string;
  public readonly provider?: string;
  public readonly model?: string;
  public readonly tokenInfo?: { requested?: number; limit?: number };

  constructor(
    code: LLMErrorCode,
    message: string,
    options?: {
      provider?: string;
      model?: string;
      tokenInfo?: { requested?: number; limit?: number };
    }
  ) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.status = LLM_ERROR_STATUS_CODES[code];
    this.hint = LLM_ERROR_HINTS[code];
    this.provider = options?.provider;
    this.model = options?.model;
    this.tokenInfo = options?.tokenInfo;
  }

  /**
   * Convert to RFC 7807 Problem Detail format
   */
  toProblemDetail(instance?: string): LLMProblemDetail {
    return {
      type: `error://llm/${this.code}`,
      title: this.code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      status: this.status,
      detail: this.message,
      instance,
      code: this.code,
      hint: this.hint,
      timestamp: new Date().toISOString(),
      provider: this.provider,
      model: this.model,
      tokenInfo: this.tokenInfo,
    };
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create an authentication error
 */
export function authenticationError(provider: string, detail?: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_AUTHENTICATION_FAILED,
    detail || `Authentication failed for ${provider}. Please check your API key.`,
    { provider }
  );
}

/**
 * Create a rate limit error
 */
export function rateLimitError(provider: string, detail?: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_RATE_LIMITED,
    detail || `Rate limit exceeded for ${provider}. Please wait and try again.`,
    { provider }
  );
}

/**
 * Create a quota exceeded error
 */
export function quotaExceededError(provider: string, detail?: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_QUOTA_EXCEEDED,
    detail || `Quota exceeded for ${provider}. Please add credits to your account.`,
    { provider }
  );
}

/**
 * Create a model not found error
 */
export function modelNotFoundError(provider: string, model: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_MODEL_NOT_FOUND,
    `Model "${model}" not found on ${provider}. Please select a different model.`,
    { provider, model }
  );
}

/**
 * Create a token limit exceeded error
 */
export function tokenLimitError(
  provider: string,
  model: string,
  requested: number,
  limit: number
): LLMError {
  const reductionNeeded = Math.ceil(((requested - limit) / requested) * 100);
  return new LLMError(
    LLM_ERROR_CODES.LLM_TOKEN_LIMIT_EXCEEDED,
    `Token limit exceeded for ${provider} (${model}). ` +
    `Input: ${requested.toLocaleString()} tokens, Limit: ${limit.toLocaleString()} tokens. ` +
    `Reduce content by ~${reductionNeeded}% or use a larger model.`,
    { provider, model, tokenInfo: { requested, limit } }
  );
}

/**
 * Create a connection error
 */
export function connectionError(provider: string, detail?: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_CONNECTION_FAILED,
    detail || `Cannot connect to ${provider}. Check your internet connection.`,
    { provider }
  );
}

/**
 * Create a network error (alias for connectionError)
 */
export function networkError(provider: string, detail?: string): LLMError {
  return connectionError(provider, detail);
}

/**
 * Create a timeout error
 */
export function timeoutError(provider: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_TIMEOUT,
    `Request to ${provider} timed out. The service may be slow or unavailable.`,
    { provider }
  );
}

/**
 * Create a generic provider error
 */
export function providerError(provider: string, detail: string): LLMError {
  return new LLMError(
    LLM_ERROR_CODES.LLM_PROVIDER_ERROR,
    detail,
    { provider }
  );
}

/**
 * Generic LLM error factory
 */
export function createLLMError(
  code: LLMErrorCode,
  message: string,
  options?: {
    provider?: string;
    model?: string;
    tokenInfo?: { requested?: number; limit?: number };
  }
): LLMError {
  return new LLMError(code, message, options);
}

// ============================================================================
// Error Parser
// ============================================================================

/**
 * Parse an error from an LLM API call and convert to LLMError
 */
export function parseLLMError(
  error: unknown,
  provider: string,
  model?: string
): LLMError {
  const err = error as Error & { code?: string; status?: number; type?: string };
  const message = err.message || 'Unknown error';

  // Token limit errors
  const tokenPatterns = [
    /limit of (\d+) tokens.*resulted in (\d+) tokens/i,
    /maximum context length is (\d+)/i,
    /context_length_exceeded/i,
    /token.*limit.*exceeded/i,
    /Limit (\d+).*Requested (\d+)/i,
  ];

  for (const pattern of tokenPatterns) {
    const match = message.match(pattern);
    if (match || pattern.test(message)) {
      const limit = match?.[1] ? parseInt(match[1], 10) : undefined;
      const requested = match?.[2] ? parseInt(match[2], 10) : undefined;
      
      if (limit && requested) {
        return tokenLimitError(provider, model || 'unknown', requested, limit);
      }
      
      return new LLMError(
        LLM_ERROR_CODES.LLM_TOKEN_LIMIT_EXCEEDED,
        `Token limit exceeded for ${provider}.`,
        { provider, model }
      );
    }
  }

  // Authentication errors
  if (
    err.status === 401 ||
    err.code === 'invalid_api_key' ||
    message.includes('authentication_error') ||
    message.includes('invalid x-api-key') ||
    message.includes('Incorrect API key')
  ) {
    return authenticationError(provider);
  }

  // Permission/forbidden errors
  if (
    err.status === 403 ||
    message.includes('permission') ||
    message.includes('forbidden')
  ) {
    return new LLMError(
      LLM_ERROR_CODES.LLM_AUTHENTICATION_FAILED,
      `Access denied for ${provider}. Your API key may not have permission for this model.`,
      { provider, model }
    );
  }

  // Quota errors
  if (
    err.code === 'insufficient_quota' ||
    err.status === 402 ||
    message.includes('quota') ||
    message.includes('billing') ||
    message.includes('Insufficient Balance')
  ) {
    return quotaExceededError(provider);
  }

  // Rate limit errors
  if (
    err.status === 429 ||
    message.includes('rate_limit') ||
    message.includes('too many requests')
  ) {
    return rateLimitError(provider);
  }

  // Model not found
  if (
    err.status === 404 ||
    message.includes('not_found') ||
    message.includes('does not exist')
  ) {
    return modelNotFoundError(provider, model || 'unknown');
  }

  // Connection errors
  if (message.includes('ECONNREFUSED')) {
    return connectionError(
      provider,
      provider === 'ollama'
        ? 'Cannot connect to Ollama. Make sure it\'s running with: ollama serve'
        : undefined
    );
  }

  // Timeout errors
  if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
    return timeoutError(provider);
  }

  // Server errors
  if (err.status === 500 || err.status === 502 || err.status === 503) {
    return new LLMError(
      LLM_ERROR_CODES.LLM_PROVIDER_ERROR,
      `${provider} service error (${err.status}). The service may be temporarily unavailable.`,
      { provider, model }
    );
  }

  // Generic error
  return providerError(provider, message);
}

// ============================================================================
// NextResponse Helpers
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * Create a NextResponse from an LLMError (RFC 7807 format)
 */
export function createLLMErrorResponse(
  error: LLMError,
  request?: Request
): NextResponse<{ success: false; error: LLMProblemDetail }> {
  const problemDetail = error.toProblemDetail(request?.url);
  
  return NextResponse.json(
    { success: false, error: problemDetail },
    { 
      status: error.status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    }
  );
}

/**
 * Wrap an LLM handler with error handling
 */
export function withLLMErrorHandling<T>(
  handler: () => Promise<T>,
  provider: string,
  model?: string
): Promise<T> {
  return handler().catch((error) => {
    if (error instanceof LLMError) {
      throw error;
    }
    throw parseLLMError(error, provider, model);
  });
}
