"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getCategoryFields,
  getFieldById,
  type CategoryFieldDefinition,
} from "@/constants/project-category-fields";
import type { ProjectCategory } from "@/constants/project-categories";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  renderFieldByType,
  FieldWrapper,
} from "./FieldRenderers";
import { EmptyFieldsState, AddMoreFieldsPrompt } from "./EmptyFieldsState";
import { FieldSelector } from "./FieldSelector";
import { CompletenessScore } from "./CompletenessScore";

// =============================================================================
// Types
// =============================================================================

export interface CategoryFieldsEditorProps {
  category: ProjectCategory;
  categoryData: Record<string, unknown>;
  fieldOrder: string[];
  onCategoryDataChange: (data: Record<string, unknown>) => void;
  onFieldOrderChange: (order: string[]) => void;
  disabled?: boolean;
}

// =============================================================================
// Main Editor Component
// =============================================================================

export function CategoryFieldsEditor({
  category,
  categoryData,
  fieldOrder,
  onCategoryDataChange,
  onFieldOrderChange,
  disabled = false,
}: CategoryFieldsEditorProps) {
  const isMobile = useIsMobile();

  // Get visible fields based on fieldOrder
  const visibleFields = React.useMemo(() => {
    return fieldOrder
      .map((fieldId) => getFieldById(category, fieldId))
      .filter((f): f is CategoryFieldDefinition => f !== undefined);
  }, [category, fieldOrder]);

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: unknown) => {
    onCategoryDataChange({
      ...categoryData,
      [fieldId]: value,
    });
  };

  // Handle adding a field
  const handleAddField = (field: CategoryFieldDefinition) => {
    if (!fieldOrder.includes(field.id)) {
      onFieldOrderChange([...fieldOrder, field.id]);
    }
  };

  // Handle toggling field visibility
  const handleToggleField = (fieldId: string) => {
    if (fieldOrder.includes(fieldId)) {
      // Remove from order (hide)
      onFieldOrderChange(fieldOrder.filter((id) => id !== fieldId));
    } else {
      // Add to order (show) - append at end
      onFieldOrderChange([...fieldOrder, fieldId]);
    }
  };

  // Handle reordering (move up/down)
  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const currentIndex = fieldOrder.indexOf(fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fieldOrder.length) return;

    const newOrder = [...fieldOrder];
    [newOrder[currentIndex], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[currentIndex],
    ];
    onFieldOrderChange(newOrder);
  };

  // Handle reordering via numbered input (mobile)
  const handleSetFieldPosition = (fieldId: string, newPosition: number) => {
    const currentIndex = fieldOrder.indexOf(fieldId);
    if (currentIndex === -1) return;

    // Clamp position to valid range (1-based)
    const clampedPosition = Math.max(1, Math.min(fieldOrder.length, newPosition));
    const newIndex = clampedPosition - 1;

    if (newIndex === currentIndex) return;

    const newOrder = [...fieldOrder];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, fieldId);
    onFieldOrderChange(newOrder);
  };

  // No fields visible - show empty state
  if (visibleFields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Project Details</h3>
          <FieldSelector
            category={category}
            visibleFieldIds={fieldOrder}
            categoryData={categoryData}
            onToggleField={handleToggleField}
            disabled={disabled}
          />
        </div>
        <EmptyFieldsState
          category={category}
          onAddField={handleAddField}
          existingFieldIds={fieldOrder}
        />
      </div>
    );
  }

  // Show scroll hint if many fields
  const showScrollHint = visibleFields.length > 6;

  return (
    <div className="space-y-6">
      {/* Header with completeness score and field selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h3 className="text-lg font-medium">Project Details</h3>
          <CompletenessScore
            visibleFieldIds={fieldOrder}
            categoryData={categoryData}
            variant="default"
          />
        </div>
        <div className="shrink-0">
          <FieldSelector
            category={category}
            visibleFieldIds={fieldOrder}
            categoryData={categoryData}
            onToggleField={handleToggleField}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Fields list - scrollable when many fields */}
      <div 
        className={cn(
          "space-y-4",
          showScrollHint && "max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin"
        )}
      >
        {visibleFields.map((field, index) => (
          <FieldEditorCard
            key={field.id}
            field={field}
            value={categoryData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            index={index}
            totalCount={visibleFields.length}
            onMoveUp={() => handleMoveField(field.id, "up")}
            onMoveDown={() => handleMoveField(field.id, "down")}
            onSetPosition={(pos) => handleSetFieldPosition(field.id, pos)}
            onHide={() => handleToggleField(field.id)}
            disabled={disabled}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Scroll hint for many fields */}
      {showScrollHint && (
        <p className="text-xs text-muted-foreground text-center">
          Scroll to see all {visibleFields.length} fields
        </p>
      )}

      {/* Add more prompt if few fields */}
      {visibleFields.length < 4 && (
        <AddMoreFieldsPrompt
          category={category}
          onAddField={handleAddField}
          existingFieldIds={fieldOrder}
          totalFieldCount={visibleFields.length}
        />
      )}
    </div>
  );
}

// =============================================================================
// Field Editor Card Component
// =============================================================================

interface FieldEditorCardProps {
  field: CategoryFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetPosition: (position: number) => void;
  onHide: () => void;
  disabled: boolean;
  isMobile: boolean;
}

function FieldEditorCard({
  field,
  value,
  onChange,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onSetPosition,
  onHide,
  disabled,
  isMobile,
}: FieldEditorCardProps) {
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  return (
    <Card className={cn("overflow-visible", disabled && "opacity-60")}>
      <CardContent className="pt-4 overflow-visible">
        <div className="flex gap-3">
          {/* Reorder controls */}
          <div className="flex flex-col items-center gap-1 pt-6">
            {isMobile ? (
              // Mobile: Numbered input
              <MobilePositionInput
                position={index + 1}
                totalCount={totalCount}
                onSetPosition={onSetPosition}
                disabled={disabled}
              />
            ) : (
              // Desktop: Arrow buttons
              <TooltipProvider>
                <div className="flex flex-col gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveUp}
                        disabled={disabled || !canMoveUp}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Move up</TooltipContent>
                  </Tooltip>
                  <div className="text-xs text-muted-foreground text-center w-6">
                    {index + 1}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveDown}
                        disabled={disabled || !canMoveDown}
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Move down</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </div>

          {/* Field content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <FieldWrapper field={field} showDescription>
                  {renderFieldByType({
                    field,
                    value,
                    onChange,
                    disabled,
                  })}
                </FieldWrapper>
              </div>

              {/* Hide button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={onHide}
                      disabled={disabled}
                    >
                      <EyeOff className="h-4 w-4" />
                      <span className="sr-only">Hide field</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Hide field (data is preserved)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Mobile Position Input Component
// =============================================================================

interface MobilePositionInputProps {
  position: number;
  totalCount: number;
  onSetPosition: (position: number) => void;
  disabled: boolean;
}

function MobilePositionInput({
  position,
  totalCount,
  onSetPosition,
  disabled,
}: MobilePositionInputProps) {
  const [inputValue, setInputValue] = React.useState(String(position));
  const [isEditing, setIsEditing] = React.useState(false);

  // Sync input with position when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(position));
    }
  }, [position, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const newPos = parseInt(inputValue, 10);
    if (!isNaN(newPos) && newPos !== position) {
      onSetPosition(newPos);
    } else {
      setInputValue(String(position));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setInputValue(String(position));
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <Input
        type="number"
        min={1}
        max={totalCount}
        value={inputValue}
        onChange={(e) => {
          setIsEditing(true);
          setInputValue(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
        disabled={disabled}
        className="w-10 h-7 text-center text-xs p-0"
      />
      <span className="text-[10px] text-muted-foreground">of {totalCount}</span>
    </div>
  );
}
