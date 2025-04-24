"use server";

import { executeQuery } from "@/db/server";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitNewTag(
  tagName: string,
  projectId: string,
  submitterEmail: string,
  description?: string
) {
  return executeQuery(async (db) => {
    const [submission] = await db
      .insert(tag_submissions)
      .values({
        tag_name: tagName.trim(),
        project_id: projectId,
        submitter_email: submitterEmail,
        description: description?.trim(),
      })
      .returning();

    return submission;
  });
}

export async function getPendingTagSubmissions() {
  return executeQuery(async (db) => {
    return db
      .select()
      .from(tag_submissions)
      .where(eq(tag_submissions.status, "pending"))
      .orderBy(tag_submissions.created_at);
  });
}

export async function approveTagSubmission(submissionId: string, adminNotes?: string) {
  return executeQuery(async (db) => {
    // Get the submission
    const [submission] = await db
      .select()
      .from(tag_submissions)
      .where(eq(tag_submissions.id, submissionId));

    if (!submission) throw new Error("Submission not found");

    // Create or get the tag
    let tagId: string;
    const existingTag = await db
      .select()
      .from(tags)
      .where(eq(tags.name, submission.tag_name.trim()))
      .limit(1);

    if (existingTag.length > 0) {
      tagId = existingTag[0].id;
    } else {
      const [newTag] = await db
        .insert(tags)
        .values({
          name: submission.tag_name.trim(),
        })
        .returning();
      tagId = newTag.id;
    }

    // Associate tag with project
    await db.insert(project_tags).values({
      project_id: submission.project_id,
      tag_id: tagId,
    });

    // Update submission status
    await db
      .update(tag_submissions)
      .set({
        status: "approved",
        admin_notes: adminNotes,
        reviewed_at: new Date(),
      })
      .where(eq(tag_submissions.id, submissionId));

    revalidatePath("/projects");
    revalidatePath("/administrator/dashboard");
  });
}

export async function rejectTagSubmission(submissionId: string, adminNotes: string) {
  return executeQuery(async (db) => {
    await db
      .update(tag_submissions)
      .set({
        status: "rejected",
        admin_notes: adminNotes,
        reviewed_at: new Date(),
      })
      .where(eq(tag_submissions.id, submissionId));

    revalidatePath("/administrator/dashboard");
  });
}