/**
 * URL Validation Utilities
 * Provides format validation and reachability checking for project links
 */

import { LinkValidationResult, LinkReachabilityResult } from "@/types/project-links";

/**
 * Attempt to auto-fix common URL format issues
 * Returns the corrected URL or null if can't be fixed
 */
export function suggestUrlFix(url: string): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmed = url.trim();

  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null;
  }

  // Common patterns that can be fixed
  // youtube.com/jsayram -> https://youtube.com/jsayram
  // github.com/user/repo -> https://github.com/user/repo
  // www.example.com -> https://www.example.com
  
  // Check if it looks like a valid domain (has dot and valid characters)
  if (/^[a-zA-Z0-9][-a-zA-Z0-9.]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
}

/**
 * Validate URL format
 * Checks if the URL is properly formatted and uses HTTP/HTTPS
 */
export function validateUrlFormat(url: string): LinkValidationResult {
  if (!url || url.trim() === '') {
    return { valid: true }; // Empty is valid (optional field)
  }

  const trimmedUrl = url.trim();

  try {
    const parsed = new URL(trimmedUrl);

    // Must use HTTP or HTTPS protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'URL must use HTTP or HTTPS protocol',
      };
    }

    // Check for valid hostname
    if (!parsed.hostname || parsed.hostname === '') {
      return {
        valid: false,
        error: 'URL must have a valid hostname',
      };
    }

    return { valid: true };
  } catch (error) {
    // Try to suggest a fix
    const suggestedFix = suggestUrlFix(trimmedUrl);
    
    return {
      valid: false,
      error: 'Invalid URL format',
      suggestedFix: suggestedFix || undefined,
    };
  }
}

/**
 * Check if a URL is reachable
 * Uses server-side API to bypass CORS restrictions
 */
export async function checkUrlReachability(
  url: string,
  timeoutMs: number = 5000
): Promise<LinkReachabilityResult> {
  if (!url || url.trim() === '') {
    return { reachable: false, error: 'Empty URL' };
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('/api/validate-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const data = await response.json();
      return {
        reachable: false,
        error: data.error || 'Validation failed',
        responseTime: Date.now() - startTime,
      };
    }

    const result = await response.json();
    return {
      reachable: result.reachable,
      statusCode: result.statusCode,
      responseTime: result.responseTime || Date.now() - startTime,
      error: result.error,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          reachable: false,
          error: `Request timed out after ${timeoutMs}ms`,
          responseTime,
        };
      }

      return {
        reachable: false,
        error: error.message,
        responseTime,
      };
    }

    return {
      reachable: false,
      error: 'Unknown error occurred',
      responseTime,
    };
  }
}

/**
 * Batch check multiple URLs for reachability
 * Returns results for all URLs in parallel
 */
export async function checkMultipleUrls(
  urls: string[],
  timeoutMs: number = 5000
): Promise<Map<string, LinkReachabilityResult>> {
  const results = new Map<string, LinkReachabilityResult>();

  // Check all URLs in parallel
  const checks = urls.map(async (url) => {
    const result = await checkUrlReachability(url, timeoutMs);
    results.set(url, result);
  });

  await Promise.all(checks);

  return results;
}

/**
 * Validate and check a URL in one call
 * Returns both format validation and reachability
 */
export async function validateAndCheckUrl(
  url: string,
  checkReachability: boolean = false
): Promise<{
  formatValid: boolean;
  formatError?: string;
  reachability?: LinkReachabilityResult;
}> {
  const formatResult = validateUrlFormat(url);

  if (!formatResult.valid || !checkReachability) {
    return {
      formatValid: formatResult.valid,
      formatError: formatResult.error,
    };
  }

  const reachability = await checkUrlReachability(url);

  return {
    formatValid: true,
    reachability,
  };
}

/**
 * Get a user-friendly error message for URL validation
 */
export function getUrlErrorMessage(
  formatResult: LinkValidationResult,
  reachabilityResult?: LinkReachabilityResult
): string | null {
  if (!formatResult.valid) {
    return formatResult.error || 'Invalid URL format';
  }

  if (reachabilityResult && !reachabilityResult.reachable) {
    const status = reachabilityResult.statusCode;
    if (status === 404) return 'URL not found (404)';
    if (status === 403) return 'Access forbidden (403)';
    if (status === 500) return 'Server error (500)';
    if (status && status >= 400) return `Error: ${status}`;
    return reachabilityResult.error || 'URL is not reachable';
  }

  return null;
}
