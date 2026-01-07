/**
 * GitHub Repository Crawler
 * Client-side crawler that calls the API route to fetch repository files
 * 
 * Pure functions with dependency injection for the fetch function
 */

import type { CrawlerOptions, CrawlerResult, FileStats } from './types';
import { 
  parseGitHubError, 
  crawlerError, 
  networkError, 
  RepoError 
} from './errors';

// ============================================================================
// Default Configuration
// ============================================================================

/** Default maximum file size in bytes (500KB) */
export const DEFAULT_MAX_FILE_SIZE = 500 * 1024;

/** Default API endpoint path */
export const DEFAULT_API_PATH = '/api/github-crawler';

// ============================================================================
// Main Crawler Function
// ============================================================================

/**
 * Crawls a GitHub repository to fetch files based on specified patterns
 * 
 * This function calls a backend API route that handles the actual GitHub API calls.
 * The API route is responsible for authentication and rate limiting.
 * 
 * @param options - Configuration options for the crawler
 * @returns Promise resolving to CrawlerResult with files and statistics
 * @throws RepoError for authentication, rate limit, or other GitHub errors
 * 
 * @example
 * ```ts
 * import { githubFileCrawler, getDefaultPatterns } from '@/repoScrapper';
 * 
 * const { includePatterns, excludePatterns } = getDefaultPatterns();
 * 
 * const result = await githubFileCrawler({
 *   repoUrl: 'https://github.com/owner/repo',
 *   token: process.env.GITHUB_TOKEN,
 *   useRelativePaths: true,
 *   includePatterns,
 *   excludePatterns,
 *   maxFileSize: 500 * 1024,
 * });
 * 
 * console.log(`Downloaded ${result.stats.downloaded_count} files`);
 * ```
 */
export async function githubFileCrawler(options: CrawlerOptions): Promise<CrawlerResult> {
  const {
    repoUrl,
    token,
    useRelativePaths,
    includePatterns,
    excludePatterns,
    maxFileSize,
    fetchFn = fetch,
    apiBaseUrl,
  } = options;

  try {
    console.log(`[GitHub Crawler] Processing repository: ${repoUrl}`);

    // Determine API URL
    const apiUrl = apiBaseUrl
      ? `${apiBaseUrl}${DEFAULT_API_PATH}`
      : typeof window !== 'undefined'
        ? `${window.location.origin}${DEFAULT_API_PATH}`
        : `http://localhost:3000${DEFAULT_API_PATH}`;

    const response = await fetchFn(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repoUrl,
        token,
        useRelativePaths,
        includePatterns,
        excludePatterns,
        maxFileSize,
      }),
    });

    // Extract rate limit information from response headers
    const headers = response.headers;

    if (!response.ok) {
      const errorText = await response.text();
      throw parseGitHubError(response.status, errorText, headers);
    }

    const result: CrawlerResult = await response.json();
    
    console.log(`[GitHub Crawler] Successfully crawled ${result.stats.downloaded_count} files`);
    
    return {
      files: result.files,
      stats: result.stats,
    };
  } catch (err) {
    if (err instanceof RepoError) {
      throw err;
    }
    
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw networkError('Unable to connect to the GitHub crawler API');
    }
    
    throw crawlerError(err instanceof Error ? err.message : 'An unknown error occurred');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse a GitHub URL to extract owner, repo, and optional branch
 * 
 * Supports many URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/feature/nested-branch
 * - https://github.com/owner/repo/blob/branch/path/to/file
 * - https://github.com/owner/repo/commit/sha
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner/repo/issues/456
 * - https://github.com/owner/repo/releases/tag/v1.0.0
 * - https://github.com/owner/repo/archive/refs/heads/branch.zip
 * - https://github.com/owner/repo/archive/refs/tags/v1.0.0.zip
 * - git@github.com:owner/repo.git
 * - git://github.com/owner/repo.git
 * - ssh://git@github.com/owner/repo.git
 * - https://raw.githubusercontent.com/owner/repo/branch/file
 * - owner/repo (shorthand)
 * - owner/repo#branch (shorthand with branch)
 * - owner/repo@branch (shorthand with branch)
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  // Trim and clean the URL
  url = url.trim();
  
  let owner: string | undefined;
  let repo: string | undefined;
  let branch: string | undefined;

  // 1. Handle shorthand formats first: owner/repo, owner/repo#branch, owner/repo@branch
  const shorthandMatch = url.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:[#@](.+))?$/);
  if (shorthandMatch && !url.includes('github') && !url.includes('://')) {
    owner = shorthandMatch[1];
    repo = shorthandMatch[2];
    branch = shorthandMatch[3];
    
    // Clean repo name
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }
    
    console.log('[parseGitHubUrl] Shorthand format:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  // 2. Handle raw.githubusercontent.com URLs
  // https://raw.githubusercontent.com/owner/repo/branch/path/to/file
  const rawMatch = url.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
  if (rawMatch) {
    owner = rawMatch[1];
    repo = rawMatch[2];
    branch = rawMatch[3];
    
    console.log('[parseGitHubUrl] Raw GitHub URL:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  // 3. Handle SSH formats
  // git@github.com:owner/repo.git
  // ssh://git@github.com/owner/repo.git
  const sshMatch = url.match(/git@github\.com[:\/ ]([^\/]+)\/([^\/\s]+)/);
  if (sshMatch) {
    owner = sshMatch[1];
    repo = sshMatch[2].replace(/\.git$/, '');
    
    console.log('[parseGitHubUrl] SSH format:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  // 4. Handle git:// protocol
  // git://github.com/owner/repo.git
  const gitProtocolMatch = url.match(/git:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (gitProtocolMatch) {
    owner = gitProtocolMatch[1];
    repo = gitProtocolMatch[2].replace(/\.git$/, '');
    
    console.log('[parseGitHubUrl] Git protocol format:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  // 5. Handle HTTPS GitHub URLs (most common)
  // First extract branch from various URL patterns
  
  // /tree/branch-name (branch can have slashes)
  const treeMatch = url.match(/\/tree\/([^?#]+)/);
  if (treeMatch) {
    branch = treeMatch[1];
  }
  
  // /blob/branch-name/path (branch can have slashes, path follows)
  // We need to be smart about where branch ends and path begins
  // Usually the branch is followed by a file path with extension
  if (!branch) {
    const blobMatch = url.match(/\/blob\/(.+)/);
    if (blobMatch) {
      const blobPath = blobMatch[1];
      // Try to find where the branch ends - look for common file patterns
      // This is heuristic: assume branch doesn't contain dots followed by file extensions
      const pathParts = blobPath.split('/');
      // Find the first part that looks like a file (has extension)
      let branchParts: string[] = [];
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        // If this part has a file extension, everything before is the branch
        if (/\.[a-zA-Z0-9]+$/.test(part) && i > 0) {
          branchParts = pathParts.slice(0, i);
          break;
        }
        branchParts.push(part);
      }
      branch = branchParts.join('/') || pathParts[0];
    }
  }
  
  // /commit/sha
  if (!branch) {
    const commitMatch = url.match(/\/commit\/([a-f0-9]+)/i);
    if (commitMatch) {
      branch = commitMatch[1]; // SHA as "branch"
    }
  }
  
  // /releases/tag/tagname
  if (!branch) {
    const tagMatch = url.match(/\/releases\/tag\/([^?#\/]+)/);
    if (tagMatch) {
      branch = tagMatch[1];
    }
  }
  
  // /archive/refs/heads/branch.zip or /archive/refs/tags/tag.zip
  if (!branch) {
    const archiveMatch = url.match(/\/archive\/refs\/(?:heads|tags)\/([^.]+)/);
    if (archiveMatch) {
      branch = archiveMatch[1];
    }
  }
  
  // /archive/branch.zip (legacy format)
  if (!branch) {
    const legacyArchiveMatch = url.match(/\/archive\/([^.]+)\.(?:zip|tar\.gz)/);
    if (legacyArchiveMatch) {
      branch = legacyArchiveMatch[1];
    }
  }

  // Now extract owner and repo from the base URL
  const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (githubMatch) {
    owner = githubMatch[1];
    repo = githubMatch[2];
    
    // Clean repo name
    repo = repo.replace(/\.git$/, '');
    // Remove any trailing path segments that got captured
    repo = repo.split('/')[0];
    
    console.log('[parseGitHubUrl] GitHub HTTPS URL:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  // 6. Handle GitHub API URLs
  // https://api.github.com/repos/owner/repo/...
  const apiMatch = url.match(/api\.github\.com\/repos\/([^\/]+)\/([^\/\?#]+)/);
  if (apiMatch) {
    owner = apiMatch[1];
    repo = apiMatch[2].replace(/\.git$/, '');
    
    // Try to extract branch from API URL if present
    const refMatch = url.match(/\/(?:git\/refs\/heads|branches)\/([^?#]+)/);
    if (refMatch) {
      branch = refMatch[1];
    }
    
    console.log('[parseGitHubUrl] GitHub API URL:', { owner, repo, branch });
    return { owner, repo, branch };
  }

  console.log('[parseGitHubUrl] Failed to parse URL:', url);
  return null;
}

/**
 * Normalize a repo URL to a consistent format
 */
export function normalizeRepoUrl(url: string): string {
  const parsed = parseGitHubUrl(url);
  if (!parsed) return url;
  
  return `${parsed.owner}/${parsed.repo}`.toLowerCase();
}

/**
 * Generate a safe filename from repo URL
 */
export function repoUrlToFilename(url: string): string {
  const normalized = normalizeRepoUrl(url);
  const safe = normalized
    .replace(/\//g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  return `${safe}.json`;
}

/**
 * Calculate total size of crawled files
 */
export function calculateTotalSize(files: Record<string, string>): number {
  return Object.values(files).reduce((sum, content) => sum + content.length, 0);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get summary of crawl statistics
 */
export function getCrawlSummary(stats: FileStats): string {
  const lines: string[] = [];
  
  lines.push(`Downloaded: ${stats.downloaded_count} files`);
  lines.push(`Skipped: ${stats.skipped_count} files`);
  
  if (stats.excluded_count) {
    lines.push(`Excluded: ${stats.excluded_count} files`);
  }
  
  if (stats.api_requests) {
    lines.push(`API Requests: ${stats.api_requests}`);
  }
  
  if (stats.method) {
    lines.push(`Method: ${stats.method}`);
  }
  
  return lines.join('\n');
}

/**
 * Validate a GitHub URL
 */
export function isValidGitHubUrl(url: string): boolean {
  return parseGitHubUrl(url) !== null;
}

/**
 * Create a crawler options object with defaults
 */
export function createCrawlerOptions(
  repoUrl: string,
  options: Partial<Omit<CrawlerOptions, 'repoUrl'>> = {}
): CrawlerOptions {
  return {
    repoUrl,
    useRelativePaths: options.useRelativePaths ?? true,
    includePatterns: options.includePatterns ?? [],
    excludePatterns: options.excludePatterns ?? [],
    maxFileSize: options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
    token: options.token,
    fetchFn: options.fetchFn,
    apiBaseUrl: options.apiBaseUrl,
  };
}

// ============================================================================
// Error Simulation (for testing)
// ============================================================================

/**
 * Simulates different error conditions for testing purposes
 */
export async function simulateError(errorType: string): Promise<never> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  switch (errorType) {
    case 'rate-limit':
      throw parseGitHubError(403, 'rate limit exceeded', undefined);

    case '404':
      throw parseGitHubError(404, 'Not Found', undefined);

    case '401':
      throw parseGitHubError(401, 'Bad credentials', undefined);

    case '500':
      throw parseGitHubError(500, 'Internal Server Error', undefined);

    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw crawlerError('Request timed out');

    case 'network':
      throw networkError('Unable to connect to GitHub API');

    default:
      throw crawlerError(`Test error: ${errorType || 'unspecified error'}`);
  }
}
