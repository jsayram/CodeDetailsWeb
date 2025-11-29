"use client";

import React from "react";
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

interface CategorySelectProps {
  value: ProjectCategory | "all";
  onValueChange: (value: ProjectCategory | "all") => void;
  triggerClassName?: string;
  showLabel?: boolean;
  showPills?: boolean;
  hasCategoryProjects?: (category: string) => boolean;
}

export function CategorySelect({
  value,
  onValueChange,
  triggerClassName = "w-[180px]",
  showLabel = false,
  showPills = false,
  hasCategoryProjects,
}: CategorySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as ProjectCategory | "all")}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {showLabel && <SelectLabel>Category</SelectLabel>}
          <SelectItem value="all" className="cursor-pointer">
            <span className="text-muted-foreground">All Categories</span>
          </SelectItem>
          {Object.entries(PROJECT_CATEGORIES).map(([key, { label }]) => {
            const disabled = hasCategoryProjects ? !hasCategoryProjects(key) : false;
            return (
              <SelectItem
                key={key}
                value={key}
                disabled={disabled}
                className={`cursor-pointer ${disabled ? "text-muted-foreground" : ""}`}
              >
                {showPills ? (
                  <div className={`filter-category-pill category-${key}`}>{label}</div>
                ) : (
                  label
                )}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
