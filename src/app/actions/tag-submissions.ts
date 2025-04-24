"use server";

import { executeQuery } from "@/db/server";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { eq, and, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitNewTag(
  tagName: string,
  projectId: string,
  submitterEmail: string,
  description?: string
) {
  return executeQuery(async (db) => {
    const normalizedTagName = tagName.trim().toLowerCase();

    // First check if tag already exists in approved tags (case-insensitive)
    const existingTag = await db
      .select()
      .from(tags)
      .where(eq(tags.name, normalizedTagName))
      .limit(1);

    if (existingTag.length > 0) {
      // Check if the project already has this tag
      const existingProjectTag = await db
        .select()
        .from(project_tags)
        .where(
          and(
            eq(project_tags.project_id, projectId),
            eq(project_tags.tag_id, existingTag[0].id)
          )
        )
        .limit(1);

      // If project already has the tag, just return success without doing anything
      if (existingProjectTag.length > 0) {
        return {
          status: "auto_approved",
          tag_name: normalizedTagName,
          message: "This project already has this tag"
        };
      }

      // If tag exists but project doesn't have it, add it to the project
      await db.insert(project_tags).values({
        project_id: projectId,
        tag_id: existingTag[0].id,
      });

      return {
        status: "auto_approved",
        tag_name: normalizedTagName,
        message: "Tag already exists and has been added to your project"
      };
    }

    // Check for existing pending submission from the same user for the same project and tag
    const existingSubmission = await db
      .select()
      .from(tag_submissions)
      .where(
        and(
          eq(tag_submissions.project_id, projectId),
          eq(tag_submissions.tag_name, normalizedTagName),
          eq(tag_submissions.submitter_email, submitterEmail),
          eq(tag_submissions.status, "pending")
        )
      )
      .limit(1);

    if (existingSubmission.length > 0) {
      throw new Error("You already have a pending submission for this tag");
    }

    // Create new tag submission for review
    const [submission] = await db
      .insert(tag_submissions)
      .values({
        tag_name: normalizedTagName,
        project_id: projectId,
        submitter_email: submitterEmail,
        description: description?.trim(),
      })
      .returning();

    return {
      ...submission,
      status: "pending"
    };
  });
}

export async function getPendingTagSubmissions() {
  return executeQuery(async (db) => {
    const submissions = await db
      .select({
        id: tag_submissions.id,
        tag_name: tag_submissions.tag_name,
        project_id: tag_submissions.project_id,
        submitter_email: tag_submissions.submitter_email,
        description: tag_submissions.description,
        status: tag_submissions.status,
        created_at: tag_submissions.created_at,
        updated_at: tag_submissions.updated_at,
        admin_notes: tag_submissions.admin_notes,
        reviewed_at: tag_submissions.reviewed_at
      })
      .from(tag_submissions)
      .where(eq(tag_submissions.status, "pending"))
      .orderBy(tag_submissions.created_at);

    // Group submissions by tag_name
    const groupedSubmissions = submissions.reduce((acc, submission) => {
      const normalizedTagName = submission.tag_name.trim().toLowerCase();
      if (!acc[normalizedTagName]) {
        acc[normalizedTagName] = {
          tag_name: normalizedTagName,
          count: 0,
          submissions: [],
        };
      }
      acc[normalizedTagName].count++;
      acc[normalizedTagName].submissions.push(submission);
      return acc;
    }, {} as Record<string, { tag_name: string; count: number; submissions: typeof submissions }>);

    return Object.values(groupedSubmissions);
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

    // Find all other pending submissions for the same tag
    const otherPendingSubmissions = await db
      .select()
      .from(tag_submissions)
      .where(
        and(
          eq(tag_submissions.tag_name, submission.tag_name.trim()),
          eq(tag_submissions.status, "pending"),
          not(eq(tag_submissions.id, submissionId))
        )
      );

    // Begin a transaction to update all submissions and create project associations
    const updates = [];

    // Update the original submission
    updates.push(
      db
        .update(tag_submissions)
        .set({
          status: "approved",
          admin_notes: adminNotes,
          reviewed_at: new Date(),
        })
        .where(eq(tag_submissions.id, submissionId))
    );

    // Create project-tag association for the original submission
    const existingProjectTag = await db
      .select()
      .from(project_tags)
      .where(
        and(
          eq(project_tags.project_id, submission.project_id),
          eq(project_tags.tag_id, tagId)
        )
      )
      .limit(1);

    if (existingProjectTag.length === 0) {
      updates.push(
        db.insert(project_tags).values({
          project_id: submission.project_id,
          tag_id: tagId,
        })
      );
    }

    // Update all other pending submissions for the same tag
    for (const pendingSubmission of otherPendingSubmissions) {
      updates.push(
        db
          .update(tag_submissions)
          .set({
            status: "approved",
            admin_notes: "Automatically approved as tag was approved for another submission",
            reviewed_at: new Date(),
          })
          .where(eq(tag_submissions.id, pendingSubmission.id))
      );

      // Check if this project already has the tag
      const existingPendingProjectTag = await db
        .select()
        .from(project_tags)
        .where(
          and(
            eq(project_tags.project_id, pendingSubmission.project_id),
            eq(project_tags.tag_id, tagId)
          )
        )
        .limit(1);

      if (existingPendingProjectTag.length === 0) {
        updates.push(
          db.insert(project_tags).values({
            project_id: pendingSubmission.project_id,
            tag_id: tagId,
          })
        );
      }
    }

    // Execute all updates
    await Promise.all(updates);

    // Revalidate necessary paths and clear tag cache
    revalidatePath("/projects");
    revalidatePath("/administrator/dashboard");
    revalidatePath("/api/tags"); // This will force the tag cache to be refreshed
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