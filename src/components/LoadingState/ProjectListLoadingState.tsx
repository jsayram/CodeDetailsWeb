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
  return (
    <div className="space-y-4 animate-in fade-in-50">
      {/* Tier info skeleton */}
      {showTierInfo && (
        <Alert className="mb-6 h-[60px] skeleton-fade alert-container">
          <AlertDescription className="text-sm flex items-center justify-between alert-content">
            <div className="h-4 bg-muted rounded w-[180px] animate-pulse"></div>
            <div className="flex gap-1 tier-badges">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-5 bg-muted rounded-full w-16 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Projects grid skeleton */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Pagination skeleton */}
        <div
          className="pagination-container flex justify-center mt-4 skeleton-fade"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-10 bg-muted rounded-md animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
