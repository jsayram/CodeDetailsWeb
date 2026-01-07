"use client";

/**
 * Image Uploader Component
 * Drag-and-drop image upload with preview and progress
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ImageType,
  AspectRatio,
  ImageUploaderProps,
  validateImageFile,
  getImageDimensions,
  formatFileSize,
  DEFAULT_IMAGE_UPLOAD_CONFIG,
  IMAGE_TYPE_INFO,
  ASPECT_RATIOS,
  ASPECT_RATIO_INFO,
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
  fileHash: string; // For duplicate detection
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error" | "cancelled";
  error?: string;
  aspectRatio: AspectRatio;
  abortController?: AbortController;
}

/**
 * Generate a hash for duplicate file detection (name + size + lastModified)
 */
function generateFileHash(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
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
  // Track uploaded file hashes to prevent duplicates
  const uploadedHashesRef = useRef<Set<string>>(new Set());
  // Track pending file hashes (use ref to avoid stale closure issues)
  const pendingHashesRef = useRef<Set<string>>(new Set());
  // Track cancelled upload IDs
  const cancelledIdsRef = useRef<Set<string>>(new Set());

  // Cleanup on unmount - revoke all preview URLs
  useEffect(() => {
    return () => {
      pendingUploads.forEach((pending) => {
        URL.revokeObjectURL(pending.previewUrl);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount

  const typeInfo = IMAGE_TYPE_INFO[imageType];

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      
      // Validate each file and check for duplicates
      const validFiles: { file: File; hash: string }[] = [];
      for (const file of fileArray) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }
        
        // Check for duplicate in already uploaded
        const hash = generateFileHash(file);
        if (uploadedHashesRef.current.has(hash)) {
          toast.warning(`"${file.name}" has already been uploaded`);
          continue;
        }
        
        // Check if already in pending uploads using ref
        if (pendingHashesRef.current.has(hash)) {
          toast.warning(`"${file.name}" is already being uploaded`);
          continue;
        }
        
        validFiles.push({ file, hash });
      }

      if (validFiles.length === 0) return;

      // Check max count for this type
      if (imageType === "cover" || imageType === "logo") {
        if (validFiles.length > 1) {
          toast.warning(`Only 1 ${imageType} image allowed. Using the first file.`);
          validFiles.splice(1);
        }
      }

      // Create pending upload entries with default aspect ratio
      const newPendingUploads: PendingUpload[] = validFiles.map(({ file, hash }) => {
        // Add to pending hashes ref immediately
        pendingHashesRef.current.add(hash);
        
        return {
          id: crypto.randomUUID(),
          file,
          fileHash: hash,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: "pending" as const,
          aspectRatio: "auto" as AspectRatio,
          abortController: new AbortController(),
        };
      });

      setPendingUploads((prev) => [...prev, ...newPendingUploads]);

      // Upload each file
      for (const pending of newPendingUploads) {
        // Check if cancelled before starting
        if (cancelledIdsRef.current.has(pending.id)) continue;
        await uploadFile(pending);
      }
    },
    [imageType, projectId, userId]
  );

  // Upload a single file
  const uploadFile = async (pending: PendingUpload) => {
    // Check if already cancelled
    if (cancelledIdsRef.current.has(pending.id)) {
      pendingHashesRef.current.delete(pending.fileHash);
      return;
    }

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

      // Check if cancelled
      if (cancelledIdsRef.current.has(pending.id)) {
        pendingHashesRef.current.delete(pending.fileHash);
        return;
      }

      setPendingUploads((prev) =>
        prev.map((p) => (p.id === pending.id ? { ...p, progress: 30 } : p))
      );

      // Upload to Supabase Storage
      const uploadResult = await uploadProjectImage(pending.file, userId, projectId);

      if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      // Check if cancelled after upload
      if (cancelledIdsRef.current.has(pending.id)) {
        // TODO: Could delete from storage here if needed
        pendingHashesRef.current.delete(pending.fileHash);
        return;
      }

      setPendingUploads((prev) =>
        prev.map((p) => (p.id === pending.id ? { ...p, progress: 70 } : p))
      );

      // Get the current aspect ratio from state (user may have changed it during upload)
      let aspectRatio = pending.aspectRatio;
      setPendingUploads((prev) => {
        const current = prev.find((p) => p.id === pending.id);
        if (current) {
          aspectRatio = current.aspectRatio;
        }
        return prev;
      });

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
        aspectRatio,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save image");
      }

      // Mark as uploaded to prevent re-upload and remove from pending hashes
      uploadedHashesRef.current.add(pending.fileHash);
      pendingHashesRef.current.delete(pending.fileHash);

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
        // Clean up cancelled ref
        cancelledIdsRef.current.delete(pending.id);
      }, 1500);

      toast.success(`${pending.file.name} uploaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      // Clean up pending hash on error
      pendingHashesRef.current.delete(pending.fileHash);
      
      if (errorMessage === "Upload cancelled") {
        // Silently remove cancelled uploads
        setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
        return;
      }
      
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

  // Remove/cancel a pending upload
  const removePendingUpload = useCallback((id: string) => {
    setPendingUploads((prev) => {
      const upload = prev.find((p) => p.id === id);
      if (upload) {
        // Mark as cancelled in ref so upload loop knows to skip
        cancelledIdsRef.current.add(id);
        // Remove from pending hashes
        pendingHashesRef.current.delete(upload.fileHash);
        // Abort if still uploading
        upload.abortController?.abort();
        // Clean up preview URL
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Update aspect ratio for a specific pending upload
  const updateAspectRatio = useCallback((id: string, ratio: AspectRatio) => {
    setPendingUploads((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, aspectRatio: ratio } : p
      )
    );
  }, []);

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

  // Get aspect ratio CSS class for preview
  const getPreviewAspectClass = (ratio: AspectRatio) => {
    return ASPECT_RATIO_INFO[ratio]?.cssClass || "aspect-video";
  };

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
          disabled && "opacity-50 cursor-not-allowed"
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
          <Upload className="h-10 w-10 text-muted-foreground" />
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

      {/* Pending Uploads with Per-Image Aspect Ratio */}
      {pendingUploads.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {pendingUploads.some((p) => p.status === "uploading") ? "Uploading Images" : "Pending Images"}
          </p>
          {pendingUploads.map((pending) => (
            <div
              key={pending.id}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                pending.status === "error" && "border-destructive bg-destructive/5",
                pending.status === "success" && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
              )}
            >
              {/* Image Preview and Info Row */}
              <div className="flex items-start gap-4">
                {/* Preview with Aspect Ratio Applied */}
                <div className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg bg-muted transition-all duration-300",
                  pending.status === "success" ? "w-20" : "w-32",
                  getPreviewAspectClass(pending.aspectRatio)
                )}>
                  <Image
                    src={pending.previewUrl}
                    alt={pending.file.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info and Controls */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pending.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(pending.file.size)}
                      </p>
                    </div>
                    
                    {/* Remove/Cancel button - always visible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removePendingUpload(pending.id);
                      }}
                      title={pending.status === "uploading" ? "Cancel upload" : "Remove"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-xs">
                    {pending.status === "pending" && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Waiting...
                      </span>
                    )}
                    {pending.status === "uploading" && (
                      <span className="text-blue-600 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading... {pending.progress}%
                      </span>
                    )}
                    {pending.status === "success" && (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Uploaded successfully
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
                    <Progress value={pending.progress} className="h-1.5" />
                  )}
                </div>
              </div>

              {/* Per-Image Aspect Ratio Selector - only show when not completed */}
              {pending.status !== "success" && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-muted-foreground">Aspect Ratio:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateAspectRatio(pending.id, ratio);
                          }}
                          disabled={pending.status === "uploading"}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-md border transition-all",
                            pending.aspectRatio === ratio
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-muted-foreground/20 hover:border-primary/50",
                            pending.status === "uploading" && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {ASPECT_RATIO_INFO[ratio].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
