import { NextRequest } from "next/server";
import { getProjectBySlugServer } from "@/db/actions";
import { auth } from "@clerk/nextjs/server";
import { success, notFound, databaseError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Get auth data to check permissions
    const { userId, sessionClaims } = await auth();
    const userEmail = sessionClaims?.email as string | undefined;
    
    const project = await getProjectBySlugServer(
      resolvedParams.slug,
      userId,
      userEmail
    );

    if (!project) {
      return notFound("project", { identifier: resolvedParams.slug, identifierType: "slug" });
    }

    return success(project);
  } catch (error) {
    return databaseError(error, "Failed to fetch project");
  }
}
