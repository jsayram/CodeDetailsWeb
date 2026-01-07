"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCategoryFields,
  getFieldById,
  type CategoryFieldDefinition,
} from "@/constants/project-category-fields";
import type { ProjectCategory } from "@/constants/project-categories";
import { cn } from "@/lib/utils";
import { DisplayFieldValue } from "./FieldRenderers";

// =============================================================================
// Types
// =============================================================================

export interface CategoryFieldsDisplayProps {
  category: ProjectCategory;
  categoryData: Record<string, unknown>;
  fieldOrder: string[];
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

// =============================================================================
// Main Display Component
// =============================================================================

export function CategoryFieldsDisplay({
  category,
  categoryData,
  fieldOrder,
  className,
  variant = "default",
}: CategoryFieldsDisplayProps) {
  // Get visible fields with data
  const visibleFieldsWithData = React.useMemo(() => {
    const result: { field: CategoryFieldDefinition; value: unknown }[] = [];

    fieldOrder.forEach((fieldId) => {
      const field = getFieldById(category, fieldId);
      if (!field) return;

      const value = categoryData[fieldId];
      const hasValue =
        value !== null &&
        value !== undefined &&
        (typeof value !== "string" || value.trim() !== "") &&
        (!Array.isArray(value) || value.length > 0);

      if (hasValue) {
        result.push({ field, value });
      }
    });

    return result;
  }, [category, categoryData, fieldOrder]);

  // No data to display
  if (visibleFieldsWithData.length === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <CompactFieldsDisplay
        fields={visibleFieldsWithData}
        className={className}
      />
    );
  }

  if (variant === "detailed") {
    return (
      <DetailedFieldsDisplay
        fields={visibleFieldsWithData}
        className={className}
      />
    );
  }

  // Default variant
  return (
    <DefaultFieldsDisplay
      fields={visibleFieldsWithData}
      className={className}
    />
  );
}

// =============================================================================
// Default Display (Card-based Grid)
// =============================================================================

interface FieldsDisplayProps {
  fields: { field: CategoryFieldDefinition; value: unknown }[];
  className?: string;
}

function DefaultFieldsDisplay({ fields, className }: FieldsDisplayProps) {
  // Use scroll area if many fields
  const useScrollArea = fields.length > 8;

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ field, value }) => (
        <FieldCard key={field.id} field={field} value={value} />
      ))}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Project Details</CardTitle>
      </CardHeader>
      {useScrollArea ? (
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px] px-6 pb-6">
            {content}
          </ScrollArea>
        </CardContent>
      ) : (
        <CardContent>{content}</CardContent>
      )}
    </Card>
  );
}

// =============================================================================
// Individual Field Card
// =============================================================================

interface FieldCardProps {
  field: CategoryFieldDefinition;
  value: unknown;
}

function FieldCard({ field, value }: FieldCardProps) {
  // Determine if this is an array/multi-select field that needs more space
  const isArrayField = Array.isArray(value) && value.length > 0;
  const isLongText = typeof value === "string" && value.length > 100;
  const needsFullWidth = isArrayField || isLongText || field.type === "multi-select";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-4",
        needsFullWidth && "md:col-span-2"
      )}
    >
      {/* Field Header */}
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-semibold text-primary/80">
          {field.label}
        </h4>
        {field.isCommon && (
          <Badge 
            variant="secondary" 
            className="text-[10px] font-normal px-1.5 py-0 h-4 bg-primary/10 text-primary/70 border-0"
          >
            Common
          </Badge>
        )}
      </div>

      {/* Field Value */}
      <div className="text-sm text-foreground/90">
        <DisplayFieldValue field={field} value={value} />
      </div>

      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b from-primary/40 to-primary/10" />
    </div>
  );
}

// =============================================================================
// Compact Display (Inline badges/text)
// =============================================================================

function CompactFieldsDisplay({ fields, className }: FieldsDisplayProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {fields.map(({ field, value }) => (
        <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0 sm:w-32">
            {field.label}:
          </span>
          <div className="text-sm flex-1">
            <DisplayFieldValue field={field} value={value} />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Detailed Display (Full description + data)
// =============================================================================

function DetailedFieldsDisplay({ fields, className }: FieldsDisplayProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {fields.map(({ field, value }) => (
        <div key={field.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{field.label}</h4>
            {field.isCommon && (
              <Badge variant="outline" className="text-[10px] font-normal">
                Common
              </Badge>
            )}
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          <div className="text-sm pl-4 border-l-2 border-muted">
            <DisplayFieldValue field={field} value={value} />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Tech Stack Highlight Component (for prominent display)
// =============================================================================

export interface TechStackHighlightProps {
  categoryData: Record<string, unknown>;
  className?: string;
  maxVisible?: number;
}

export function TechStackHighlight({
  categoryData,
  className,
  maxVisible = 10,
}: TechStackHighlightProps) {
  const techStack = categoryData.techStack as string[] | undefined;

  if (!techStack || techStack.length === 0) {
    return null;
  }

  const visibleTech = techStack.slice(0, maxVisible);
  const remainingCount = techStack.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleTech.map((tech) => (
        <Badge key={tech} variant="secondary" className="text-xs">
          {formatTechLabel(tech)}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

// Helper to format tech stack labels (convert value to label)
function formatTechLabel(value: string): string {
  // Common transformations
  const labelMap: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    csharp: "C#",
    cpp: "C++",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    php: "PHP",
    swift: "Swift",
    kotlin: "Kotlin",
    react: "React",
    nextjs: "Next.js",
    vue: "Vue.js",
    angular: "Angular",
    svelte: "Svelte",
    nodejs: "Node.js",
    express: "Express",
    nestjs: "NestJS",
    django: "Django",
    flask: "Flask",
    spring: "Spring",
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    redis: "Redis",
    docker: "Docker",
    kubernetes: "Kubernetes",
    aws: "AWS",
    gcp: "GCP",
    azure: "Azure",
    tensorflow: "TensorFlow",
    pytorch: "PyTorch",
    openai: "OpenAI",
    // Add more as needed
  };

  return labelMap[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

// =============================================================================
// Features List Component
// =============================================================================

export interface FeaturesListProps {
  categoryData: Record<string, unknown>;
  className?: string;
}

export function FeaturesList({ categoryData, className }: FeaturesListProps) {
  const features = categoryData.features as string | undefined;

  if (!features || features.trim() === "") {
    return null;
  }

  // Split by common delimiters (newline, comma, semicolon)
  const featureList = features
    .split(/[\n,;]/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  if (featureList.length === 0) {
    return null;
  }

  return (
    <ul className={cn("list-disc list-inside space-y-1", className)}>
      {featureList.map((feature, index) => (
        <li key={index} className="text-sm">
          {feature}
        </li>
      ))}
    </ul>
  );
}

// =============================================================================
// Challenges Section Component
// =============================================================================

export interface ChallengesSectionProps {
  categoryData: Record<string, unknown>;
  className?: string;
}

export function ChallengesSection({
  categoryData,
  className,
}: ChallengesSectionProps) {
  const challenges = categoryData.challenges as string | undefined;

  if (!challenges || challenges.trim() === "") {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground">
        Challenges & Solutions
      </h4>
      <p className="text-sm whitespace-pre-wrap">{challenges}</p>
    </div>
  );
}
