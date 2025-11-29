"use client";

import React from "react";
import { useProjects } from "@/providers/projects-provider";
import { SortBySelect, CategorySelect, SortByValue } from "@/components/filters";
import { useCategoryCounts } from "@/hooks/use-category-counts";
import { useAuth } from "@clerk/nextjs";

interface FilterControlsProps {
  showControls?: boolean;
}

export function FilterControls({ showControls = true }: FilterControlsProps) {
  const { filters, setFilters } = useProjects();
  const { userId } = useAuth();

  // Determine category counts filter based on current view
  const categoryCountsFilters = React.useMemo(() => {
    if (filters.showDeleted && userId) {
      return { userId, deleted: true };
    }
    if (filters.showFavorites && userId) {
      return { userId, favorites: true };
    }
    if (filters.showMyProjects && userId) {
      return { userId };
    }
    // Community view - global counts
    return undefined;
  }, [filters.showMyProjects, filters.showFavorites, filters.showDeleted, userId]);

  const { hasCategoryProjects } = useCategoryCounts(categoryCountsFilters);

  if (!showControls) return null;

  return (
    <div className="filters-section cursor-pointer">
      <div className="filter-dropdown-container cursor-pointer">
        <SortBySelect
          value={filters.sortBy as SortByValue}
          onValueChange={(value) => setFilters({ sortBy: value })}
          triggerClassName="filter-select-trigger cursor-pointer"
          showLabel
        />
        <CategorySelect
          value={filters.category}
          onValueChange={(value) => setFilters({ category: value })}
          triggerClassName="filter-select-trigger cursor-pointer"
          showLabel
          showPills
          hasCategoryProjects={hasCategoryProjects}
        />
      </div>
    </div>
  );
}

