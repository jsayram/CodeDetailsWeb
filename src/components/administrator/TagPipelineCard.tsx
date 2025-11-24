"use client";

import React from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { TagPipelineMetrics } from "@/app/actions/advanced-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface TagPipelineCardProps {
  metrics: TagPipelineMetrics | null;
}

export function TagPipelineCard({ metrics }: TagPipelineCardProps) {
  if (!metrics) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Tag Submission Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No tag submission data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-sm font-medium">Tag Submission Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        <div className="grid grid-cols-1 gap-4">
          {/* Total Tags */}
          <div className="p-3 md:p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Total Tags</p>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {metrics.totalSubmissions}
            </p>
          </div>

          {/* Pending */}
          <div className="p-3 md:p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <p className="text-sm font-medium">Pending</p>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold">
              {metrics.pendingCount}
            </p>
          </div>

          {/* Approved */}
          <div className="p-3 md:p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                <p className="text-sm font-medium">Approved</p>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold">
              {metrics.approvedCount}
            </p>
          </div>

          {/* Rejected */}
          <div className="p-3 md:p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <p className="text-sm font-medium">Rejected</p>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold">
              {metrics.rejectedCount}
            </p>
          </div>

          {/* Avg Review Time */}
          {metrics.avgReviewTimeHours !== null && (
            <div className="p-3 md:p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                  <p className="text-sm font-medium">Avg Review Time</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold">
                {metrics.avgReviewTimeHours.toFixed(1)}h
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopSubmittersCard({ metrics }: TagPipelineCardProps) {
  if (!metrics) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Top Tag Submitters</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No submitter data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-sm font-medium">Top Tag Submitters</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        <div className="space-y-4">
          {metrics.topSubmitters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submitter data available</p>
          ) : (
            metrics.topSubmitters.map((submitter, index) => (
              <div
                key={submitter.submitter_email}
                className="flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs md:text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {submitter.submitter_email?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {submitter.submitter_email || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submitter.total_submissions} submission{submitter.total_submissions !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs px-1.5 md:px-2">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600 dark:text-green-500" />
                    {submitter.approved}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 md:px-2">
                    <Clock className="h-3 w-3 mr-1 text-yellow-600 dark:text-yellow-500" />
                    {submitter.pending}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 md:px-2">
                    <XCircle className="h-3 w-3 mr-1 text-red-600 dark:text-red-500" />
                    {submitter.rejected}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentSubmissionsCard({ metrics }: TagPipelineCardProps) {
  if (!metrics) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Recent Tag Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent submissions available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge variant="outline" className="text-xs">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-xs">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-sm font-medium">Recent Tag Submissions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        <div className="space-y-4">
          {metrics.recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent submissions</p>
          ) : (
            metrics.recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-2.5 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{submission.tag_name}</Badge>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {submission.submitter_email?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-muted-foreground truncate">
                        {submission.submitter_email || "Unknown User"}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">•</span>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
