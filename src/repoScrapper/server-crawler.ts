/**
 * Server-Side GitHub Repository Crawler
 * 
 * Direct GitHub API crawler for server-side use (API routes).
 * This bypasses the client-side fetch wrapper and calls GitHub directly.
 */

import type { CrawlerOptions, CrawlerResult, FileStats } from './types';
import { 
  parseGitHubError, 
  crawlerError, 
  githubRateLimitError,
  githubAuthError,
} from './errors';
import { parseGitHubUrl, DEFAULT_MAX_FILE_SIZE } from './crawler';
import { minimatch } from 'minimatch';

// ============================================================================
// Types
// ============================================================================

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubBlobResponse {
  sha: string;
  size: number;
  content: string;
  encoding: 'base64' | 'utf-8';
}

interface GitHubRateLimit {
  remaining: number;
  limit: number;
  reset: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a path matches any of the glob patterns
 */
function matchesPatterns(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => minimatch(path, pattern, { matchBase: true }));
}

/**
 * Parse rate limit headers from GitHub response
 */
function parseRateLimit(headers: Headers): GitHubRateLimit | null {
  const remaining = headers.get('x-ratelimit-remaining');
  const limit = headers.get('x-ratelimit-limit');
  const reset = headers.get('x-ratelimit-reset');
  
  if (remaining && limit && reset) {
    return {
      remaining: parseInt(remaining, 10),
      limit: parseInt(limit, 10),
      reset: parseInt(reset, 10),
    };
  }
  return null;
}

/**
 * Decode base64 content from GitHub API
 */
function decodeBase64(content: string): string {
  // GitHub returns base64 with newlines, need to clean it
  const cleaned = content.replace(/\n/g, '');
  return Buffer.from(cleaned, 'base64').toString('utf-8');
}

// ============================================================================
// Main Server Crawler
// ============================================================================

/**
 * Server-side GitHub repository crawler
 * 
 * Directly calls the GitHub API to fetch repository files.
 * Use this in API routes instead of githubFileCrawler.
 * 
 * @example
 * ```ts
 * // In an API route
 * import { serverGithubCrawler } from '@/repoScrapper/server-crawler';
 * 
 * const result = await serverGithubCrawler({
 *   repoUrl: 'https://github.com/owner/repo',
 *   token: process.env.GITHUB_TOKEN,
 *   includePatterns: ['**\/*.ts', '**\/*.tsx'],
 *   excludePatterns: ['**\/node_modules/**'],
 * });
 * ```
 */
export async function serverGithubCrawler(options: CrawlerOptions): Promise<CrawlerResult> {
  const {
    repoUrl,
    token,
    useRelativePaths = true,
    includePatterns = [],
    excludePatterns = [],
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  console.log('[Server Crawler] Starting crawl for:', repoUrl);
  console.log('[Server Crawler] Include patterns:', includePatterns);
  console.log('[Server Crawler] Exclude patterns:', excludePatterns);
  console.log('[Server Crawler] Token provided:', token ? `Yes (length: ${token.length}, starts: ${token.substring(0, 10)}...)` : 'No');
  console.log('[Server Crawler] Env GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? `Set (length: ${process.env.GITHUB_TOKEN.length})` : 'NOT SET');

  // Parse the GitHub URL
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    console.error('[Server Crawler] Failed to parse GitHub URL:', repoUrl);
    throw crawlerError(`Invalid GitHub URL: ${repoUrl}. Expected format: https://github.com/owner/repo or owner/repo`);
  }

  const { owner, repo, branch } = parsed;
  console.log('[Server Crawler] Parsed:', { owner, repo, branch });
  console.log('[Server Crawler] Will fetch from:', `https://api.github.com/repos/${owner}/${repo}`);

  // Build headers
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeDetails-RepoScrapper',
  };

  // Use provided token or fallback to env var
  const effectiveToken = token || process.env.GITHUB_TOKEN;
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
    console.log('[Server Crawler] Using authorization header');
  } else {
    console.warn('[Server Crawler] No GitHub token! Rate limit will be 60 req/hour and private repos won\'t work');
  }

  // Stats tracking
  const stats: FileStats = {
    downloaded_count: 0,
    skipped_count: 0,
    skipped_files: [],
    excluded_count: 0,
    excluded_files: [],
    base_path: `${owner}/${repo}`,
    include_patterns: includePatterns,
    exclude_patterns: excludePatterns,
    api_requests: 0,
    method: 'git-tree',
  };

  const files: Record<string, string> = {};

  try {
    // 1. Get the default branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      console.log('[Server Crawler] Fetching default branch...');
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      stats.api_requests = (stats.api_requests || 0) + 1;

      if (!repoResponse.ok) {
        const errorText = await repoResponse.text();
        console.error('[Server Crawler] Repo fetch error:', repoResponse.status, errorText);
        console.error('[Server Crawler] This usually means:');
        console.error('  - The repository URL is incorrect');
        console.error('  - The repository is private and requires a GITHUB_TOKEN');
        console.error('  - The repository has been deleted or renamed');
        throw parseGitHubError(repoResponse.status, `${owner}/${repo}`, repoResponse.headers);
      }

      const repoData = await repoResponse.json();
      targetBranch = repoData.default_branch || 'main';
      console.log('[Server Crawler] Default branch:', targetBranch);
    }

    // 2. Get the full tree recursively
    console.log('[Server Crawler] Fetching tree for branch:', targetBranch);
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
      { headers }
    );
    stats.api_requests = (stats.api_requests || 0) + 1;

    if (!treeResponse.ok) {
      const errorText = await treeResponse.text();
      console.error('[Server Crawler] Tree fetch error:', treeResponse.status, errorText);
      console.error('[Server Crawler] Failed to fetch tree for branch:', targetBranch);
      throw parseGitHubError(treeResponse.status, `${owner}/${repo}@${targetBranch}`, treeResponse.headers);
    }

    // Check rate limit
    const rateLimit = parseRateLimit(treeResponse.headers);
    if (rateLimit) {
      console.log(`[Server Crawler] Rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
      if (rateLimit.remaining < 10) {
        const resetDate = new Date(rateLimit.reset * 1000);
        console.warn(`[Server Crawler] Rate limit low! Resets at ${resetDate.toISOString()}`);
      }
    }

    const treeData: GitHubTreeResponse = await treeResponse.json();
    console.log(`[Server Crawler] Found ${treeData.tree.length} items in tree`);

    if (treeData.truncated) {
      console.warn('[Server Crawler] Warning: Tree was truncated (>100k files or >7MB)');
    }

    // 3. Filter files based on patterns
    const filesToFetch = treeData.tree.filter(item => {
      // Only process blobs (files), not trees (directories)
      if (item.type !== 'blob') return false;

      const filePath = item.path;

      // Check exclude patterns first
      if (excludePatterns.length > 0 && matchesPatterns(filePath, excludePatterns)) {
        stats.excluded_count = (stats.excluded_count || 0) + 1;
        return false;
      }

      // Check include patterns (if specified)
      if (includePatterns.length > 0 && !matchesPatterns(filePath, includePatterns)) {
        stats.excluded_count = (stats.excluded_count || 0) + 1;
        return false;
      }

      // Check file size
      if (item.size && item.size > maxFileSize) {
        stats.skipped_count++;
        console.log(`[Server Crawler] Skipping large file: ${filePath} (${item.size} bytes)`);
        return false;
      }

      return true;
    });

    console.log(`[Server Crawler] Filtered to ${filesToFetch.length} files to fetch`);

    // 4. Fetch file contents (batch with some parallelism)
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
      const batch = filesToFetch.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const blobResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/blobs/${item.sha}`,
            { headers }
          );
          stats.api_requests = (stats.api_requests || 0) + 1;

          if (!blobResponse.ok) {
            console.warn(`[Server Crawler] Failed to fetch ${item.path}: ${blobResponse.status}`);
            stats.skipped_count++;
            return;
          }

          const blobData: GitHubBlobResponse = await blobResponse.json();
          
          // Decode content
          let content: string;
          if (blobData.encoding === 'base64') {
            content = decodeBase64(blobData.content);
          } else {
            content = blobData.content;
          }

          // Store with appropriate path
          const filePath = useRelativePaths ? item.path : `/${item.path}`;
          files[filePath] = content;
          stats.downloaded_count++;
          
        } catch (err) {
          console.warn(`[Server Crawler] Error fetching ${item.path}:`, err);
          stats.skipped_count++;
        }
      });

      await Promise.all(batchPromises);
      
      // Log progress
      const processed = Math.min(i + BATCH_SIZE, filesToFetch.length);
      console.log(`[Server Crawler] Progress: ${processed}/${filesToFetch.length} files`);
    }

    console.log(`[Server Crawler] Completed! Downloaded ${stats.downloaded_count} files`);

    return {
      files,
      stats,
    };

  } catch (err) {
    console.error('[Server Crawler] Error:', err);
    throw err;
  }
}

export { parseGitHubUrl, DEFAULT_MAX_FILE_SIZE };
