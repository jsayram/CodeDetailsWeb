import { NextRequest } from "next/server";
import { executeQuery } from "@/db/server";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { eq, and } from "drizzle-orm";
import { success, invalidInput, databaseError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const submitterEmail = searchParams.get("email");

    if (!submitterEmail) {
      return invalidInput("Submitter email is required");
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

    return success(submissions);
  } catch (error) {
    return databaseError(error, "Failed to fetch tag submissions");
  }
}