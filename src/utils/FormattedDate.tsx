// Create this in src/components/ui/FormattedDate.tsx
import { ClientOnly } from "@/utils/ClientSideUtils";
import React from "react";

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
      {(() => {
        const dateObj = date instanceof Date ? date : new Date(date);

        switch (format) {
          case "time":
            return dateObj.toLocaleTimeString();
          case "datetime":
            return dateObj.toLocaleString();
          case "date":
          default:
            return dateObj.toLocaleDateString();
        }
      })()}
    </ClientOnly>
  );
}
