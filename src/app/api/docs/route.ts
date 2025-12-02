/**
 * List Generated Docs API Route
 * 
 * GET /api/docs
 * 
 * Returns a list of all generated documentation projects for the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listProjects } from '@/lib/output-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all projects
    const allProjects = await listProjects();
    
    // Filter to only show user's projects
    const userProjects = allProjects.filter((p) => p.userId === userId);
    
    // Format response
    const projects = userProjects.map((p) => ({
      slug: p.projectSlug,
      projectName: p.repoName,
      repoUrl: p.repoUrl,
      createdAt: p.createdAt,
      chapterCount: p.chapters.length,
    }));
    
    // Sort by creation date (newest first)
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('[docs-list] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}
