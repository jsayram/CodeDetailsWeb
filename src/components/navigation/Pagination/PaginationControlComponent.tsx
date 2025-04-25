"use client";
import React, { useEffect, useState } from "react";
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

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4">
      <Pagination className="mb-5 pagination-container text-base md:text-lg">
        <PaginationContent className="gap-1 md:gap-2">
          <PaginationItem>
            {isVerySmallScreen ? (
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={`${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } px-2 py-1 text-md font-medium rounded border border-gray-300`}
                disabled={currentPage === 1}
              >
                Prev
              </button>
            ) : (
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className="pagination-item-text flex items-center justify-center h-10 w-10"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))
          )}

          <PaginationItem>
            {isVerySmallScreen ? (
              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={`${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } px-2 py-1 text-md font-medium rounded border border-gray-300`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            ) : (
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
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
    </div>
  );
}
