/**
 * Generate Documentation API Route
 * 
 * POST /api/generate-docs
 * 
 * Generates architecture documentation for a GitHub repository using the
 * PocketFlow-based documentation pipeline. Requires Clerk authentication.
 * 
 * Supports Server-Sent Events (SSE) for streaming progress updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  runDocumentationFlowWithProgress,
  isValidGitHubUrl,
  parseGitHubUrl,
  type SharedData,
  type ProgressCallback,
} from '@/repoScrapper';
import {
  generateProjectSlug,
  saveChapter,
  saveProjectMeta,
  type ChapterInfo,
} from '@/lib/output-utils';

// Disable body parser for SSE
export const runtime = 'nodejs';

interface GenerateDocsRequest {
  repoUrl: string;
  llmProvider?: string;
  llmModel?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

/**
 * RFC 7807 Problem Detail for API errors
 */
function problemResponse(
  status: number,
  title: string,
  detail: string,
  instance?: string
): NextResponse {
  return NextResponse.json(
    {
      type: `https://codedetails.io/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      status,
      detail,
      instance: instance || '/api/generate-docs',
    },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return problemResponse(401, 'Unauthorized', 'Authentication required to generate documentation.');
    }

    // Parse request body
    let body: GenerateDocsRequest;
    try {
      body = await request.json();
    } catch {
      return problemResponse(400, 'Bad Request', 'Invalid JSON in request body.');
    }

    const { repoUrl, llmProvider, llmModel, llmApiKey, llmBaseUrl } = body;

    // Validate repository URL
    if (!repoUrl) {
      return problemResponse(400, 'Bad Request', 'Repository URL is required.');
    }

    if (!isValidGitHubUrl(repoUrl)) {
      return problemResponse(400, 'Bad Request', 'Invalid GitHub repository URL.');
    }

    // Parse repository info
    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      return problemResponse(400, 'Bad Request', 'Could not parse GitHub repository URL.');
    }

    const projectName = repoInfo.repo;
    const projectSlug = generateProjectSlug(repoInfo.owner, repoInfo.repo);

    console.log(`[generate-docs] Starting generation for ${repoUrl}`);
    console.log(`[generate-docs] User: ${userId}`);
    console.log(`[generate-docs] Project slug: ${projectSlug}`);

    // Create a TransformStream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Helper to send SSE event
    const sendEvent = async (data: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Start the generation in the background
    (async () => {
      try {
        // Progress callback
        const onProgress: ProgressCallback = async (update) => {
          await sendEvent({ progress: update });
        };

        // Build shared data for the flow
        const shared: SharedData = {
          repo_url: repoUrl,
          project_name: projectName,
          llm_provider: llmProvider || 'openai',
          llm_model: llmModel || 'gpt-4o-mini',
          llm_api_key: llmApiKey,
          llm_base_url: llmBaseUrl,
          max_abstraction_num: 8,
          language: 'english',
          github_token: process.env.GITHUB_TOKEN,
        };

        // Run the documentation generation flow
        const result = await runDocumentationFlowWithProgress(shared, onProgress);

        // Save generated chapters to disk
        const savedChapters: ChapterInfo[] = [];

        for (let i = 0; i < result.generatedChapters.length; i++) {
          const chapter = result.generatedChapters[i];
          
          // Save chapter with proper signature
          const filename = await saveChapter(
            projectSlug,
            i,
            chapter.title,
            chapter.content,
            [] // abstractionsCovered could be extracted from the chapter
          );
          
          savedChapters.push({
            filename,
            title: chapter.title,
            order: i,
            abstractionsCovered: [],
          });
        }

        // Save index as a separate file with order -1
        await saveChapter(
          projectSlug,
          -1,
          'Overview',
          result.generatedIndex,
          []
        );

        // Save project metadata
        await saveProjectMeta(projectSlug, {
          userId,
          repoUrl,
          repoOwner: repoInfo.owner,
          repoName: repoInfo.repo,
          createdAt: new Date().toISOString(),
          chapters: savedChapters,
          llmProvider: llmProvider || 'openai',
          llmModel: llmModel || 'gpt-4o-mini',
        });

        // Send final result
        await sendEvent({
          result: {
            projectName: result.projectName,
            projectSlug,
            chapters: savedChapters.map(c => ({
              filename: c.filename,
              title: c.title,
            })),
          },
        });
      } catch (error) {
        console.error('[generate-docs] Generation error:', error);
        await sendEvent({
          error: error instanceof Error ? error.message : 'Generation failed',
        });
      } finally {
        await writer.close();
      }
    })();

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[generate-docs] Unexpected error:', error);
    return problemResponse(
      500,
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    );
  }
}
