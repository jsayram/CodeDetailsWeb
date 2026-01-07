"use client";

import React from "react";
import { PanelLeft } from "lucide-react";
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
        "fixed top-1/2 -translate-y-1/2 z-50 h-16 w-8 shadow-lg",
        "transition-all duration-300 ease-in-out cursor-pointer",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "hover:bg-accent hover:text-accent-foreground",
        "border border-border",
        "rounded-r-xl rounded-l-none", // Tab shape - rounded on right, flat on left
        "border-l-0", // No border on left edge
        // Desktop positioning based on sidebar state - positioned to overlap sidebar edge
        open ? "left-[16rem]" : "left-0"
      )}
      aria-label="Toggle Sidebar"
    >
      <PanelLeft className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
