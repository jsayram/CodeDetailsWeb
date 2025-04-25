import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params; // Await params to resolve it
    const projectId = resolvedParams.id; // Access id after resolving params

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const submitterEmail = searchParams.get("email");

    if (!submitterEmail) {
      return NextResponse.json(
        { error: "Submitter email is required" },
        { status: 400 }
      );
    }

    const submissions = await executeQuery(async (db) => {
      return db
        .select()
        .from(tag_submissions)
        .where(
          and(
            eq(tag_submissions.project_id, projectId),
            eq(tag_submissions.status, status),
            eq(tag_submissions.submitter_email, submitterEmail)
          )
        )
        .orderBy(tag_submissions.created_at);
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching tag submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag submissions" },
      { status: 500 }
    );
  }
}