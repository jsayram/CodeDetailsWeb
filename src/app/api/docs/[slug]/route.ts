/**
 * Delete Project API Route
 * 
 * DELETE /api/docs/[slug]
 * 
 * Deletes a generated documentation project.
 * RFC 7807 compliant error responses.
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProjectMeta, deleteProject } from '@/lib/output-utils';
import { 
  unauthorized, 
  notFound, 
  notOwner, 
  serverError, 
  invalidInput,
  success 
} from '@/lib/api-errors';
import { docSlugParamSchema } from '@/lib/validations/docs';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return unauthorized('Authentication required to delete documentation');
    }

    const { slug } = await params;
    
    // Validate slug parameter
    const validation = docSlugParamSchema.safeParse({ slug });
    if (!validation.success) {
      return invalidInput('Invalid documentation slug provided');
    }

    // Get project metadata to verify ownership
    const meta = await getProjectMeta(slug);
    
    if (!meta) {
      return notFound('documentation', { identifier: slug });
    }

    // Verify ownership
    if (meta.userId !== userId) {
      return notOwner('documentation');
    }

    // Delete the project
    const deleted = await deleteProject(slug);
    
    if (!deleted) {
      return serverError(undefined, 'Failed to delete documentation');
    }

    return success({ deleted: true, slug });
  } catch (error) {
    console.error('[docs-delete] Error:', error);
    return serverError(error, 'Failed to delete documentation');
  }
}
