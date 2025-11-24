// Create this in src/components/ui/FormattedDate.tsx
import { ClientOnly } from "@/lib/ClientSideUtils";
import React from "react";

// Helper function to format date in a consistent way
function formatDateString(date: Date | string | number, format: "date" | "time" | "datetime"): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use a more predictable format that's less likely to cause hydration issues
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (format === "datetime" || format === "time") {
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }
  
  // For date format, use relative or absolute
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function FormattedDate({
  date,
  format = "date",
  fallback = "...",
}: {
  date: Date | string | number;
  format?: "date" | "time" | "datetime";
  fallback?: React.ReactNode;
}) {
  return (
    <ClientOnly fallback={fallback}>
      {formatDateString(date, format)}
    </ClientOnly>
  );
}
