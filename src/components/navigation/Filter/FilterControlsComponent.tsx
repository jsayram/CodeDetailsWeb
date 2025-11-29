"use client";

import React from "react";
import { useProjects } from "@/providers/projects-provider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";

interface FilterControlsProps {
  showControls?: boolean;
}

export function FilterControls({ showControls = true }: FilterControlsProps) {
  const { filters, setFilters } = useProjects();

  if (!showControls) return null;

  return (
    <div className="filters-section cursor-pointer">
      <div className="filter-dropdown-container cursor-pointer">
        <Select
          value={filters.sortBy}
          onValueChange={(value) => setFilters({ sortBy: value })}
        >
          <SelectTrigger className="filter-select-trigger cursor-pointer">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by</SelectLabel>
              <SelectItem value="newest" className="cursor-pointer">Newest</SelectItem>
              <SelectItem value="oldest" className="cursor-pointer">Oldest</SelectItem>
              <SelectItem value="recently-edited" className="cursor-pointer">Recently Edited</SelectItem>
              <SelectItem value="popular" className="cursor-pointer">Popular</SelectItem>
              <SelectItem value="alphabetical" className="cursor-pointer">A-Z</SelectItem>
              <SelectItem value="alphabetical-desc" className="cursor-pointer">Z-A</SelectItem>
              <SelectItem value="most-tagged" className="cursor-pointer">Most Tagged</SelectItem>
              <SelectItem value="least-favorited" className="cursor-pointer">Least Popular</SelectItem>
              <SelectItem value="trending" className="cursor-pointer">Trending</SelectItem>
              <SelectItem value="random" className="cursor-pointer">Random</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.category}
          onValueChange={(value) => setFilters({ category: value as ProjectCategory | "all" })}
        >
          <SelectTrigger className="filter-select-trigger cursor-pointer">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Category</SelectLabel>
              <SelectItem value="all" className="cursor-pointer">
                <span className="text-muted-foreground">All Categories</span>
              </SelectItem>
              {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
                <SelectItem key={value} value={value} className="cursor-pointer">
                  <div className={`filter-category-pill category-${value}`}>
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
