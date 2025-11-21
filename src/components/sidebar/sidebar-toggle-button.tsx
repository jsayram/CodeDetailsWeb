"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarToggleButton() {
  const { open, toggleSidebar, isMobile } = useSidebar();

  // Only show on desktop - mobile uses Sheet with its own close functionality
  if (isMobile) {
    return null;
  }

  return (
    <Button
      onClick={toggleSidebar}
      variant="outline"
      size="icon"
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-50 h-14 w-7 rounded-l-none rounded-r-lg shadow-lg",
        "transition-all duration-300 ease-in-out",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-l-0 hover:bg-accent hover:text-accent-foreground",
        "hover:w-8", // Subtle hover expansion
        // Desktop positioning based on sidebar state
        open ? "left-[16rem]" : "left-0"
      )}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
    >
      {open ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </Button>
  );
}
