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
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";
import Link from "next/link";
import { getProjectTagCounts } from "@/app/actions/projects";

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
  const [projectSlugs, setProjectSlugs] = useState<Record<string, string>>({});
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

  const handleIndividualApprove = async (
    submissionId: string, 
    tagName: string,
    approvalType: "system" | "project"
  ) => {
    if (isProcessing[submissionId]) return;
    
    setIsProcessing((prev) => ({ ...prev, [submissionId]: true }));

    try {
      await approveTagSubmission(submissionId, adminNotes[submissionId], approvalType);
      const approvalMessage = approvalType === "system" 
        ? `Tag "${tagName}" approved for system only`
        : `Tag "${tagName}" approved for system and project`;
      toast.success(approvalMessage);
      
      // Refresh the tag cache
      await refreshCache();
      
      // Update state to remove the approved submission
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
      const projectSlugMap: Record<string, string> = {};

      // Fetch project details
      for (const projectId of uniqueProjectIds) {
        const project = await getProjectById(projectId);
        if (project) {
          projectNameMap[projectId] = project.title;
          projectSlugMap[projectId] = project.slug;
        }
      }

      // Fetch tag counts for all projects at once
      const projectTagCountMap = await getProjectTagCounts(uniqueProjectIds);

      setProjectNames((prev) => ({ ...prev, ...projectNameMap }));
      setProjectTagCounts((prev) => ({ ...prev, ...projectTagCountMap }));
      setProjectSlugs((prev) => ({ ...prev, ...projectSlugMap }));
    };

    if (submissions.length > 0) {
      fetchProjectNames();
    }
  }, [submissions]);

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No pending tag submissions to review.
        </div>
      ) : (
        submissions.map((groupedTag) => (
          <Card key={groupedTag.tag_name} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium">Tag:</span>
                  <Badge className="flex-shrink-0">{groupedTag.tag_name}</Badge>
                  <Badge variant="secondary" className="flex-shrink-0">{groupedTag.count} projects</Badge>
                </div>
                <Button
                  onClick={() => handleApprove(groupedTag)}
                  disabled={isProcessing[groupedTag.submissions[0]?.id]}
                  className="cursor-pointer flex-shrink-0 w-full sm:w-auto"
                  size="sm"
                >
                  Approve All
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">
                This tag has been requested for multiple projects
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="single" collapsible>
                <AccordionItem value="submissions" className="border-0">
                  <AccordionTrigger className="text-sm py-2">View All Submissions</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {groupedTag.submissions.map((submission) => {
                        const tagCount = projectTagCounts[submission.project_id] || 0;
                        const isAtMax = tagCount >= MAX_PROJECT_TAGS;
                        
                        return (
                        <div
                          key={submission.id}
                          className={`border rounded-lg p-3 space-y-3 overflow-hidden ${
                            isAtMax ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">
                                  Project:{" "}
                                  {projectNames[submission.project_id] && projectSlugs[submission.project_id] ? (
                                    <Link 
                                      href={`/projects/${projectSlugs[submission.project_id]}`}
                                      className="text-primary hover:underline"
                                      target="_blank"
                                    >
                                      {projectNames[submission.project_id]}
                                    </Link>
                                  ) : (
                                    projectNames[submission.project_id] || "Loading..."
                                  )}
                                </p>
                                <Badge 
                                  variant={isAtMax ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {tagCount}/{MAX_PROJECT_TAGS} tags
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                Submitted by: {submission.submitter_email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Date:{" "}
                                {submission.created_at ? (
                                  <FormattedDate date={submission.created_at} />
                                ) : (
                                  "N/A"
                                )}
                              </p>
                              {isAtMax && (
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                                  ⚠️ Project has maximum tags - can only approve for system
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleIndividualApprove(
                                    submission.id,
                                    groupedTag.tag_name,
                                    "system"
                                  )
                                }
                                disabled={isProcessing[submission.id]}
                                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                Approve for System
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleIndividualApprove(
                                    submission.id,
                                    groupedTag.tag_name,
                                    "project"
                                  )
                                }
                                disabled={isProcessing[submission.id] || isAtMax}
                                className="flex-1 sm:flex-initial text-xs"
                                title={isAtMax ? "Project has maximum tags (15/15)" : "Approve and add to project"}
                              >
                                Approve for Project
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleReject(submission.id, groupedTag.tag_name)
                                }
                                disabled={isProcessing[submission.id]}
                                className="flex-1 sm:flex-initial text-xs"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                          {submission.description && (
                            <div className="overflow-hidden">
                              <h4 className="font-medium text-sm mb-1">Description:</h4>
                              <p className="text-xs text-muted-foreground break-words">
                                {submission.description}
                              </p>
                            </div>
                          )}
                          <div>
                            <label
                              htmlFor={`notes-${submission.id}`}
                              className="font-medium text-sm block mb-2"
                            >
                              Admin Notes{" "}
                              {!adminNotes[submission.id]?.trim() &&
                                <span className="text-xs text-muted-foreground">(required for rejection)</span>}
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
                              className="text-sm min-h-[80px]"
                            />
                          </div>
                        </div>
                      )}
                    )}
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