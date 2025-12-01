"use client";

/**
 * Image Gallery Component
 * Grid-based image gallery with edit controls
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Star,
  ImageIcon,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { SelectProjectImage, IMAGE_TYPE_INFO, ASPECT_RATIO_INFO, AspectRatio } from "@/types/project-images";

/**
 * Get the CSS class for an aspect ratio
 */
function getAspectRatioClass(aspectRatio?: string | null): string {
  if (!aspectRatio || aspectRatio === "auto") {
    return "aspect-video"; // Default to 16:9 for consistency
  }
  return ASPECT_RATIO_INFO[aspectRatio as AspectRatio]?.cssClass || "aspect-video";
}

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

  // For edit mode, use grid layout with visible action buttons
  if (isEditing) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Grid of all images - responsive: 1 col mobile, 2 col sm, 3 col md+ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1">
          {/* Cover image first if exists */}
          {coverImage && (
            <div className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={coverImage.storage_url}
                  alt={coverImage.alt_text || "Cover image"}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={() => onImageClick?.(coverImage, 0)}
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                
                {/* Cover badge */}
                <Badge className="absolute left-1.5 top-1.5 bg-primary/90 text-xs">
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                  Cover
                </Badge>
              </div>
              
              {/* Action buttons - always visible */}
              <div className="absolute right-1.5 top-1.5 flex gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onImageDelete?.(coverImage.id);
                  }}
                  title="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Other images */}
          {otherImages.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={image.storage_url}
                  alt={image.alt_text || `Screenshot ${index + 1}`}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={() => onImageClick?.(image, index + (coverImage ? 1 : 0))}
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                
                {/* Image type badge if not screenshot */}
                {image.image_type !== "screenshot" && (
                  <Badge
                    variant="secondary"
                    className="absolute left-1.5 top-1.5 text-xs"
                  >
                    {IMAGE_TYPE_INFO[image.image_type as keyof typeof IMAGE_TYPE_INFO]?.label || image.image_type}
                  </Badge>
                )}
              </div>
              
              {/* Action buttons - always visible */}
              <div className="absolute right-1.5 top-1.5 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-white/90 hover:bg-white shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetCover?.(image.id);
                  }}
                  title="Set as cover"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onImageDelete?.(image.id);
                  }}
                  title="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Image count */}
        <p className="text-xs text-muted-foreground text-center">
          {images.length} {images.length === 1 ? "image" : "images"} • Click to preview
        </p>
      </div>
    );
  }

  // View mode - show cover prominently, then scrollable screenshots
  return (
    <div className={cn("space-y-4", className)}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative group">
          <div className={cn(
            "relative w-full overflow-hidden rounded-lg bg-muted",
            getAspectRatioClass(coverImage.aspect_ratio)
          )}>
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
            <Badge className="absolute left-2 top-2 bg-primary/90">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Cover
            </Badge>

            {/* Zoom indicator on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          {coverImage.caption && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {coverImage.caption}
            </p>
          )}
        </div>
      )}

      {/* Screenshot Gallery - Grid view */}
      {otherImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Screenshots ({otherImages.length})
          </h4>
          
          {/* Grid gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group cursor-pointer"
                onClick={() => onImageClick?.(image, index + (coverImage ? 1 : 0))}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={image.storage_url}
                    alt={image.alt_text || `Screenshot ${index + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Instagram-style grid gallery for view mode
 * All images displayed as square thumbnails for consistent, visible display
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

  // Separate cover from screenshots for optional highlighting
  const coverImage = images.find((img) => img.image_type === "cover");
  const screenshots = images.filter((img) => img.image_type !== "cover");
  const allImages = coverImage ? [coverImage, ...screenshots] : screenshots;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Responsive grid - 1 column on mobile, 2 on sm, 3 on md+ */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {allImages.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group"
            onClick={() => onImageClick?.(image, index)}
          >
            <Image
              src={image.storage_url}
              alt={image.alt_text || `Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 475px) 100vw, (max-width: 640px) 50vw, 33vw"
            />
            
            {/* Hover overlay with zoom icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Cover indicator badge */}
            {image.image_type === "cover" && (
              <Badge className="absolute left-1 top-1 text-xs bg-primary/90 backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                Cover
              </Badge>
            )}
          </div>
        ))}
      </div>
      
      {/* Image count */}
      {allImages.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {allImages.length} {allImages.length === 1 ? "image" : "images"}
        </p>
      )}
    </div>
  );
}
