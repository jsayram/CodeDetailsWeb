"use server";

import { executeQuery } from "@/db/server";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { tags } from "@/db/schema/tags";
import { project_tags } from "@/db/schema/project_tags";
import { eq, and, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm/sql";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";

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

    // Check for any existing submission from the same user for the same project and tag
    const existingSubmission = await db
      .select()
      .from(tag_submissions)
      .where(
        and(
          eq(tag_submissions.project_id, projectId),
          eq(tag_submissions.tag_name, normalizedTagName),
          eq(tag_submissions.submitter_email, submitterEmail)
        )
      )
      .limit(1);

    if (existingSubmission.length > 0) {
      const status = existingSubmission[0].status;
      
      if (status === "pending") {
        throw new Error("You already have a pending submission for this tag");
      } else if (status === "approved") {
        throw new Error("This tag has already been approved for this project");
      }
      // Note: We don't block rejected submissions here because the tag might have been
      // approved by another user since the rejection. The check at the top of this function
      // will auto-approve if the tag now exists in the tags table.
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

export async function approveTagSubmission(
  submissionId: string, 
  adminNotes?: string,
  approvalType: "system" | "project" = "project"
) {
  return executeQuery(async (db) => {
    // Get the submission
    const [submission] = await db
      .select()
      .from(tag_submissions)
      .where(eq(tag_submissions.id, submissionId));

    if (!submission) throw new Error("Submission not found");

    // Count current project tags only if we're approving for the project
    if (approvalType === "project") {
      if (!submission.project_id) {
        throw new Error("Cannot approve tag for project - submission has no project_id");
      }
      
      const currentProjectTags = await db
        .select({ count: sql<number>`count(*)` })
        .from(project_tags)
        .where(eq(project_tags.project_id, submission.project_id));

      const currentTagCount = Number(currentProjectTags[0]?.count) || 0;

      if (currentTagCount >= MAX_PROJECT_TAGS) {
        throw new Error(`Cannot approve tag for project - project already has the maximum of ${MAX_PROJECT_TAGS} tags`);
      }
    }

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

    // Check if the project already has this specific tag
    let existingProjectTag: any[] = [];
    if (submission.project_id) {
      existingProjectTag = await db
        .select()
        .from(project_tags)
        .where(
          and(
            eq(project_tags.project_id, submission.project_id),
            eq(project_tags.tag_id, tagId)
          )
        )
        .limit(1);
    }

    // Begin collecting updates
    const updates = [];

    // Update the original submission
    updates.push(
      db
        .update(tag_submissions)
        .set({
          status: "approved",
          admin_notes: adminNotes || (approvalType === "system" 
            ? "Approved for system-wide use only" 
            : "Approved for system and project"),
          reviewed_at: new Date(),
        })
        .where(eq(tag_submissions.id, submissionId))
    );

    // Only create project-tag association if approving for project AND it doesn't exist
    if (approvalType === "project" && submission.project_id && existingProjectTag.length === 0) {
      updates.push(
        db.insert(project_tags).values({
          project_id: submission.project_id,
          tag_id: tagId,
        })
      );
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

    // Update other pending submissions for the same tag
    for (const pendingSubmission of otherPendingSubmissions) {
      // Only count tags if the submission has a project_id
      if (!pendingSubmission.project_id) {
        // Auto-approve system-wide tag submissions without a project
        updates.push(
          db
            .update(tag_submissions)
            .set({
              status: "approved",
              admin_notes: "Auto-approved - tag approved for system-wide use",
              reviewed_at: new Date(),
            })
            .where(eq(tag_submissions.id, pendingSubmission.id))
        );
        continue;
      }
      
      // Count tags for this project
      const projectTags = await db
        .select({ count: sql<number>`count(*)` })
        .from(project_tags)
        .where(eq(project_tags.project_id, pendingSubmission.project_id));

      const tagCount = Number(projectTags[0]?.count) || 0;

      if (tagCount >= MAX_PROJECT_TAGS) {
        // Update submission as rejected with explanation
        updates.push(
          db
            .update(tag_submissions)
            .set({
              status: "rejected",
              admin_notes: `Could not auto-approve - project already has the maximum of ${MAX_PROJECT_TAGS} tags`,
              reviewed_at: new Date(),
            })
            .where(eq(tag_submissions.id, pendingSubmission.id))
        );
        continue;
      }

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
          db
            .update(tag_submissions)
            .set({
              status: "approved",
              admin_notes: "Automatically approved as tag was approved for another submission",
              reviewed_at: new Date(),
            })
            .where(eq(tag_submissions.id, pendingSubmission.id))
        );

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

    // Force clear ALL tag-related caches with wildcards to ensure complete invalidation
    revalidatePath("/projects", "layout");
    revalidatePath("/administrator/dashboard", "layout");
    revalidatePath("/api/tags", "layout");
    revalidatePath("/api/projects", "layout");
    revalidatePath(`/projects/${submission.project_id}`, "layout");
    revalidatePath("/", "layout");  // Revalidate homepage which might show projects
    revalidatePath("/tags", "layout"); // Revalidate tags page
    revalidatePath(`/api/projects/${submission.project_id}`, "layout"); // Revalidate project API endpoint
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

export async function approveRejectedTagSubmission(
  projectId: string,
  tagName: string,
  submitterEmail: string
) {
  return executeQuery(async (db) => {
    const normalizedTagName = tagName.trim().toLowerCase();

    // Update the rejected submission to approved status
    await db
      .update(tag_submissions)
      .set({
        status: "approved",
        reviewed_at: new Date(),
        admin_notes: "Auto-approved: Tag was added to project after becoming available system-wide",
      })
      .where(
        and(
          eq(tag_submissions.project_id, projectId),
          eq(tag_submissions.tag_name, normalizedTagName),
          eq(tag_submissions.submitter_email, submitterEmail),
          eq(tag_submissions.status, "rejected")
        )
      );

    // Revalidate relevant paths
    revalidatePath("/administrator/dashboard");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}`);
  });
}