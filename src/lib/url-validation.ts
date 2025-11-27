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

  let fixed = url.trim();

  // Fix single slash after protocol (CRITICAL - common typo)
  // https/example.com -> https://example.com
  // http/example.com -> http://example.com
  if (/^https?\/[^/]/.test(fixed)) {
    fixed = fixed.replace(/^(https?)\//, '$1://');
  }
  
  // Fix malformed protocol (missing colon)
  // https//example.com -> https://example.com
  // http//example.com -> http://example.com
  else if (/^https?\/\//.test(fixed)) {
    fixed = fixed.replace(/^(https?)(\/\/)/, '$1:$2');
  }
  
  // Fix missing slash after colon
  // https:/example.com -> https://example.com
  // http:/example.com -> http://example.com
  else if (/^https?:\/[^/]/.test(fixed)) {
    fixed = fixed.replace(/^(https?):\/([^/])/, '$1://$2');
  }
  
  // Fix triple or more slashes
  // https:///example.com -> https://example.com
  else if (/^https?:\/\/\/+/.test(fixed)) {
    fixed = fixed.replace(/^(https?):\/\/\/+/, '$1://');
  }
  
  // Fix missing slashes entirely
  // https:example.com -> https://example.com
  else if (/^https?:[^/]/.test(fixed)) {
    fixed = fixed.replace(/^(https?):([^/])/, '$1://$2');
  }
  
  // Fix wrong protocol separator
  // https;example.com -> https://example.com
  // https:;example.com -> https://example.com
  if (/^https?[:;]+/.test(fixed)) {
    fixed = fixed.replace(/^(https?)[:;]+/, '$1://');
  }
  
  // Fix backslashes instead of forward slashes
  // https:\\example.com -> https://example.com
  if (/^https?:\\\\/.test(fixed)) {
    fixed = fixed.replace(/^(https?):\\\\/, '$1://');
  }
  
  // Fix spaces in URL
  fixed = fixed.replace(/\s+/g, '');
  
  // Fix double dots in domain
  // https://example..com -> https://example.com
  fixed = fixed.replace(/\.{2,}/g, '.');
  
  // Fix trailing/leading dots in domain
  fixed = fixed.replace(/:\/\/(\.*)(.*?)(\.*)(\/ |$)/, '://$2$4');

  // Already has proper protocol - return it if we made fixes
  if (fixed !== url.trim() && (fixed.startsWith('http://') || fixed.startsWith('https://'))) {
    // Validate the fixed URL
    try {
      new URL(fixed);
      return fixed;
    } catch {
      // If still invalid, continue to other fixes
    }
  }
  
  // Return early if already valid
  if (fixed.startsWith('http://') || fixed.startsWith('https://')) {
    try {
      new URL(fixed);
      return null; // Already valid, no fix needed
    } catch {
      // Continue to try other fixes
    }
  }

  // Common patterns that can be fixed
  // youtube.com/jsayram -> https://youtube.com/jsayram
  // github.com/user/repo -> https://github.com/user/repo
  // www.example.com -> https://www.example.com
  
  // Check if it looks like a valid domain (has dot and valid characters)
  if (/^[a-zA-Z0-9][-a-zA-Z0-9.]+\.[a-zA-Z]{2,}/.test(fixed)) {
    return `https://${fixed}`;
  }
  
  // Try with www. prefix if it looks like a domain without subdomain
  if (/^[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/.test(fixed)) {
    return `https://www.${fixed}`;
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
  
  // Check for common obvious mistakes before URL parsing
  
  // Contains spaces
  if (/\s/.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'URL contains spaces',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Single slash after protocol (CRITICAL - catches https/example.com)
  if (/^https?\/[^/]/.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'Malformed protocol - should be "https://" not "https/"',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Malformed protocol patterns - missing colon
  if (/^https?\/\//.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'Missing colon in protocol - should be "https://" not "https//"',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Missing slashes - has colon but not enough slashes
  if (/^https?:[^/]/.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'Malformed protocol - missing "//" after http/https',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Missing one slash
  if (/^https?:\/[^/]/.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'Missing slash in protocol - should be "https://" not "https:/"',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Contains multiple dots in sequence
  if (/\.{2,}/.test(trimmedUrl)) {
    const suggestedFix = suggestUrlFix(trimmedUrl);
    return {
      valid: false,
      error: 'URL contains multiple consecutive dots',
      suggestedFix: suggestedFix || undefined,
    };
  }
  
  // Check for invalid characters
  if (/[<>"{}|\\^`\[\]]/.test(trimmedUrl)) {
    return {
      valid: false,
      error: 'URL contains invalid characters',
    };
  }

  try {
    const parsed = new URL(trimmedUrl);

    // Must use HTTP or HTTPS protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol "${parsed.protocol}" - must use HTTP or HTTPS`,
      };
    }

    // Check for valid hostname
    if (!parsed.hostname || parsed.hostname === '') {
      return {
        valid: false,
        error: 'URL must have a valid hostname',
      };
    }
    
    // Check hostname has at least one dot (TLD required)
    if (!parsed.hostname.includes('.')) {
      return {
        valid: false,
        error: 'Hostname must include a domain extension (e.g., .com, .org)',
      };
    }
    
    // Check for localhost or IP addresses (warn but allow)
    if (parsed.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
      // These are technically valid, so return valid: true
      return { valid: true };
    }

    return { valid: true };
  } catch (error) {
    // Try to suggest a fix
    const suggestedFix = suggestUrlFix(trimmedUrl);
    
    let errorMessage = 'Invalid URL format';
    
    // Provide more specific error messages based on common patterns
    if (!trimmedUrl.includes('.')) {
      errorMessage = 'URL must include a domain (e.g., example.com)';
    } else if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      errorMessage = 'URL must start with http:// or https://';
    } else if (trimmedUrl.includes('..')) {
      errorMessage = 'URL contains consecutive dots';
    }
    
    return {
      valid: false,
      error: errorMessage,
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
