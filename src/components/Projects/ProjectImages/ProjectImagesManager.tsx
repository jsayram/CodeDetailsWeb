"use client";

/**
 * Project Images Manager Component
 * Complete image management with upload, gallery, and modal viewer
 */

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Image as ImageIcon,
  Upload,
  Star,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { ImageGallery, ImageGalleryGrid } from "./ImageGallery";
import { ImageModal } from "./ImageModal";
import { SelectProjectImage, ImageType, IMAGE_TYPE_INFO } from "@/types/project-images";
import {
  getProjectImagesAction,
  deleteProjectImageAction,
  setProjectCoverImageAction,
  permanentlyDeleteProjectImageAction,
} from "@/app/actions/project-images";
import { deleteProjectImage as deleteFromStorage } from "@/lib/supabase-storage";

interface ProjectImagesManagerProps {
  projectId: string;
  userId: string;
  isEditing?: boolean;
  isOwner?: boolean;
  onEditClick?: () => void;
  /** Called when images change during edit session - passes count of new images */
  onImagesChange?: (newImageCount: number) => void;
  /** Reference to get the discard function */
  discardRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  className?: string;
}

export function ProjectImagesManager({
  projectId,
  userId,
  isEditing = false,
  isOwner = false,
  onEditClick,
  onImagesChange,
  discardRef,
  className,
}: ProjectImagesManagerProps) {
  const [images, setImages] = useState<SelectProjectImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track images uploaded during this edit session (for discard on cancel)
  // This stores the full image objects so we can delete them from storage
  const [pendingImages, setPendingImages] = useState<SelectProjectImage[]>([]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<SelectProjectImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notify parent when pending images change
  useEffect(() => {
    onImagesChange?.(pendingImages.length);
  }, [pendingImages.length, onImagesChange]);

  // Fetch images
  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getProjectImagesAction(projectId);
      
      if (result.success) {
        setImages(result.data);
      } else {
        setError(result.error || "Failed to load images");
      }
    } catch (err) {
      setError("Failed to load images");
      console.error("Error fetching images:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Discard function - called by parent when user cancels
  const discardPendingImages = useCallback(async () => {
    if (pendingImages.length === 0) return;
    
    console.log("Discarding pending images:", pendingImages.map(img => img.id));
    
    // Delete all pending images from storage and database
    for (const image of pendingImages) {
      try {
        const result = await permanentlyDeleteProjectImageAction(image.id);
        if (result.success) {
          await deleteFromStorage(result.data.storagePath);
          console.log("Deleted pending image:", image.id);
        }
      } catch (err) {
        console.error("Error discarding image:", err);
      }
    }
    
    // Clear pending images and refresh from server
    setPendingImages([]);
    await fetchImages();
  }, [pendingImages, fetchImages]);

  // Expose discard function to parent via ref
  useEffect(() => {
    if (discardRef) {
      discardRef.current = discardPendingImages;
    }
    return () => {
      if (discardRef) {
        discardRef.current = null;
      }
    };
  }, [discardRef, discardPendingImages]);

  // Clear pending images when exiting edit mode (but don't delete - they're saved)
  useEffect(() => {
    if (!isEditing) {
      setPendingImages([]);
    }
  }, [isEditing]);

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle image click (open modal)
  const handleImageClick = (image: SelectProjectImage, _index: number) => {
    // Find the actual index of this image in the images array
    const actualIndex = images.findIndex((img) => img.id === image.id);
    setModalInitialIndex(actualIndex >= 0 ? actualIndex : 0);
    setModalOpen(true);
  };

  // Handle image upload complete
  const handleUploadComplete = useCallback((newImage: SelectProjectImage) => {
    console.log("Image uploaded:", newImage.id, newImage.image_type);
    
    // Track this image as pending (uploaded during this edit session)
    setPendingImages((prev) => [...prev, newImage]);
    
    // For cover/logo, replace existing instead of adding
    if (newImage.image_type === "cover" || newImage.image_type === "logo") {
      setImages((prev) => {
        // Remove existing cover/logo and add new one
        const filtered = prev.filter((img) => img.image_type !== newImage.image_type);
        return [...filtered, newImage];
      });
    } else {
      setImages((prev) => [...prev, newImage]);
    }
  }, []);

  // Handle set as cover
  const handleSetCover = async (imageId: string) => {
    try {
      const result = await setProjectCoverImageAction(imageId);
      
      if (result.success) {
        toast.success("Cover image updated");
        fetchImages(); // Refresh to get updated image types
      } else {
        toast.error(result.error || "Failed to set cover image");
      }
    } catch (err) {
      toast.error("Failed to set cover image");
      console.error("Error setting cover:", err);
    }
  };

  // Handle delete request (show confirmation)
  const handleDeleteRequest = (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (image) {
      setImageToDelete(image);
      setDeleteConfirmOpen(true);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    try {
      // First delete from database
      const result = await permanentlyDeleteProjectImageAction(imageToDelete.id);
      
      if (result.success) {
        // Then delete from storage
        await deleteFromStorage(result.data.storagePath);
        
        // Update local state
        setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
        toast.success("Image deleted");
      } else {
        toast.error(result.error || "Failed to delete image");
      }
    } catch (err) {
      toast.error("Failed to delete image");
      console.error("Error deleting image:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setImageToDelete(null);
    }
  };

  // Get cover image
  const coverImage = images.find((img) => img.image_type === "cover");
  const screenshotCount = images.filter((img) => img.image_type === "screenshot").length;

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchImages}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode (not editing)
  if (!isEditing) {
    if (images.length === 0) {
      return null; // Don't show empty section in view mode
    }

    return (
      <>
        {/* Blog-style image section without Card wrapper */}
        <div className={cn("space-y-4", className)}>
          {/* Header with Edit button for owners */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ImageIcon className="h-6 w-6" />
              Project Images
            </h2>
            {isOwner && onEditClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Edit Images
              </Button>
            )}
          </div>

          {/* Image Gallery - Instagram grid style */}
          <ImageGalleryGrid
            images={images}
            onImageClick={handleImageClick}
          />
        </div>

        {/* Image Modal */}
        <ImageModal
          images={images}
          initialIndex={modalInitialIndex}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          allowDownload={isOwner}
        />
      </>
    );
  }

  // Edit mode
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Project Images
          </CardTitle>
          <CardDescription>
            Add a cover image and screenshots to showcase your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={coverImage ? "default" : "outline"}>
              <Star className={cn("h-3 w-3 mr-1", coverImage && "fill-current")} />
              Cover: {coverImage ? "Set" : "None"}
            </Badge>
            <Badge variant="secondary">
              Screenshots: {screenshotCount}/20
            </Badge>
          </div>

          {/* Upload tabs */}
          <Tabs defaultValue="screenshots" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cover">
                <Star className="h-4 w-4 mr-2" />
                Cover Image
              </TabsTrigger>
              <TabsTrigger value="screenshots">
                <Upload className="h-4 w-4 mr-2" />
                Screenshots
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cover" className="mt-4">
              <ImageUploader
                projectId={projectId}
                userId={userId}
                imageType="cover"
                onUploadComplete={handleUploadComplete}
              />
              {coverImage && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Current cover:</p>
                  <ImageGallery
                    images={[coverImage]}
                    isEditing={true}
                    onImageClick={handleImageClick}
                    onImageDelete={handleDeleteRequest}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="screenshots" className="mt-4">
              <ImageUploader
                projectId={projectId}
                userId={userId}
                imageType="screenshot"
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>
          </Tabs>

          {/* Gallery */}
          {images.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">All Images</h4>
              <ImageGallery
                images={images}
                isEditing={true}
                onImageClick={handleImageClick}
                onImageDelete={handleDeleteRequest}
                onSetCover={handleSetCover}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      <ImageModal
        images={images}
        initialIndex={modalInitialIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        allowDownload={isOwner}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => {
        // Only allow closing if not currently deleting
        if (!isDeleting) {
          setDeleteConfirmOpen(open);
          if (!open) {
            setImageToDelete(null);
          }
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
              {imageToDelete?.image_type === "cover" && (
                <span className="block mt-2 text-amber-600">
                  Note: This is your cover image. Your project will have no cover after deletion.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Compact image display for project cards
 */
export function ProjectCoverImage({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const [coverImage, setCoverImage] = useState<SelectProjectImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCover() {
      try {
        const result = await getProjectImagesAction(projectId, "cover");
        if (result.success && result.data && result.data.length > 0) {
          setCoverImage(result.data[0]);
        }
      } catch (err) {
        console.error("Error loading cover:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCover();
  }, [projectId]);

  if (isLoading) {
    return <div className={cn("animate-pulse bg-muted", className)} />;
  }

  if (!coverImage) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageIcon className="h-8 w-8 opacity-50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={coverImage.storage_url}
        alt={coverImage.alt_text || "Project cover"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
