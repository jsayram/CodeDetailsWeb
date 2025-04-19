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
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        value={filters.sortBy}
        onValueChange={(value) => setFilters({ sortBy: value })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sort by</SelectLabel>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(value) => setFilters({ category: value as ProjectCategory | "all" })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
