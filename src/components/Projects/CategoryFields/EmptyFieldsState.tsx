"use client";

import * as React from "react";
import { Plus, Code2, Lightbulb, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMMON_FIELDS,
  getCategoryFields,
  type CategoryFieldDefinition,
} from "@/constants/project-category-fields";
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from "@/constants/project-categories";

// =============================================================================
// Types
// =============================================================================

export interface EmptyFieldsStateProps {
  category: ProjectCategory;
  onAddField: (field: CategoryFieldDefinition) => void;
  existingFieldIds?: string[];
}

// =============================================================================
// Quick Add Field Definitions
// =============================================================================

// Common quick-add fields with icons
const QUICK_ADD_FIELDS: {
  fieldId: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    fieldId: "techStack",
    icon: Code2,
    description: "Technologies used in this project",
  },
  {
    fieldId: "features",
    icon: Lightbulb,
    description: "Key features and functionality",
  },
  {
    fieldId: "challenges",
    icon: AlertTriangle,
    description: "Challenges faced and how you solved them",
  },
  {
    fieldId: "targetAudience",
    icon: Target,
    description: "Who this project is built for",
  },
];

// =============================================================================
// Empty Fields State Component
// =============================================================================

export function EmptyFieldsState({
  category,
  onAddField,
  existingFieldIds = [],
}: EmptyFieldsStateProps) {
  // Get all fields for this category
  const allCategoryFields = getCategoryFields(category);

  // Get available quick-add fields (common fields not already added)
  const availableQuickAddFields = QUICK_ADD_FIELDS.filter((qa) => {
    const field = COMMON_FIELDS.find((f) => f.id === qa.fieldId);
    return field && !existingFieldIds.includes(qa.fieldId);
  });

  // Get category-specific fields that aren't added yet
  const categorySpecificFields = allCategoryFields.filter(
    (f) => !f.isCommon && !existingFieldIds.includes(f.id)
  );

  const handleQuickAdd = (fieldId: string) => {
    const field = COMMON_FIELDS.find((f) => f.id === fieldId);
    if (field) {
      onAddField(field);
    }
  };

  const handleAddCategoryField = (field: CategoryFieldDefinition) => {
    onAddField(field);
  };

  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      {/* Encouraging header */}
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">
          Add fields to showcase your project details
        </h3>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          The more details you add, the better recruiters and other developers
          can understand your project. Start with the quick-add buttons below!
        </p>
      </div>

      {/* Quick-add common fields */}
      {availableQuickAddFields.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Quick Add Common Fields</p>
          <div className="flex flex-wrap justify-center gap-2">
            {availableQuickAddFields.map((qa) => {
              const Icon = qa.icon;
              const field = COMMON_FIELDS.find((f) => f.id === qa.fieldId);
              if (!field) return null;

              return (
                <Button
                  key={qa.fieldId}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(qa.fieldId)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {field.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category-specific fields suggestions */}
      {categorySpecificFields.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">
            Suggested for {getCategoryLabel(category)} Projects
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categorySpecificFields.slice(0, 4).map((field) => (
              <Button
                key={field.id}
                variant="ghost"
                size="sm"
                onClick={() => handleAddCategoryField(field)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                {field.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* All fields added message */}
      {availableQuickAddFields.length === 0 &&
        categorySpecificFields.length === 0 && (
          <p className="text-muted-foreground text-sm">
            You&apos;ve added all available fields for this category. Great job!
          </p>
        )}
    </div>
  );
}

// =============================================================================
// Helper function to get readable category label
// =============================================================================

function getCategoryLabel(category: ProjectCategory): string {
  const categoryConfig = PROJECT_CATEGORIES[category];
  return categoryConfig?.label ?? category;
}

// =============================================================================
// Compact version for when some fields exist
// =============================================================================

export interface AddMoreFieldsPromptProps {
  category: ProjectCategory;
  onAddField: (field: CategoryFieldDefinition) => void;
  existingFieldIds: string[];
  totalFieldCount: number;
}

export function AddMoreFieldsPrompt({
  category,
  onAddField,
  existingFieldIds,
  totalFieldCount,
}: AddMoreFieldsPromptProps) {
  // Get all fields for this category
  const allCategoryFields = getCategoryFields(category);

  // Get fields not yet added
  const availableFields = allCategoryFields.filter(
    (f) => !existingFieldIds.includes(f.id)
  );

  if (availableFields.length === 0) {
    return null;
  }

  // Show a subtle prompt for more fields
  const suggestedField = availableFields[0];

  return (
    <div className="rounded-md bg-muted/50 p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">
        {totalFieldCount < 3
          ? "Add more details to make your project stand out!"
          : "Looking good! Consider adding more fields."}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddField(suggestedField)}
        className="gap-2"
      >
        <Plus className="h-3 w-3" />
        Add {suggestedField.label}
      </Button>
    </div>
  );
}
