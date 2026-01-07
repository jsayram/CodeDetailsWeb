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
import { SORT_BY_OPTIONS, SortByValue } from "@/constants/sort-options";

interface SortBySelectProps {
  value: SortByValue;
  onValueChange: (value: SortByValue) => void;
  triggerClassName?: string;
  showLabel?: boolean;
}

export function SortBySelect({
  value,
  onValueChange,
  triggerClassName = "w-[180px]",
  showLabel = false,
}: SortBySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as SortByValue)}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {showLabel && <SelectLabel>Sort by</SelectLabel>}
          {SORT_BY_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="cursor-pointer">
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
