"use client";

import * as React from "react";
import { Plus, Check, AlertTriangle, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCategoryFields,
  COMMON_FIELDS,
  MAX_RECOMMENDED_FIELDS,
  type CategoryFieldDefinition,
} from "@/constants/project-category-fields";
import type { ProjectCategory } from "@/constants/project-categories";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface FieldSelectorProps {
  category: ProjectCategory;
  visibleFieldIds: string[];
  categoryData: Record<string, unknown>;
  onToggleField: (fieldId: string) => void;
  disabled?: boolean;
}

// =============================================================================
// Field Selector Component
// =============================================================================

export function FieldSelector({
  category,
  visibleFieldIds,
  categoryData,
  onToggleField,
  disabled = false,
}: FieldSelectorProps) {
  const allFields = getCategoryFields(category);
  const commonFields = allFields.filter((f) => f.isCommon);
  const categorySpecificFields = allFields.filter((f) => !f.isCommon);

  const visibleCount = visibleFieldIds.length;
  const showWarning = visibleCount > MAX_RECOMMENDED_FIELDS;

  // Check if a field has data (even if hidden)
  const hasData = (fieldId: string): boolean => {
    const value = categoryData[fieldId];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  // Check if field is currently visible
  const isVisible = (fieldId: string): boolean => {
    return visibleFieldIds.includes(fieldId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Warning if too many fields */}
        {showWarning && (
          <>
            <div className="px-2 py-1.5 flex items-center gap-2 text-amber-600 dark:text-amber-500 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>{visibleCount} fields shown (recommended: ≤{MAX_RECOMMENDED_FIELDS})</span>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Common Fields Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            Common Fields
            <Badge variant="outline" className="text-[10px] font-normal">
              Migrate with category
            </Badge>
          </DropdownMenuLabel>
          {commonFields.map((field) => (
            <FieldMenuItem
              key={field.id}
              field={field}
              isVisible={isVisible(field.id)}
              hasData={hasData(field.id)}
              onToggle={() => onToggleField(field.id)}
            />
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Category-Specific Fields Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Category-Specific</DropdownMenuLabel>
          {categorySpecificFields.length > 0 ? (
            categorySpecificFields.map((field) => (
              <FieldMenuItem
                key={field.id}
                field={field}
                isVisible={isVisible(field.id)}
                hasData={hasData(field.id)}
                onToggle={() => onToggleField(field.id)}
              />
            ))
          ) : (
            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
              No category-specific fields available
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Field Menu Item Component
// =============================================================================

interface FieldMenuItemProps {
  field: CategoryFieldDefinition;
  isVisible: boolean;
  hasData: boolean;
  onToggle: () => void;
}

function FieldMenuItem({ field, isVisible, hasData, onToggle }: FieldMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full">
        {/* Visibility indicator */}
        {isVisible ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Field label */}
        <span className={cn("flex-1", !isVisible && "text-muted-foreground")}>
          {field.label}
        </span>

        {/* Has data indicator */}
        {hasData && !isVisible && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4"
          >
            has data
          </Badge>
        )}

        {/* Checkmark for visible */}
        {isVisible && <Check className="h-4 w-4 text-primary" />}
      </div>
    </DropdownMenuItem>
  );
}

// =============================================================================
// Compact Field Toggle for Mobile
// =============================================================================

export interface FieldToggleChipsProps {
  category: ProjectCategory;
  visibleFieldIds: string[];
  categoryData: Record<string, unknown>;
  onToggleField: (fieldId: string) => void;
  disabled?: boolean;
}

export function FieldToggleChips({
  category,
  visibleFieldIds,
  categoryData,
  onToggleField,
  disabled = false,
}: FieldToggleChipsProps) {
  const allFields = getCategoryFields(category);

  // Check if a field has data
  const hasData = (fieldId: string): boolean => {
    const value = categoryData[fieldId];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  // Check if field is currently visible
  const isVisible = (fieldId: string): boolean => {
    return visibleFieldIds.includes(fieldId);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allFields.map((field) => {
        const visible = isVisible(field.id);
        const hasFieldData = hasData(field.id);

        return (
          <button
            key={field.id}
            type="button"
            onClick={() => onToggleField(field.id)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              "border disabled:opacity-50 disabled:cursor-not-allowed",
              visible
                ? "bg-primary text-primary-foreground border-primary"
                : hasFieldData
                  ? "bg-muted text-muted-foreground border-muted-foreground/30 hover:bg-muted/80"
                  : "bg-background text-muted-foreground border-input hover:bg-muted"
            )}
          >
            {visible ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {field.label}
            {hasFieldData && !visible && (
              <span className="text-[10px] opacity-70">•</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
