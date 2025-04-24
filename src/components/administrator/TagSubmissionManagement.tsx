"use client";

import { useEffect } from "react";
import { SelectTagSubmission } from "@/db/schema/tag_submissions";
import {
  approveTagSubmission,
  rejectTagSubmission,
} from "@/app/actions/tag-submissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { addTagToProjectAction } from "@/app/actions/tags";
import { getProjectById } from "@/app/actions/projects";

interface TagSubmissionManagementProps {
  initialSubmissions: SelectTagSubmission[];
}

export function TagSubmissionManagement({
  initialSubmissions,
}: TagSubmissionManagementProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [projectNames, setProjectNames] = useState<Record<string, string>>({}); // Cache project names

  const handleApprove = async (submissionId: string) => {
    setIsProcessing((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // First approve the tag submission
      await approveTagSubmission(submissionId, adminNotes[submissionId]);

      // If project_id exists, add the tag and connect it to the project
      if (submission.project_id) {
        await addTagToProjectAction(submission.project_id, submission.tag_name);
        toast.success(
          `Tag "${submission.tag_name}" has been added to the project "${projectNames[submission.project_id]}"`,
        );
      }

      toast.success("Tag submission approved and connected to project");
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (error) {
      toast.error("Failed to approve tag submission");
    } finally {
      setIsProcessing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!adminNotes[submissionId]?.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    setIsProcessing((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await rejectTagSubmission(submissionId, adminNotes[submissionId]);
      toast.success("Tag submission rejected");
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (error) {
      toast.error("Failed to reject tag submission");
    } finally {
      setIsProcessing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  useEffect(() => {
    // Fetch project names for submissions with project_id
    const fetchProjectNames = async () => {
      const projectIds = submissions
        .filter((submission) => submission.project_id)
        .map((submission) => submission.project_id);

      const uniqueProjectIds = Array.from(new Set(projectIds)); // Avoid duplicate requests

      const projectNameMap: Record<string, string> = {};
      for (const projectId of uniqueProjectIds) {
        const project = await getProjectById(projectId); // Fetch project details
        if (project) {
          projectNameMap[projectId] = project.title;
        }
      }

      setProjectNames((prev) => ({ ...prev, ...projectNameMap })); // Merge with existing project names
    };

    if (submissions.length > 0) {
      fetchProjectNames();
    }
  }, [submissions]);

  return (
    <div className="grid gap-6">
      {submissions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No pending tag submissions to review.
        </div>
      ) : (
        submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle>
                New Tag Submission:<Badge> {submission.tag_name} </Badge>
              </CardTitle>
              <CardDescription>
                <div>
                  <div>
                    Submitted by: {submission.submitter_email}
                    <br />
                    Date:{" "}
                    {submission.created_at
                      ? new Date(submission.created_at).toLocaleDateString()
                      : "N/A"}
                  </div>
                  {submission.project_id && (
                    <div>
                      <div>
                        Project:{" "}
                        <Badge variant="outline" className="ml-1">
                          {projectNames[submission.project_id] || "Loading..."}
                        </Badge>
                      </div>
                      <div>
                        Project ID:{" "}
                        <span className="font-mono text-xs">
                          {submission.project_id}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description:</h4>
                    <p className="text-sm text-muted-foreground">
                      {submission.description}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label
                    htmlFor={`notes-${submission.id}`}
                    className="font-medium"
                  >
                    Admin Notes{" "}
                    {!adminNotes[submission.id]?.trim() &&
                      "(required for rejection)"}
                  </label>
                  <Textarea
                    id={`notes-${submission.id}`}
                    placeholder="Add your feedback here..."
                    value={adminNotes[submission.id] || ""}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({
                        ...prev,
                        [submission.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleReject(submission.id)}
                disabled={isProcessing[submission.id]}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleApprove(submission.id)}
                disabled={isProcessing[submission.id]}
              >
                {submission.project_id ? "Approve & Connect" : "Approve"}
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}