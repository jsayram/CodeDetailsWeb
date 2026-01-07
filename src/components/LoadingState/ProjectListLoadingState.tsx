import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PROJECTS_PER_PAGE } from "../navigation/Pagination/paginationConstants";

interface LoadingStateProps {
  itemsCount?: number;
  showTierInfo?: boolean;
}

export function ProjectListLoadingState({
  itemsCount = PROJECTS_PER_PAGE,
  showTierInfo = true,
}: LoadingStateProps) {
  // Render list view skeleton (project grid lists)
  return (
    <div className="flex flex-col py-6 sm:py-10 sm:-mt-10">
      {/* Controls Section Skeleton */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Left side buttons skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-9 bg-muted rounded w-32 animate-pulse"></div>
          </div>

          {/* Right side controls skeleton */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-row items-center justify-center sm:justify-end gap-3">
            <div className="h-9 bg-muted rounded w-full sm:w-[180px] animate-pulse"></div>
            <div className="h-9 bg-muted rounded w-full sm:w-[180px] animate-pulse"></div>
            <div className="hidden md:flex h-9 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Projects grid skeleton */}
      <div className="project-grid">
        {Array.from({ length: itemsCount }).map((_, i) => (
        <Card
          key={i}
          className="w-full overflow-hidden skeleton-fade project-card"
          style={{ animationDelay: `${i * 20}ms` }}
        >
          <div className="card-content p-4 sm:p-6 flex flex-col h-full">
            {/* Project title */}
            <div className="skeleton-title h-6 bg-muted rounded w-3/4 mb-4 animate-pulse"></div>

            {/* Project description */}
            <div className="space-y-2 flex-grow">
              {[1, 2, 3].map((line) => (
                <div
                  key={line}
                  className="skeleton-description h-4 bg-muted rounded animate-pulse"
                  style={{
                    width: line === 1 ? "100%" : line === 2 ? "85%" : "70%",
                    animationDelay: `${line * 100}ms`,
                  }}
                ></div>
              ))}
            </div>

            {/* Project metadata */}
            <div className="flex justify-between items-center mt-auto pt-4">
              <div className="h-5 bg-muted rounded-full w-20 animate-pulse"></div>
              <div className="h-8 bg-muted rounded-full w-8 animate-pulse"></div>
            </div>
          </div>

          {/* Card footer */}
          <div className="card-footer bg-muted/30 p-3 flex justify-end mt-auto">
            <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </Card>
      ))}
      </div>
    </div>
  );
}
