"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchPageLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="flex justify-center w-full mb-20">
          <div className="w-full px-4 2xl:px-8 3xl:px-12">
            <div className="flex flex-col gap-6 mb-6 py-3">
              {/* Page Banner Loading */}
              <div className="relative overflow-hidden rounded-2xl border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-8 w-8 text-primary animate-pulse" />
                  <Skeleton className="h-8 w-[120px]" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories, tags, or users..."
                  className="pl-10 text-base"
                  disabled
                />
              </div>

              {/* Empty State - matches what users see before searching */}
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4 animate-pulse" />
                <Skeleton className="h-7 w-[180px] mx-auto mb-2" />
                <div className="max-w-md mx-auto space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%] mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
