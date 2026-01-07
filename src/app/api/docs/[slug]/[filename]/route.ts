/**
 * Get/Update Chapter Content API Route
 * 
 * GET /api/docs/[slug]/[filename] - Get chapter content
 * PUT /api/docs/[slug]/[filename] - Update chapter content (owner only)
 * 
 * Returns/updates the content of a specific chapter file.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { auth } from '@clerk/nextjs/server';
import { getProjectMeta } from '@/lib/output-utils';
import { unauthorized, notFound, notOwner, serverError, success } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{
    slug: string;
    filename: string;
  }>;
}

// Output directory (relative to project root)
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'app', 'output');

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, filename } = await params;
    
    if (!slug || !filename) {
      return NextResponse.json(
        { error: 'Project slug and filename are required' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs to prevent path traversal
    const safeSlug = slug.replace(/[^a-z0-9_-]/gi, '');
    const safeFilename = filename.replace(/[^a-z0-9_.-]/gi, '');
    
    // Ensure it's a markdown file
    if (!safeFilename.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only markdown files are supported' },
        { status: 400 }
      );
    }
    
    let filePath = path.join(OUTPUT_DIR, safeSlug, safeFilename);
    
    // Check if file exists - fall back to index.md for overview
    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch {
      // If requesting overview and it doesn't exist, try index.md
      if (safeFilename === '-1_overview.md') {
        const indexPath = path.join(OUTPUT_DIR, safeSlug, 'index.md');
        try {
          await fs.access(indexPath);
          filePath = indexPath;
          fileExists = true;
        } catch {
          // index.md also doesn't exist
        }
      }
    }
    
    if (!fileExists) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse frontmatter
    const { content, data } = matter(fileContent);
    
    // Return just the content (without frontmatter) as plain text
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[docs-chapter] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to load chapter' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update chapter content (owner only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return unauthorized('Authentication required to edit documentation');
    }

    const { slug, filename } = await params;
    
    if (!slug || !filename) {
      return NextResponse.json(
        { error: 'Project slug and filename are required' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs to prevent path traversal
    const safeSlug = slug.replace(/[^a-z0-9_-]/gi, '');
    const safeFilename = filename.replace(/[^a-z0-9_.-]/gi, '');
    
    // Ensure it's a markdown file
    if (!safeFilename.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only markdown files are supported' },
        { status: 400 }
      );
    }
    
    // Get the documentation metadata to verify ownership
    const docMeta = await getProjectMeta(safeSlug);
    if (!docMeta) {
      return notFound('documentation', { identifier: safeSlug });
    }
    
    // Verify doc ownership
    if (docMeta.userId !== userId) {
      return notOwner('documentation');
    }
    
    // Parse request body
    const body = await request.json();
    const { content } = body;
    
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }
    
    let filePath = path.join(OUTPUT_DIR, safeSlug, safeFilename);
    
    // Check if file exists - fall back to index.md for overview
    let targetPath = filePath;
    try {
      await fs.access(filePath);
    } catch {
      // If requesting overview and it doesn't exist, try index.md
      if (safeFilename === '-1_overview.md') {
        const indexPath = path.join(OUTPUT_DIR, safeSlug, 'index.md');
        try {
          await fs.access(indexPath);
          targetPath = indexPath;
        } catch {
          return notFound('chapter', { identifier: safeFilename });
        }
      } else {
        return notFound('chapter', { identifier: safeFilename });
      }
    }
    
    // Read existing file to get frontmatter
    const existingContent = await fs.readFile(targetPath, 'utf-8');
    const { data: frontmatter } = matter(existingContent);
    
    // Reconstruct file with frontmatter + new content
    let newFileContent: string;
    if (Object.keys(frontmatter).length > 0) {
      // Has frontmatter - preserve it
      newFileContent = matter.stringify(content, frontmatter);
    } else {
      // No frontmatter - just use content
      newFileContent = content;
    }
    
    // Write the updated content
    await fs.writeFile(targetPath, newFileContent, 'utf-8');
    
    return success({
      updated: true,
      filename: safeFilename,
      slug: safeSlug,
    });
  } catch (error) {
    console.error('[docs-chapter] PUT Error:', error);
    return serverError(error, 'Failed to save chapter');
  }
}
