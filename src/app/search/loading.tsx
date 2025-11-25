"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Hash, Folder, Users } from "lucide-react";

export function SearchContentSkeleton() {
  return (
    <div className="flex flex-col gap-6 mb-6 py-3">
      {/* Centered Hero Section Loading */}
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-96 mx-auto rounded-lg bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse" />
          <Skeleton className="h-6 w-[500px] mx-auto" />
        </div>

        {/* Mascot with Speech Bubble Loading */}
        <div className="flex items-start justify-center gap-4 mb-4">
          <Skeleton className="w-32 h-32 rounded-2xl" />
          <div className="max-w-md bg-card border-2 border-muted rounded-2xl p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Centered Search Input Loading */}
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Skeleton className="w-full h-14 rounded-xl" />
        </div>
      </div>

      {/* In-page search loading - simpler */}
      <div className="space-y-6">
        {/* Searching indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Searching...</span>
        </div>
        
        {/* Results skeletons */}
        <div className="space-y-6">
          {/* Users skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full"></div>
              ))}
            </div>
          </div>

          {/* Categories skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="h-5 bg-muted animate-pulse rounded w-2/3"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPageLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="flex justify-center w-full mb-20">
          <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
            <SearchContentSkeleton />
          </div>
        </div>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
