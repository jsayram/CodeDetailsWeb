import React from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onRemove?: () => void;
  removable?: boolean;
}

export function Tag({
  children,
  variant = "default",
  size = "md",
  onRemove,
  removable = false,
  className,
  ...props
}: TagProps) {
  // Style mappings for different variants and sizes
  const variantStyles = {
    default: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    primary: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    secondary: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
    outline: "border border-gray-300 bg-transparent text-gray-800 dark:border-gray-600 dark:text-gray-200",
  };

  const sizeStyles = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-2.5",
    lg: "text-base py-1.5 px-3",
  };

  // Handle remove button click
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="ml-1 rounded-full hover:bg-gray-300/80 dark:hover:bg-gray-600/80 p-1 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          aria-label="Remove tag"
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}