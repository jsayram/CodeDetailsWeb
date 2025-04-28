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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getProjectById } from "@/app/actions/projects";
import { FormattedDate } from "@/lib/FormattedDate";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTagCache } from "@/hooks/use-tag-cache";

interface GroupedTagSubmission {
  tag_name: string;
  count: number;
  submissions: SelectTagSubmission[];
}

interface TagSubmissionManagementProps {
  initialSubmissions: GroupedTagSubmission[];
}

export function TagSubmissionManagement({
  initialSubmissions,
}: TagSubmissionManagementProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [projectTagCounts, setProjectTagCounts] = useState<Record<string, number>>({});
  const { refreshCache } = useTagCache();

  const handleApprove = async (groupedTag: GroupedTagSubmission) => {
    const submissionIds = groupedTag.submissions.map((s) => s.id);
    const someProcessing = submissionIds.some((id) => isProcessing[id]);
    if (someProcessing) return;

    const newProcessingState = submissionIds.reduce(
      (acc, id) => ({ ...acc, [id]: true }),
      {}
    );
    setIsProcessing((prev) => ({ ...prev, ...newProcessingState }));

    try {
      const results = await Promise.allSettled(
        groupedTag.submissions.map((submission) =>
          approveTagSubmission(submission.id, adminNotes[submission.id])
        )
      );

      // Process results
      const errors: string[] = [];
      let successCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push(`Failed to approve tag for ${projectNames[groupedTag.submissions[index].project_id]}: ${result.reason?.message || 'Unknown error'}`);
        } else {
          successCount++;
        }
      });

      if (errors.length > 0) {
        if (successCount > 0) {
          toast.success(`Successfully approved ${successCount} tag submission(s)`);
        }
        toast.error(
          <div>
            <p>Some tags could not be approved:</p>
            <ul className="list-disc pl-4 mt-2">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        );
      } else {
        toast.success(
          `All submissions for tag "${groupedTag.tag_name}" approved successfully`
        );
      }

      await refreshCache();

      // Remove all submissions that were handled (either approved or rejected)
      setSubmissions((prevSubmissions) =>
        prevSubmissions.filter((group) => group.tag_name !== groupedTag.tag_name)
      );
    } catch (error) {
      console.error("Error approving tags:", error);
      toast.error("Failed to approve some tags");
    } finally {
      const clearedProcessingState = submissionIds.reduce(
        (acc, id) => ({ ...acc, [id]: false }),
        {}
      );
      setIsProcessing((prev) => ({ ...prev, ...clearedProcessingState }));
    }
  };

  const handleIndividualApprove = async (submissionId: string, tagName: string) => {
    if (isProcessing[submissionId]) return;
    
    setIsProcessing((prev) => ({ ...prev, [submissionId]: true }));

    try {
      await approveTagSubmission(submissionId, adminNotes[submissionId]);
      toast.success(`Tag "${tagName}" approved successfully`);
      
      // Refresh the tag cache and wait for it to complete
      await refreshCache();
      
      // Force an immediate refresh of project data
      window.location.reload();

      setSubmissions((prevSubmissions) => {
        const updatedSubmissions = prevSubmissions
          .map((group) => ({
            ...group,
            submissions: group.submissions.filter((s) => s.id !== submissionId),
          }))
          .filter((group) => group.submissions.length > 0);
        return updatedSubmissions;
      });
    } catch (error) {
      console.error("Error approving tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve tag");
    } finally {
      setIsProcessing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleReject = async (submissionId: string, tagName: string) => {
    if (!adminNotes[submissionId]?.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    setIsProcessing((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await rejectTagSubmission(submissionId, adminNotes[submissionId]);
      toast.success("Tag submission rejected");

      setSubmissions((prev) =>
        prev
          .map((group) => {
            if (group.tag_name === tagName) {
              const updatedSubmissions = group.submissions.filter(
                (s) => s.id !== submissionId
              );
              return {
                ...group,
                count: updatedSubmissions.length,
                submissions: updatedSubmissions,
              };
            }
            return group;
          })
          .filter((group) => group.count > 0)
      );
    } catch (error) {
      toast.error("Failed to reject tag submission");
    } finally {
      setIsProcessing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  useEffect(() => {
    const fetchProjectNames = async () => {
      const projectIds = submissions.flatMap((group) =>
        group.submissions.map((submission) => submission.project_id)
      );

      const uniqueProjectIds = Array.from(new Set(projectIds));
      const projectNameMap: Record<string, string> = {};

      for (const projectId of uniqueProjectIds) {
        const project = await getProjectById(projectId);
        if (project) {
          projectNameMap[projectId] = project.title;
        }
      }

      setProjectNames((prev) => ({ ...prev, ...projectNameMap }));
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
        submissions.map((groupedTag) => (
          <Card key={groupedTag.tag_name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  Tag: <Badge>{groupedTag.tag_name}</Badge>
                  <Badge variant="secondary">{groupedTag.count} projects</Badge>
                </div>
                <Button
                  onClick={() => handleApprove(groupedTag)}
                  disabled={isProcessing[groupedTag.submissions[0]?.id]}
                >
                  Approve All
                </Button>
              </CardTitle>
              <CardDescription>
                This tag has been requested for multiple projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="submissions">
                  <AccordionTrigger>View All Submissions</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {groupedTag.submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="border rounded-lg p-4 space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Project:{" "}
                                {projectNames[submission.project_id] || "Loading..."}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Submitted by: {submission.submitter_email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {submission.created_at ? (
                                  <FormattedDate date={submission.created_at} />
                                ) : (
                                  "N/A"
                                )}
                              </p>
                            </div>
                            <div className="space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleIndividualApprove(
                                    submission.id,
                                    groupedTag.tag_name
                                  )
                                }
                                disabled={isProcessing[submission.id]}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleReject(submission.id, groupedTag.tag_name)
                                }
                                disabled={isProcessing[submission.id]}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                          {submission.description && (
                            <div>
                              <h4 className="font-medium mb-2">Description:</h4>
                              <p className="text-sm text-muted-foreground">
                                {submission.description}
                              </p>
                            </div>
                          )}
                          <div>
                            <label
                              htmlFor={`notes-${submission.id}`}
                              className="font-medium block mb-2"
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
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}