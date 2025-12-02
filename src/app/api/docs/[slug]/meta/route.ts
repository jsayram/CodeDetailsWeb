/**
 * Get Project Metadata API Route
 * 
 * GET /api/docs/[slug]/meta
 * 
 * Returns the metadata for a generated documentation project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProjectMeta } from '@/lib/output-utils';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      );
    }
    
    const meta = await getProjectMeta(slug);
    
    if (!meta) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(meta);
  } catch (error) {
    console.error('[docs-meta] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load project metadata' },
      { status: 500 }
    );
  }
}
