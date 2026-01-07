/**
 * Download All Docs as ZIP API Route
 * 
 * GET /api/docs/[slug]/download
 * 
 * Downloads all documentation files as a ZIP archive.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { getProjectMeta } from '@/lib/output-utils';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// Output directory (relative to project root)
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'app', 'output');

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      );
    }
    
    // Sanitize slug
    const safeSlug = slug.replace(/[^a-z0-9_-]/gi, '');
    const projectDir = path.join(OUTPUT_DIR, safeSlug);
    
    // Check if project exists
    try {
      await fs.access(projectDir);
    } catch {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Get project metadata
    const meta = await getProjectMeta(safeSlug);
    const projectName = meta?.repoName || safeSlug;
    
    // Create ZIP archive
    const zip = new JSZip();
    
    // Read all files in the project directory
    const files = await fs.readdir(projectDir);
    
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.json')) {
        const filePath = path.join(projectDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        zip.file(file, content);
      }
    }
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    
    // Return ZIP file - convert Buffer to Uint8Array for type compatibility
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}-docs.zip"`,
      },
    });
  } catch (error) {
    console.error('[docs-download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}
