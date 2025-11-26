import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PROJECTS_PER_PAGE } from "../navigation/Pagination/paginationConstants";

interface LoadingStateProps {
  itemsCount?: number;
  showTierInfo?: boolean;
  variant?: "list" | "detail"; // Add variant prop to handle different layouts
}

export function ProjectListLoadingState({
  itemsCount = PROJECTS_PER_PAGE,
  showTierInfo = true,
  variant = "list", // Default to list view (project grids)
}: LoadingStateProps) {
  // Render detail page skeleton (individual project page with sidebar)
  if (variant === "detail") {
    return (
      <div className="w-full min-w-2 max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 py-8">
        {/* Header skeleton */}
        <div className="flex items-row justify-between mb-4 animate-pulse">
          <div className="h-10 bg-muted rounded w-32"></div>
          <div className="flex gap-5">
            <div className="h-6 bg-muted rounded-full w-24"></div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        </div>

        {/* Profile Header Section skeleton */}
        <div className="mb-6 bg-card rounded-lg p-6 shadow-lg animate-pulse">
          <div className="flex items-col gap-6">
            <div className="h-24 w-24 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </div>

        {/* Project Details Grid - matches ProjectContent layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden skeleton-fade">
              <div className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((line) => (
                    <div
                      key={line}
                      className="h-4 bg-muted rounded animate-pulse"
                      style={{
                        width: line === 4 ? "60%" : "100%",
                        animationDelay: `${line * 100}ms`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden skeleton-fade" style={{ animationDelay: "100ms" }}>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <Card className="overflow-hidden skeleton-fade" style={{ animationDelay: "200ms" }}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-6 bg-muted rounded-full w-16 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden skeleton-fade" style={{ animationDelay: "300ms" }}>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-px bg-muted"></div>
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
