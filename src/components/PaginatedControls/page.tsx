import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useProjects } from "@/providers/projects-provider";
import { PROJECTS_PER_PAGE } from "@/constants/pagination";
import { useEffect, useState } from "react";

interface PaginatedControlsProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  projectType: "free" | "authenticated";
}

export function PaginatedControls({
  currentPage,
  setCurrentPage,
  projectType,
}: PaginatedControlsProps) {
  const { projects, freeProjects } = useProjects();
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  // Check screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // typical mobile breakpoint
      setIsVerySmallScreen(window.innerWidth < 640); // very small screens
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const displayProjects = projectType === "free" ? freeProjects : projects;
  const totalPages = Math.ceil(displayProjects.length / PROJECTS_PER_PAGE);

  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    // Show at least 3 pages on mobile and 5 on desktop
    const pagesAroundCurrent = isMobile ? 2 : 3;

    // For small numbers of pages, show all of them
    if (totalPages <= 5) {
      const allPages = [];
      for (let i = 1; i <= totalPages; i++) {
        allPages.push(i);
      }
      return allPages;
    }

    // For larger numbers of pages, be strategic about which ones to show
    // Always include at least the current page
    let startPage = Math.max(2, currentPage - pagesAroundCurrent);
    let endPage = Math.min(totalPages - 1, currentPage + pagesAroundCurrent);

    // Ensure we always show at least 3 pages on mobile
    if (isMobile) {
      // If at the beginning, show pages 1-3
      if (currentPage <= 2) {
        startPage = 2;
        endPage = Math.min(3, totalPages - 1);
      }
      // If at the end, show the last 3 pages
      else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 2);
        endPage = totalPages - 1;
      }
    }

    // Initialize with first page (always shown)
    const pages: (number | string)[] = [1];

    // Add ellipsis if there's a gap after page 1
    if (startPage > 2) {
      pages.push("ellipsis1");
    }

    // Add all pages in the calculated range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if there's a gap before the last page
    if (endPage < totalPages - 1) {
      pages.push("ellipsis2");
    }

    // Add last page (if more than one page exists)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <Pagination className="mt-4 mb-4 pagination-container text-base md:text-lg">
      <PaginationContent className="gap-1 md:gap-2">
        <PaginationItem>
          {isVerySmallScreen ? (
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } px-2 py-1 text-sm font-medium rounded border border-gray-300`}
              disabled={currentPage === 1}
            >
              Prev
            </button>
          ) : (
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } px-3 md:px-4 py-2`}
              aria-disabled={currentPage === 1}
            />
          )}
        </PaginationItem>

        {isVerySmallScreen ? (
          <span className="px-2 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
        ) : (
          visiblePages.map((page, index) => {
            if (page === "ellipsis1" || page === "ellipsis2") {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis className="pagination-ellipsis text-xl" />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={`page-${page}`}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() =>
                    typeof page === "number" ? setCurrentPage(page) : null
                  }
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`pagination-item-text flex items-center justify-center ${
                    isMobile ? "h-10 w-10" : "h-10 w-10"
                  }`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })
        )}

        <PaginationItem>
          {isVerySmallScreen ? (
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } px-2 py-1 text-sm font-medium rounded border border-gray-300`}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          ) : (
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } px-3 md:px-4 py-2`}
              aria-disabled={currentPage === totalPages}
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
