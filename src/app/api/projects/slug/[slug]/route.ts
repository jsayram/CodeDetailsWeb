import { NextRequest, NextResponse } from "next/server";
import { getProjectBySlugServer } from "@/db/actions";
import { auth } from "@clerk/nextjs/server";

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
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
