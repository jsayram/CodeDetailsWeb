/**
 * Get Linked Documentation for a Project API Route
 * 
 * GET /api/projects/slug/[slug]/linked-doc
 * 
 * Returns the generated documentation linked to a specific project.
 * Accessible to anyone (for viewing on project page).
 * RFC 7807 compliant error responses.
 */

import { NextRequest } from 'next/server';
import { findDocLinkedToProject } from '@/lib/output-utils';
import { notFound, serverError, success } from '@/lib/api-errors';
import { executeQuery } from '@/db/server';
import { projects } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Verify the project exists using Drizzle
    const project = await executeQuery(async (db) => {
      const result = await db
        .select({ id: projects.id, slug: projects.slug, user_id: projects.user_id })
        .from(projects)
        .where(
          and(
            eq(projects.slug, slug),
            isNull(projects.deleted_at)
          )
        )
        .limit(1);
      return result.length > 0 ? result[0] : null;
    });

    if (!project) {
      return notFound('project', { identifier: slug });
    }

    // Find documentation linked to this project
    const linkedDoc = await findDocLinkedToProject(slug);

    if (!linkedDoc) {
      // Return success with null - no doc linked
      return success({
        hasLinkedDoc: false,
        linkedDoc: null,
      });
    }

    // Return the linked doc info
    return success({
      hasLinkedDoc: true,
      linkedDoc: {
        docSlug: linkedDoc.projectSlug,
        projectName: linkedDoc.repoName,
        repoUrl: linkedDoc.repoUrl,
        repoOwner: linkedDoc.repoOwner,
        repoName: linkedDoc.repoName,
        branch: linkedDoc.branch,
        createdAt: linkedDoc.createdAt,
        chapterCount: linkedDoc.chapters.length,
        chapters: linkedDoc.chapters.map(c => ({
          filename: c.filename,
          title: c.title,
          order: c.order,
        })),
        llmProvider: linkedDoc.llmProvider,
        llmModel: linkedDoc.llmModel,
      },
    });
  } catch (error) {
    console.error('[project-linked-doc] GET Error:', error);
    return serverError(error, 'Failed to get linked documentation for project');
  }
}
