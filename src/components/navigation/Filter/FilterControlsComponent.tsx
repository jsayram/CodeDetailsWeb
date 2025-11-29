"use client";

import React from "react";
import { useProjects } from "@/providers/projects-provider";
import { SortBySelect, CategorySelect, SortByValue } from "@/components/filters";

interface FilterControlsProps {
  showControls?: boolean;
}

export function FilterControls({ showControls = true }: FilterControlsProps) {
  const { filters, setFilters } = useProjects();

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
        />
      </div>
    </div>
  );
}

