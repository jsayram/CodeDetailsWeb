"use client";

/**
 * Table of Contents Component
 * Sticky sidebar for desktop, FAB overlay for mobile
 * Uses IntersectionObserver for scroll-spy functionality
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  List,
  X,
  Image as ImageIcon,
  FileText,
  Link2,
  Settings2,
  Tags,
  Info,
  Clock,
  BookOpen,
} from "lucide-react";

export interface TOCSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TableOfContentsProps {
  sections: TOCSection[];
  className?: string;
}

// Default sections for project view
export const DEFAULT_PROJECT_SECTIONS: TOCSection[] = [
  { id: "architecture-docs", label: "Docs", icon: <BookOpen className="h-4 w-4" /> },
  { id: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "about", label: "About", icon: <FileText className="h-4 w-4" /> },
  { id: "links", label: "Links", icon: <Link2 className="h-4 w-4" /> },
  { id: "category-fields", label: "Details", icon: <Settings2 className="h-4 w-4" /> },
  { id: "tags", label: "Tags", icon: <Tags className="h-4 w-4" /> },
  { id: "project-info", label: "Info", icon: <Info className="h-4 w-4" /> },
  { id: "timeline", label: "Timeline", icon: <Clock className="h-4 w-4" /> },
];

export function TableOfContents({
  sections = DEFAULT_PROJECT_SECTIONS,
  className,
}: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter sections to only include those that exist in the DOM
  const existingSections = sections.filter((section) => {
    if (typeof document === "undefined") return true;
    return document.getElementById(section.id) !== null;
  });

  // Set up IntersectionObserver for scroll-spy
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        
        setVisibleSections((prev) => {
          if (entry.isIntersecting) {
            return prev.includes(id) ? prev : [...prev, id];
          } else {
            return prev.filter((s) => s !== id);
          }
        });
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: "-10% 0px -70% 0px", // Top 20% of viewport triggers
      threshold: 0,
    });

    // Observe all section elements
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sections]);

  // Determine active section based on visible sections
  useEffect(() => {
    if (visibleSections.length === 0) {
      setActiveSection("");
      return;
    }

    // Find the first visible section in order
    const firstVisible = sections.find((s) => visibleSections.includes(s.id));
    if (firstVisible) {
      setActiveSection(firstVisible.id);
    }
  }, [visibleSections, sections]);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 100; // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
      setIsOpen(false); // Close mobile menu after navigation
    }
  }, []);

  // Don't render if no sections exist
  if (existingSections.length === 0) {
    return null;
  }

  // Desktop TOC - Sticky sidebar
  const DesktopTOC = (
    <nav
      className={cn(
        "hidden lg:block sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-auto",
        "rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        On This Page
      </h3>
      <ul className="space-y-1">
        {existingSections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors text-left",
                "hover:bg-accent hover:text-accent-foreground",
                activeSection === section.id
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[2px]"
                  : "text-muted-foreground"
              )}
            >
              {section.icon}
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  // Mobile TOC - FAB with overlay
  const MobileTOC = (
    <div className="lg:hidden">
      {/* FAB Button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "transition-transform hover:scale-110",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle table of contents"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <List className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <nav
            className={cn(
              "fixed bottom-24 right-6 z-50 w-64 max-h-[60vh] overflow-auto",
              "rounded-lg border bg-card p-4 shadow-xl",
              "animate-in slide-in-from-bottom-4 fade-in-0 duration-200"
            )}
          >
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Jump to Section
            </h3>
            <ul className="space-y-1">
              {existingSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-md transition-colors text-left",
                      "hover:bg-accent hover:text-accent-foreground active:scale-95",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );

  return (
    <>
      {DesktopTOC}
      {MobileTOC}
    </>
  );
}
