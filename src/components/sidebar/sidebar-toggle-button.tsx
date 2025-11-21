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
        "fixed top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full shadow-lg",
        "transition-all duration-300 ease-in-out cursor-pointer",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "hover:bg-accent hover:text-accent-foreground hover:scale-110",
        "border border-border",
        // Desktop positioning based on sidebar state - positioned to overlap sidebar edge
        open ? "left-[calc(16rem-1.25rem)]" : "left-2"
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
