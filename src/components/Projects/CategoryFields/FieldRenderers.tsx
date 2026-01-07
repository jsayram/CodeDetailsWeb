"use client";

import * as React from "react";
import { X, Plus, ExternalLink, AlertCircle, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  CategoryFieldDefinition,
  FieldType,
} from "@/constants/project-category-fields";
import { PROFANITY_LIST } from "@/constants/profanity-list";
import { cn } from "@/lib/utils";
import { RepoTechImport } from "./RepoTechImport";

// =============================================================================
// Types
// =============================================================================

export interface FieldRendererProps {
  field: CategoryFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  className?: string;
}

export interface DisplayFieldProps {
  field: CategoryFieldDefinition;
  value: unknown;
  className?: string;
}

// Helper to get label for a value from options
function getOptionLabel(
  options: { value: string; label: string }[] | undefined,
  value: string
): string {
  const option = options?.find((opt) => opt.value === value);
  return option?.label ?? value;
}

// =============================================================================
// Profanity Check Utility
// =============================================================================

/**
 * Check if text contains profanity
 * Returns the matched word if found, null otherwise
 */
function checkForProfanity(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  
  // Normalize text: lowercase and remove extra whitespace
  const normalized = text.toLowerCase().trim();
  
  // Check for exact matches and partial matches
  const matchedWord = PROFANITY_LIST.find((word) => {
    // Check if the profane word appears as a whole word
    const wordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    return wordRegex.test(normalized);
  });
  
  return matchedWord ?? null;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate array of strings for profanity
 * Returns the first matched word if found
 */
function checkArrayForProfanity(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  
  for (const value of values) {
    if (typeof value === "string") {
      const match = checkForProfanity(value);
      if (match) return match;
    }
  }
  
  return null;
}

// =============================================================================
// Text Field Renderer
// =============================================================================

function TextFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  const textValue = (value as string) ?? "";
  const profanityMatch = checkForProfanity(textValue);
  const hasProfanity = profanityMatch !== null;

  return (
    <div className="space-y-1">
      <Input
        id={field.id}
        type="text"
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        disabled={disabled}
        className={cn(
          hasProfanity && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      {hasProfanity && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Content contains inappropriate language
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Textarea Field Renderer
// =============================================================================

function TextareaFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  const textValue = (value as string) ?? "";
  const charCount = textValue.length;
  const maxLength = field.maxLength ?? 1000;
  const profanityMatch = checkForProfanity(textValue);
  const hasProfanity = profanityMatch !== null;

  return (
    <div className="space-y-1">
      <Textarea
        id={field.id}
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "min-h-24 resize-y max-h-64",
          hasProfanity && "border-destructive focus-visible:ring-destructive",
          className
        )}
        rows={4}
      />
      <div className="flex justify-between items-center">
        {hasProfanity ? (
          <p className="text-destructive text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Content contains inappropriate language
          </p>
        ) : (
          <span />
        )}
        <span className="text-muted-foreground text-xs">
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// URL Field Renderer
// =============================================================================

function UrlFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  const urlValue = (value as string) ?? "";
  const isValidUrl = urlValue === "" || isValidUrlFormat(urlValue);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={field.id}
          type="url"
          value={urlValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "https://"}
          disabled={disabled}
          className={cn(
            "pr-10",
            !isValidUrl && "border-destructive",
            className
          )}
        />
        {urlValue && isValidUrl && (
          <a
            href={urlValue}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open link in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      {!isValidUrl && (
        <p className="text-destructive text-xs">Please enter a valid URL</p>
      )}
    </div>
  );
}

function isValidUrlFormat(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// =============================================================================
// Number Field Renderer
// =============================================================================

function NumberFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  return (
    <Input
      id={field.id}
      type="number"
      value={value !== undefined && value !== null ? String(value) : ""}
      onChange={(e) => {
        const num = e.target.value === "" ? null : Number(e.target.value);
        onChange(num);
      }}
      placeholder={field.placeholder}
      disabled={disabled}
      className={cn("w-32", className)}
      min={0}
    />
  );
}

// =============================================================================
// Searchable Select Field Renderer (with custom input support)
// =============================================================================

function SelectFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  const options = field.options ?? [];
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentValue = (value as string) ?? "";
  
  // Check if current value is a custom value (not in options)
  const isCustomValue = currentValue && !options.some(opt => opt.value === currentValue);
  
  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get display label
  const displayLabel = isCustomValue 
    ? currentValue 
    : getOptionLabel(options, currentValue);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setSearchQuery("");
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setCustomValue("");
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("truncate", !currentValue && "text-muted-foreground")}>
          {currentValue ? displayLabel : (field.placeholder ?? "Select an option")}
        </span>
        <Search className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1 left-0 right-0 rounded-md border bg-popover shadow-lg overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-full"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto">
            <div className="p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer text-left",
                      "hover:bg-accent hover:text-accent-foreground",
                      currentValue === option.value && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        currentValue === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No options found
                </p>
              )}
            </div>
          </div>

          {/* Custom input section */}
          <div className="border-t p-2">
            {showCustomInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom value..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  className="h-8 flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim()}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
                Enter custom value...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Multi-Select Field Renderer (Searchable with custom input support)
// =============================================================================

function MultiSelectFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  const selectedValues = Array.isArray(value) ? (value as string[]) : [];
  const options = field.options ?? [];
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter available options (not already selected) and match search
  const availableOptions = options.filter(
    (opt) => 
      !selectedValues.includes(opt.value) &&
      (opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
       opt.value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Profanity check for selected values (in case of custom input)
  const profanityMatch = checkArrayForProfanity(selectedValues);
  const hasProfanity = profanityMatch !== null;

  const handleAdd = (newValue: string) => {
    if (newValue && !selectedValues.includes(newValue)) {
      onChange([...selectedValues, newValue]);
      setSearchQuery("");
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(selectedValues.filter((v) => v !== valueToRemove));
  };

  const handleCustomSubmit = () => {
    if (customValue.trim() && !selectedValues.includes(customValue.trim())) {
      onChange([...selectedValues, customValue.trim()]);
      setCustomValue("");
    }
  };

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Limit display to prevent overflow, use scrollable container for many items
  const showScrollArea = selectedValues.length > 10;
  
  // Check if this is the tech stack field to show Repo import
  const isTechStack = field.id === "techStack";

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      {/* Repo Import for Tech Stack */}
      {isTechStack && (
        <RepoTechImport
          currentValues={selectedValues}
          onImport={(newValues) => onChange(newValues)}
          disabled={disabled}
        />
      )}

      {/* Selected values as badges */}
      {selectedValues.length > 0 && (
        showScrollArea ? (
          <ScrollArea className="max-h-32 rounded-md border p-2">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((selected) => (
                <Badge
                  key={selected}
                  variant="secondary"
                  className="pr-1.5 text-sm shrink-0"
                >
                  {getOptionLabel(options, selected)}
                  <button
                    type="button"
                    onClick={() => handleRemove(selected)}
                    disabled={disabled}
                    className="ml-1 rounded-full hover:bg-muted p-0.5 disabled:opacity-50"
                    aria-label={`Remove ${getOptionLabel(options, selected)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((selected) => (
              <Badge
                key={selected}
                variant="secondary"
                className="pr-1.5 text-sm"
              >
                {getOptionLabel(options, selected)}
                <button
                  type="button"
                  onClick={() => handleRemove(selected)}
                  disabled={disabled}
                  className="ml-1 rounded-full hover:bg-muted p-0.5 disabled:opacity-50"
                  aria-label={`Remove ${getOptionLabel(options, selected)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )
      )}

      {/* Searchable Add dropdown */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isOpen && "ring-2 ring-ring ring-offset-2"
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span>{field.placeholder ?? "Add more..."}</span>
          </div>
          <Search className="h-4 w-4 opacity-50" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div 
            className="absolute z-50 mt-1 left-0 right-0 rounded-md border bg-popover shadow-lg overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-2 border-b">
              <Input
                placeholder="Search options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="max-h-40 overflow-y-auto">
              <div className="p-1">
                {availableOptions.length > 0 ? (
                  availableOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAdd(option.value)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-left"
                    >
                      <Plus className="h-3 w-3 opacity-50 shrink-0" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))
                ) : searchQuery ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No matching options
                  </p>
                ) : (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    All options selected
                  </p>
                )}
              </div>
            </div>

            {/* Custom input section */}
            <div className="border-t p-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Or enter custom value..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  className="h-8 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim() || selectedValues.includes(customValue.trim())}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show count and profanity warning */}
      <div className="flex justify-between items-center">
        {hasProfanity ? (
          <p className="text-destructive text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Selection contains inappropriate content
          </p>
        ) : (
          <span />
        )}
        <p className="text-muted-foreground text-xs">
          {selectedValues.length} selected
          {field.maxLength && ` (max ${field.maxLength})`}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Date Field Renderer (Future Extension)
// =============================================================================

function DateFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  return (
    <Input
      id={field.id}
      type="date"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    />
  );
}

// =============================================================================
// File Field Renderer (Future Extension - Placeholder)
// =============================================================================

function FileFieldRenderer({
  field,
  disabled,
  className,
}: FieldRendererProps) {
  return (
    <div
      className={cn(
        "border border-dashed rounded-md p-6 text-center text-muted-foreground",
        disabled && "opacity-50",
        className
      )}
    >
      <p className="text-sm">File upload coming soon</p>
      <p className="text-xs mt-1">{field.placeholder}</p>
    </div>
  );
}

// =============================================================================
// Rich Text Field Renderer (Future Extension - Placeholder)
// =============================================================================

function RichTextFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  className,
}: FieldRendererProps) {
  // For now, fall back to textarea - can be enhanced with MDX/rich text editor later
  return (
    <TextareaFieldRenderer
      field={field}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}

// =============================================================================
// Main Field Renderer Switch
// =============================================================================

export function renderFieldByType(props: FieldRendererProps): React.ReactNode {
  const { field } = props;
  const fieldType: FieldType = field.type;

  switch (fieldType) {
    case "text":
      return <TextFieldRenderer {...props} />;
    case "textarea":
      return <TextareaFieldRenderer {...props} />;
    case "url":
      return <UrlFieldRenderer {...props} />;
    case "number":
      return <NumberFieldRenderer {...props} />;
    case "select":
      return <SelectFieldRenderer {...props} />;
    case "multi-select":
      return <MultiSelectFieldRenderer {...props} />;
    case "date":
      return <DateFieldRenderer {...props} />;
    case "file":
      return <FileFieldRenderer {...props} />;
    case "rich-text":
      return <RichTextFieldRenderer {...props} />;
    default:
      // Fallback to text for unknown types
      console.warn(`Unknown field type: ${fieldType}, falling back to text`);
      return <TextFieldRenderer {...props} />;
  }
}

// =============================================================================
// Display-Only Field Renderers (for view mode)
// =============================================================================

export function DisplayFieldValue({
  field,
  value,
  className,
}: DisplayFieldProps): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic">Not provided</span>;
  }

  const fieldType: FieldType = field.type;

  switch (fieldType) {
    case "multi-select": {
      const values = value as string[];
      if (values.length === 0) {
        return (
          <span className="text-muted-foreground italic">None selected</span>
        );
      }
      return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="text-xs">
              {getOptionLabel(field.options, v)}
            </Badge>
          ))}
        </div>
      );
    }

    case "url": {
      const urlValue = value as string;
      return (
        <a
          href={urlValue}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "text-primary hover:underline inline-flex items-center gap-1",
            className
          )}
        >
          {formatUrlForDisplay(urlValue)}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    case "textarea":
    case "rich-text": {
      const textValue = value as string;
      return (
        <p className={cn("whitespace-pre-wrap", className)}>{textValue}</p>
      );
    }

    case "number":
      return (
        <span className={className}>{(value as number).toLocaleString()}</span>
      );

    case "date": {
      const dateValue = value as string;
      try {
        return (
          <span className={className}>
            {new Date(dateValue).toLocaleDateString()}
          </span>
        );
      } catch {
        return <span className={className}>{dateValue}</span>;
      }
    }

    case "select": {
      const selectValue = value as string;
      return (
        <span className={className}>
          {getOptionLabel(field.options, selectValue)}
        </span>
      );
    }

    case "text":
    default:
      return <span className={className}>{String(value)}</span>;
  }
}

function formatUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove protocol and trailing slash for cleaner display
    let display = parsed.hostname + parsed.pathname;
    if (display.endsWith("/")) {
      display = display.slice(0, -1);
    }
    // Truncate if too long
    if (display.length > 40) {
      display = display.slice(0, 37) + "...";
    }
    return display;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "..." : url;
  }
}

// =============================================================================
// Field Wrapper Component with Label
// =============================================================================

export interface FieldWrapperProps {
  field: CategoryFieldDefinition;
  children: React.ReactNode;
  error?: string;
  showDescription?: boolean;
}

export function FieldWrapper({
  field,
  children,
  error,
  showDescription = true,
}: FieldWrapperProps) {
  return (
    <div className="space-y-2 min-w-0">
      <label
        htmlFor={field.id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words"
      >
        {field.label}
        {field.isCommon && (
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            Common
          </Badge>
        )}
      </label>

      {showDescription && field.description && (
        <p className="text-muted-foreground text-xs break-words">{field.description}</p>
      )}

      {children}

      {error && <p className="text-destructive text-xs break-words">{error}</p>}
    </div>
  );
}

// =============================================================================
// Validation Utilities
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: { fieldId: string; message: string }[];
}

/**
 * Validate all category data for profanity
 * Returns validation result with list of fields that have issues
 */
export function validateCategoryData(
  categoryData: Record<string, unknown>,
  fieldOrder: string[]
): ValidationResult {
  const errors: { fieldId: string; message: string }[] = [];

  fieldOrder.forEach((fieldId) => {
    const value = categoryData[fieldId];
    
    if (value === null || value === undefined) return;
    
    // Check string values
    if (typeof value === "string") {
      const match = checkForProfanity(value);
      if (match) {
        errors.push({
          fieldId,
          message: `Contains inappropriate language`,
        });
      }
    }
    
    // Check array values
    if (Array.isArray(value)) {
      const match = checkArrayForProfanity(value);
      if (match) {
        errors.push({
          fieldId,
          message: `Contains inappropriate content`,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a single field value contains profanity
 */
export function validateFieldValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  
  if (typeof value === "string") {
    return checkForProfanity(value) === null;
  }
  
  if (Array.isArray(value)) {
    return checkArrayForProfanity(value) === null;
  }
  
  return true;
}

// =============================================================================
// Exports
// =============================================================================

export {
  TextFieldRenderer,
  TextareaFieldRenderer,
  UrlFieldRenderer,
  NumberFieldRenderer,
  SelectFieldRenderer,
  MultiSelectFieldRenderer,
  DateFieldRenderer,
  FileFieldRenderer,
  RichTextFieldRenderer,
  checkForProfanity,
  checkArrayForProfanity,
};
