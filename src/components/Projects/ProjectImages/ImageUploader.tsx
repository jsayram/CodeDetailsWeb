"use client";

/**
 * Image Uploader Component
 * Drag-and-drop image upload with preview and progress
 */

import React, { useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ImageType,
  ImageUploaderProps,
  validateImageFile,
  getImageDimensions,
  formatFileSize,
  DEFAULT_IMAGE_UPLOAD_CONFIG,
  IMAGE_TYPE_INFO,
} from "@/types/project-images";
import {
  uploadProjectImage,
  generateStoragePath,
} from "@/lib/supabase-storage";
import { createProjectImageAction } from "@/app/actions/project-images";
import Image from "next/image";

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function ImageUploader({
  projectId,
  userId,
  imageType,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeInfo = IMAGE_TYPE_INFO[imageType];

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      
      // Validate each file
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Check max count for this type
      if (imageType === "cover" || imageType === "logo") {
        if (validFiles.length > 1) {
          toast.warning(`Only 1 ${imageType} image allowed. Using the first file.`);
          validFiles.splice(1);
        }
      }

      // Create pending upload entries
      const newPendingUploads: PendingUpload[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }));

      setPendingUploads((prev) => [...prev, ...newPendingUploads]);

      // Upload each file
      for (const pending of newPendingUploads) {
        await uploadFile(pending);
      }
    },
    [imageType, projectId, userId]
  );

  // Upload a single file
  const uploadFile = async (pending: PendingUpload) => {
    try {
      // Update status to uploading
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === pending.id ? { ...p, status: "uploading" as const, progress: 10 } : p
        )
      );

      // Get image dimensions
      let dimensions = { width: 0, height: 0 };
      try {
        dimensions = await getImageDimensions(pending.file);
      } catch {
        // Continue without dimensions
      }

      setPendingUploads((prev) =>
        prev.map((p) => (p.id === pending.id ? { ...p, progress: 30 } : p))
      );

      // Upload to Supabase Storage
      const uploadResult = await uploadProjectImage(pending.file, userId, projectId);

      if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      setPendingUploads((prev) =>
        prev.map((p) => (p.id === pending.id ? { ...p, progress: 70 } : p))
      );

      // Create database record
      const result = await createProjectImageAction({
        projectId,
        storagePath: uploadResult.path,
        storageUrl: uploadResult.url,
        fileName: pending.file.name,
        fileSize: pending.file.size,
        mimeType: pending.file.type,
        width: dimensions.width || undefined,
        height: dimensions.height || undefined,
        imageType,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save image");
      }

      // Success
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === pending.id ? { ...p, status: "success" as const, progress: 100 } : p
        )
      );

      // Clean up preview URL
      URL.revokeObjectURL(pending.previewUrl);

      // Notify parent
      if (result.data) {
        onUploadComplete?.(result.data);
      }

      // Remove from pending after delay
      setTimeout(() => {
        setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
      }, 1500);

      toast.success(`${pending.file.name} uploaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === pending.id
            ? { ...p, status: "error" as const, error: errorMessage }
            : p
        )
      );

      onUploadError?.(errorMessage);
      toast.error(`Failed to upload ${pending.file.name}: ${errorMessage}`);
    }
  };

  // Remove a pending upload
  const removePendingUpload = (id: string) => {
    setPendingUploads((prev) => {
      const upload = prev.find((p) => p.id === id);
      if (upload) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  // Click to upload
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = "";
  };

  const isUploading = pendingUploads.some((p) => p.status === "uploading");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={DEFAULT_IMAGE_UPLOAD_CONFIG.allowedTypes.join(",")}
          multiple={imageType !== "cover" && imageType !== "logo"}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver
                ? "Drop image here"
                : `Upload ${typeInfo.label}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {typeInfo.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag & drop or click to select • Max {DEFAULT_IMAGE_UPLOAD_CONFIG.maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>

      {/* Pending Uploads */}
      {pendingUploads.length > 0 && (
        <div className="space-y-2">
          {pendingUploads.map((pending) => (
            <div
              key={pending.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                pending.status === "error" && "border-destructive bg-destructive/5"
              )}
            >
              {/* Preview */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={pending.previewUrl}
                  alt={pending.file.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{pending.file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(pending.file.size)}</span>
                  {pending.status === "uploading" && (
                    <span>Uploading...</span>
                  )}
                  {pending.status === "success" && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </span>
                  )}
                  {pending.status === "error" && (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {pending.error || "Failed"}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {pending.status === "uploading" && (
                  <Progress value={pending.progress} className="h-1" />
                )}
              </div>

              {/* Remove button */}
              {pending.status !== "uploading" && pending.status !== "success" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removePendingUpload(pending.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
