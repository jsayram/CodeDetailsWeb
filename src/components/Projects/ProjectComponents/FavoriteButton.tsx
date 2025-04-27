// FavoriteButton.tsx
"use client";
import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  isFavorite: boolean;
  count: number;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
}

export function FavoriteButton({
  isFavorite,
  count,
  onClick,
  disabled = false,
  className = "",
  size = 20,
  ariaLabel
}: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`action-button favorite-button group relative ${className}`}
      onClick={onClick}
      aria-label={ariaLabel || (isFavorite ? "Remove from favorites" : "Add to favorites")}
      disabled={disabled}
      tabIndex={0}
      type="button"
    >
      <Heart
        size={size}
        className={`transition-all duration-300 ${
          isFavorite
            ? "fill-red-500 text-red-500 scale-110 animate-heartPop"
            : "text-muted-foreground group-hover:text-red-500"
        }`}
      />
      <span className="favorite-count">{count || 0}</span>
    </Button>
  );
}
