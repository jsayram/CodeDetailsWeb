/**
 * Get Chapter Content API Route
 * 
 * GET /api/docs/[slug]/[filename]
 * 
 * Returns the content of a specific chapter file.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

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
    console.error('[docs-chapter] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load chapter' },
      { status: 500 }
    );
  }
}
