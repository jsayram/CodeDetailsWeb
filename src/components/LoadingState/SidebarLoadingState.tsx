import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarLoadingStateProps {
  menuItemsCount?: number;
  groupsCount?: number;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function SidebarLoadingState({
  menuItemsCount = 6,
  groupsCount = 2,
  showHeader = true,
  showFooter = true,
  className = "",
}: SidebarLoadingStateProps) {
  const renderMenuSkeletons = (count: number, showIcon: boolean = true) => {
    return Array.from({ length: count }).map((_, i) => (
      <SidebarMenuSkeleton
        key={i}
        showIcon={showIcon}
        style={{ animationDelay: `${i * 50}ms` }}
      />
    ));
  };

  const renderGroupSkeletons = () => {
    return Array.from({ length: groupsCount }).map((_, groupIndex) => (
      <SidebarGroup
        key={groupIndex}
        style={{ animationDelay: `${groupIndex * 100}ms` }}
      >
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-24" />
        </SidebarGroupLabel>
        <SidebarMenu>
          {renderMenuSkeletons(Math.floor(menuItemsCount / groupsCount))}
        </SidebarMenu>
      </SidebarGroup>
    ));
  };

  const renderHeaderSkeleton = () => (
    <SidebarHeader className="animate-pulse">
      <div className="flex items-center gap-2 px-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="px-2">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </SidebarHeader>
  );

  const renderFooterSkeleton = () => (
    <SidebarFooter className="animate-pulse">
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </SidebarFooter>
  );

  return (
    <div className={`animate-in fade-in-50 ${className}`}>
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          {showHeader && renderHeaderSkeleton()}
          <SidebarContent className="skeleton-fade">
            <SidebarGroup>
              <SidebarMenu>{renderMenuSkeletons(3)}</SidebarMenu>
            </SidebarGroup>
            {renderGroupSkeletons()}
          </SidebarContent>
          {showFooter && renderFooterSkeleton()}
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
