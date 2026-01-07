"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface CompletenessScoreProps {
  visibleFieldIds: string[];
  categoryData: Record<string, unknown>;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "compact" | "detailed";
}

// =============================================================================
// Custom Progress with Color Support
// =============================================================================

interface ColoredProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

function ColoredProgress({ value, className, indicatorClassName }: ColoredProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", indicatorClassName || "bg-primary")}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

// =============================================================================
// Encouraging Messages
// =============================================================================

function getEncouragingMessage(percentage: number): string {
  if (percentage === 0) {
    return "Start adding fields to showcase your project!";
  }
  if (percentage < 25) {
    return "Good start! Keep adding details.";
  }
  if (percentage < 50) {
    return "Nice progress! Add more to stand out.";
  }
  if (percentage < 75) {
    return "Looking good! Almost there.";
  }
  if (percentage < 100) {
    return "Great detail! Just a bit more.";
  }
  return "Excellent! All fields complete! 🎉";
}

// =============================================================================
// Progress Color
// =============================================================================

function getProgressColor(percentage: number): string {
  if (percentage < 25) return "bg-red-500";
  if (percentage < 50) return "bg-orange-500";
  if (percentage < 75) return "bg-yellow-500";
  if (percentage < 100) return "bg-blue-500";
  return "bg-green-500";
}

// =============================================================================
// Calculate Score
// =============================================================================

export function calculateCompletenessScore(
  visibleFieldIds: string[],
  categoryData: Record<string, unknown>
): { completed: number; total: number; percentage: number } {
  if (visibleFieldIds.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  // Count fields that have meaningful data
  const completed = visibleFieldIds.filter((fieldId) => {
    const value = categoryData[fieldId];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  const total = visibleFieldIds.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

// =============================================================================
// Main Component
// =============================================================================

export function CompletenessScore({
  visibleFieldIds,
  categoryData,
  className,
  showLabel = true,
  variant = "default",
}: CompletenessScoreProps) {
  const { completed, total, percentage } = calculateCompletenessScore(
    visibleFieldIds,
    categoryData
  );

  // No fields visible - don't show anything
  if (total === 0) {
    return null;
  }

  const message = getEncouragingMessage(percentage);
  const progressColor = getProgressColor(percentage);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-16">
          <ColoredProgress
            value={percentage}
            className="h-1.5"
            indicatorClassName={progressColor}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Project Completeness</span>
          <span className="text-sm text-muted-foreground">
            {completed} of {total} fields ({percentage}%)
          </span>
        </div>
        <ColoredProgress
          value={percentage}
          className="h-2"
          indicatorClassName={progressColor}
        />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 max-w-32">
        <ColoredProgress
          value={percentage}
          className="h-2"
          indicatorClassName={progressColor}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {percentage}% complete
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Detailed Score Card (for modal/summary)
// =============================================================================

export interface CompletenessScoreCardProps {
  visibleFieldIds: string[];
  categoryData: Record<string, unknown>;
  fieldLabels?: Record<string, string>;
  className?: string;
}

export function CompletenessScoreCard({
  visibleFieldIds,
  categoryData,
  fieldLabels = {},
  className,
}: CompletenessScoreCardProps) {
  const { completed, total, percentage } = calculateCompletenessScore(
    visibleFieldIds,
    categoryData
  );

  // Group fields by completion status
  const completedFields: string[] = [];
  const incompleteFields: string[] = [];

  visibleFieldIds.forEach((fieldId) => {
    const value = categoryData[fieldId];
    const hasValue =
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim() !== "") &&
      (!Array.isArray(value) || value.length > 0);

    if (hasValue) {
      completedFields.push(fieldId);
    } else {
      incompleteFields.push(fieldId);
    }
  });

  const message = getEncouragingMessage(percentage);
  const progressColor = getProgressColor(percentage);

  return (
    <div className={cn("rounded-lg border p-4 space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Project Completeness</h4>
          <span
            className={cn(
              "text-2xl font-bold",
              percentage === 100 && "text-green-500"
            )}
          >
            {percentage}%
          </span>
        </div>
        <ColoredProgress
          value={percentage}
          className="h-2.5"
          indicatorClassName={progressColor}
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {/* Field breakdown */}
      {total > 0 && (
        <div className="space-y-3 pt-2 border-t">
          {/* Completed fields */}
          {completedFields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-500 mb-1">
                ✓ Completed ({completedFields.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {completedFields.map((fieldId) => (
                  <span
                    key={fieldId}
                    className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  >
                    {fieldLabels[fieldId] ?? fieldId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Incomplete fields */}
          {incompleteFields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                ○ Needs attention ({incompleteFields.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {incompleteFields.map((fieldId) => (
                  <span
                    key={fieldId}
                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {fieldLabels[fieldId] ?? fieldId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
