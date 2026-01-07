"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  const visitedPagesRef = useRef<Set<number>>(new Set([1]));
  const previousPageRef = useRef<number>(1);
  const [activePageState, setActivePageState] = useState(currentPage);
  const paginationRef = useRef<HTMLDivElement>(null);

  // Keep active page state in sync with currentPage prop
  useEffect(() => {
    setActivePageState(currentPage);
  }, [currentPage]);

  useEffect(() => {
    // Track visited pages
    if (currentPage <= totalPages) {
      previousPageRef.current = currentPage;
      visitedPagesRef.current.add(currentPage);
    }
  }, [currentPage, totalPages]);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsVerySmallScreen(window.innerWidth < 640);
    };

    checkScreenSize();
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCheckScreenSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkScreenSize, 100);
    };

    window.addEventListener("resize", debouncedCheckScreenSize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedCheckScreenSize);
    };
  }, []);

  const scrollToCurrentPagination = useCallback(() => {
    if (paginationRef.current) {
      const rect = paginationRef.current.getBoundingClientRect();
      const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isInViewport) {
        paginationRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      // If trying to go to a page beyond total, stay on last valid page
      if (newPage > totalPages) {
        onPageChange(previousPageRef.current);
        return;
      }

      // Don't allow invalid pages or same page navigation
      if (newPage < 1 || newPage === activePageState) {
        return;
      }

      // Store current scroll position
      const currentPosition = window.scrollY;

      // Update active state immediately for smooth transition
      setActivePageState(newPage);
      visitedPagesRef.current.add(newPage);
      onPageChange(newPage);

      // Restore scroll position after a short delay to allow for content update
      requestAnimationFrame(() => {
        window.scrollTo({
          top: currentPosition,
          behavior: "instant",
        });
      });
    },
    [activePageState, totalPages, onPageChange]
  );

  // Generate visible page numbers with ellipsis
  const getVisiblePages = useCallback(() => {
    const delta = 2;
    const range: number[] = [];
    let rangeWithDots: (number | string)[] = [];

    // Always include first and last page
    range.push(1);

    // Calculate the range around current page
    for (
      let i = Math.max(2, activePageState - delta);
      i <= Math.min(totalPages - 1, activePageState + delta);
      i++
    ) {
      range.push(i);
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add dots where needed
    let prev: number | null = null;
    for (const i of range) {
      if (prev !== null) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
          visitedPagesRef.current.add(prev + 1); // Add intermediate pages to visited
        } else if (i - prev > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      visitedPagesRef.current.add(i); // Mark all visible pages as visited
      prev = i;
    }

    return rangeWithDots;
  }, [activePageState, totalPages]);

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-4" ref={paginationRef}>
      <Pagination className="mb-5 pagination-container text-base md:text-lg">
        <PaginationContent className="gap-1 md:gap-2">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, activePageState - 1))}
              className={`${
                activePageState === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-accent/80"
              } px-3 md:px-4 py-2 transition-all duration-200`}
              aria-disabled={activePageState === 1}
            />
          </PaginationItem>

          {isVerySmallScreen ? (
            <span className="px-2 py-1 text-sm">
              Page {activePageState} of {totalPages}
            </span>
          ) : (
            visiblePages.map((page, index) => {
              if (page === "...") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="px-4">...</span>
                  </PaginationItem>
                );
              }

              const pageNum = page as number;
              const isVisited = visitedPagesRef.current.has(pageNum);
              const isActive = activePageState === pageNum;

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={isActive}
                    onClick={() => handlePageChange(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                    className={`pagination-item-text bg-transparent flex items-center justify-center h-10 w-10 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "ring-2 ring-primary bg-primary text-primary-foreground"
                        : isVisited
                        ? "text-foreground hover:bg-primary/80 hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-primary-foreground hover:bg-primary/60"
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                handlePageChange(Math.min(totalPages, activePageState + 1))
              }
              className={`${
                activePageState === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-accent/80"
              } px-3 md:px-4 py-2 transition-all duration-200`}
              aria-disabled={activePageState === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
