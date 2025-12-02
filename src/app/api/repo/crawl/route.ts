/**
 * Repository Crawl API
 * Endpoint for crawling GitHub repositories using the repoScrapper module
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverGithubCrawler } from '@/repoScrapper/server-crawler';
import type { CrawlerOptions, CrawlerResult } from '@/repoScrapper';
import { RepoError } from '@/repoScrapper/errors';

// Rate limiting
const lastCrawlTimes = new Map<string, number>();
const RATE_LIMIT_MS = 10000; // 10 seconds between crawls

export async function POST(request: NextRequest) {
  // 1. Authentication check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication required' 
      },
      { status: 401 }
    );
  }

  // 2. Rate limiting
  const lastCrawl = lastCrawlTimes.get(userId) || 0;
  const now = Date.now();
  
  if (now - lastCrawl < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastCrawl)) / 1000);
    return NextResponse.json(
      { 
        success: false, 
        error: `Please wait ${waitTime}s before crawling again` 
      },
      { status: 429 }
    );
  }
  
  lastCrawlTimes.set(userId, now);

  try {
    // 3. Parse request
    const body = await request.json();
    const { repoUrl, githubToken, options = {} } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // 4. Prepare crawler options
    const crawlerOptions: CrawlerOptions = {
      repoUrl,
      token: githubToken || process.env.GITHUB_TOKEN,
      useRelativePaths: true,
      maxFileSize: options.maxFileSize || 500000,
      includePatterns: options.includePatterns || ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.md'],
      excludePatterns: options.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    };

    // 5. Crawl repository
    console.log('[Repo Crawl API] Starting crawl with options:', {
      repoUrl: crawlerOptions.repoUrl,
      tokenProvided: !!crawlerOptions.token,
      includePatterns: crawlerOptions.includePatterns,
      excludePatterns: crawlerOptions.excludePatterns,
    });
    
    const result: CrawlerResult = await serverGithubCrawler(crawlerOptions);

    // 6. Calculate stats
    const languages: Record<string, number> = {};
    let totalSize = 0;
    
    const fileEntries = Object.entries(result.files);
    fileEntries.forEach(([path, content]) => {
      totalSize += content.length;
      const ext = path.split('.').pop()?.toLowerCase() || 'unknown';
      languages[ext] = (languages[ext] || 0) + 1;
    });

    // 7. Return results
    return NextResponse.json({
      success: true,
      files: fileEntries.map(([path, content]) => ({
        path,
        content: content.slice(0, 10000), // Limit content preview
        size: content.length,
        language: path.split('.').pop(),
      })),
      stats: {
        totalFiles: fileEntries.length,
        totalSize,
        languages,
        skippedFiles: result.stats.skipped_count,
        excludedFiles: result.stats.excluded_count,
      },
    });

  } catch (error: unknown) {
    console.error('[Repo Crawl API] Error:', error);

    if (error instanceof RepoError) {
      return NextResponse.json(
        { success: false, error: error.detail },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
