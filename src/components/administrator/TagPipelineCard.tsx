'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  GitBranch
} from "lucide-react";
import type { TagPipelineMetrics } from "@/app/actions/advanced-analytics";
import { FormattedDate } from "@/lib/FormattedDate";

interface TagPipelineCardProps {
  metrics: TagPipelineMetrics;
}

export function TagPipelineCard({ metrics }: TagPipelineCardProps) {
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-muted/60 text-yellow-900 dark:text-yellow-500';
      case 'approved':
        return 'bg-green-700 dark:bg-green-400 text-white';
      case 'rejected':
        return 'bg-red-700 dark:bg-red-400 text-white';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle>Tag Submission Pipeline</CardTitle>
          </div>
          <CardDescription>
            Analytics for tag submission workflow and review process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Submissions */}
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics.totalSubmissions}
              </p>
            </div>

            {/* Pending */}
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <p className="text-sm text-yellow-800 dark:text-yellow-500">Pending</p>
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-400 mt-1">
                {metrics.pendingCount}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-600 mt-1">
                {metrics.submissionsByStatus.find(s => s.status === 'pending')?.percentage || 0}% of total
              </p>
            </div>

            {/* Approved */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <p className="text-sm text-green-800 dark:text-green-500">Approved</p>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-400 mt-1">
                {metrics.approvedCount}
              </p>
              <p className="text-xs text-green-700 dark:text-green-600 mt-1">
                {metrics.approvalRate}% approval rate
              </p>
            </div>

            {/* Rejected */}
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <p className="text-sm text-red-800 dark:text-red-500">Rejected</p>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-400 mt-1">
                {metrics.rejectedCount}
              </p>
              <p className="text-xs text-red-700 dark:text-red-600 mt-1">
                {metrics.rejectionRate}% rejection rate
              </p>
            </div>
          </div>

          {/* Average Review Time */}
          {metrics.avgReviewTimeHours !== null && (
            <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-muted-foreground/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Average Review Time</p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {metrics.avgReviewTimeHours < 1 
                    ? `${Math.round(metrics.avgReviewTimeHours * 60)} minutes`
                    : metrics.avgReviewTimeHours < 24
                    ? `${metrics.avgReviewTimeHours.toFixed(1)} hours`
                    : `${(metrics.avgReviewTimeHours / 24).toFixed(1)} days`
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Submitters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Tag Submitters</CardTitle>
          <CardDescription>
            Most active users submitting tag suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topSubmitters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No submissions yet
              </p>
            ) : (
              metrics.topSubmitters.map((submitter, index) => (
                <div
                  key={submitter.submitter_email}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">
                      #{index + 1}
                    </span>
                    <p className="text-sm font-medium truncate">
                      {submitter.submitter_email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center min-w-[50px]">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold">{submitter.total_submissions}</p>
                    </div>
                    <div className="text-center min-w-[50px]">
                      <p className="text-green-600 dark:text-green-500">Approved</p>
                      <p className="font-bold text-green-700 dark:text-green-400">
                        {submitter.approved}
                      </p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-muted-foreground">Rate</p>
                      <p className="font-bold text-primary">
                        {submitter.approval_rate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tag Submissions</CardTitle>
          <CardDescription>
            Latest 50 tag submissions with review status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent submissions
              </p>
            ) : (
              metrics.recentSubmissions.slice(0, 20).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className={getStatusBadgeStyle(submission.status)}>
                      <span className="opacity-70">#</span>{submission.tag_name}
                    </Badge>
                    <p className="text-sm text-muted-foreground truncate">
                      by {submission.submitter_email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <FormattedDate date={submission.created_at} />
                    {submission.review_time_hours !== null && (
                      <span className="text-primary font-medium">
                        Reviewed in {submission.review_time_hours < 1 
                          ? `${Math.round(submission.review_time_hours * 60)}m`
                          : submission.review_time_hours < 24
                          ? `${submission.review_time_hours.toFixed(1)}h`
                          : `${(submission.review_time_hours / 24).toFixed(1)}d`
                        }
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
