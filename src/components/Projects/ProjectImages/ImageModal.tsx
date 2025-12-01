"use client";

/**
 * Image Modal Component
 * Full-screen image viewer with navigation
 */

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Star,
} from "lucide-react";
import Image from "next/image";
import { SelectProjectImage, IMAGE_TYPE_INFO } from "@/types/project-images";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageModalProps {
  images: SelectProjectImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setIsLoading(true);
    }
  }, [isOpen, initialIndex]);

  const currentImage = images[currentIndex];

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setIsLoading(true);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setIsLoading(true);
  }, [images.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setIsLoading(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case "0":
          e.preventDefault();
          setZoom(1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Download handler
  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.file_name || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        <VisuallyHidden>
          <DialogTitle>
            Image Viewer - {currentImage.alt_text || currentImage.file_name || `Image ${currentIndex + 1}`}
          </DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Main image area */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-40 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-40 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image container */}
          <div
            className="relative flex items-center justify-center transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              maxWidth: "90%",
              maxHeight: "75vh",
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              </div>
            )}
            <Image
              src={currentImage.storage_url}
              alt={currentImage.alt_text || `Image ${currentIndex + 1}`}
              width={currentImage.width || 1200}
              height={currentImage.height || 800}
              className={cn(
                "max-h-[75vh] w-auto object-contain transition-opacity",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              priority
            />
          </div>

          {/* Image type badge */}
          {currentImage.image_type && (
            <Badge
              className="absolute left-4 top-4 z-40"
              variant={currentImage.image_type === "cover" ? "default" : "secondary"}
            >
              {currentImage.image_type === "cover" && (
                <Star className="h-3 w-3 mr-1 fill-current" />
              )}
              {IMAGE_TYPE_INFO[currentImage.image_type as keyof typeof IMAGE_TYPE_INFO]?.label || currentImage.image_type}
            </Badge>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Caption */}
            {currentImage.caption && (
              <p className="mb-3 text-center text-sm text-white/90">
                {currentImage.caption}
              </p>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-black/50 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-xs text-white">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleResetZoom}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-white/20 hover:text-white"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Image counter */}
            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-white/60">
                {currentIndex + 1} of {images.length}
              </p>
            )}
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <ScrollArea className="w-full">
              <div className="flex justify-center gap-2 pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => goToIndex(index)}
                    className={cn(
                      "relative h-12 w-16 shrink-0 overflow-hidden rounded-md transition-all",
                      index === currentIndex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                        : "opacity-50 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={image.storage_url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="bg-white/10" />
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
