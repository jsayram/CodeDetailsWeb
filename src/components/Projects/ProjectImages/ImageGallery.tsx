"use client";

/**
 * Image Gallery Component
 * Responsive scrollable image gallery with thumbnails
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Star,
  MoreVertical,
  ImageIcon,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { SelectProjectImage, IMAGE_TYPE_INFO } from "@/types/project-images";

interface ImageGalleryProps {
  images: SelectProjectImage[];
  isEditing?: boolean;
  onImageClick?: (image: SelectProjectImage, index: number) => void;
  onImageDelete?: (imageId: string) => void;
  onSetCover?: (imageId: string) => void;
  className?: string;
}

export function ImageGallery({
  images,
  isEditing = false,
  onImageClick,
  onImageDelete,
  onSetCover,
  className,
}: ImageGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
          className
        )}
      >
        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No images uploaded yet</p>
      </div>
    );
  }

  // Separate cover from other images
  const coverImage = images.find((img) => img.image_type === "cover");
  const otherImages = images.filter((img) => img.image_type !== "cover");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={coverImage.storage_url}
              alt={coverImage.alt_text || "Cover image"}
              fill
              className="object-cover cursor-pointer transition-transform hover:scale-105"
              onClick={() => onImageClick?.(coverImage, 0)}
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
            
            {/* Cover badge */}
            <Badge
              className="absolute left-2 top-2 bg-primary/90"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Cover
            </Badge>

            {/* Zoom indicator */}
            <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-4 w-4 text-white" />
            </div>

            {/* Edit actions */}
            {isEditing && (
              <div className="absolute right-2 bottom-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onImageDelete?.(coverImage.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {coverImage.caption && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {coverImage.caption}
            </p>
          )}
        </div>
      )}

      {/* Screenshot Gallery */}
      {otherImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Screenshots ({otherImages.length})
          </h4>
          
          {/* Horizontal scrollable gallery */}
          <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <div className="flex gap-3 pb-3">
              {otherImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative shrink-0 group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={cn(
                      "relative h-32 w-48 sm:h-40 sm:w-60 overflow-hidden rounded-lg bg-muted cursor-pointer",
                      "ring-offset-background transition-all",
                      hoveredIndex === index && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => onImageClick?.(image, index + (coverImage ? 1 : 0))}
                  >
                    <Image
                      src={image.storage_url}
                      alt={image.alt_text || `Screenshot ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 192px, 240px"
                    />
                    
                    {/* Image type badge */}
                    {image.image_type !== "screenshot" && (
                      <Badge
                        variant="secondary"
                        className="absolute left-2 top-2 text-xs"
                      >
                        {IMAGE_TYPE_INFO[image.image_type as keyof typeof IMAGE_TYPE_INFO]?.label || image.image_type}
                      </Badge>
                    )}

                    {/* Hover overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                        hoveredIndex === index ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Edit actions */}
                  {isEditing && hoveredIndex === index && (
                    <div className="absolute right-1 top-1 flex gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 bg-black/60 hover:bg-black/80"
                          >
                            <MoreVertical className="h-3.5 w-3.5 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onSetCover?.(image.id)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Set as Cover
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onImageDelete?.(image.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/**
 * Grid-based gallery for view mode
 */
export function ImageGalleryGrid({
  images,
  onImageClick,
  className,
}: {
  images: SelectProjectImage[];
  onImageClick?: (image: SelectProjectImage, index: number) => void;
  className?: string;
}) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3",
        className
      )}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative aspect-video overflow-hidden rounded-lg bg-muted cursor-pointer group"
          onClick={() => onImageClick?.(image, index)}
        >
          <Image
            src={image.storage_url}
            alt={image.alt_text || `Image ${index + 1}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Cover indicator */}
          {image.image_type === "cover" && (
            <Badge className="absolute left-1 top-1 text-xs">
              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
              Cover
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
