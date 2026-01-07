"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Number of pending (unsaved) image uploads */
  pendingImageCount?: number;
}

export function UnsavedChangesConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  pendingImageCount = 0,
}: UnsavedChangesConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950/95 border-yellow-900/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-500">
            <AlertTriangle className="h-6 w-6" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription className="text-yellow-200/70">
            You have unsaved changes that will be lost if you continue.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center gap-4">
          {/* Mascot with speech bubble */}
          <div className="relative w-[150px]">
            <Image
              src="/images/mascot.png"
              alt="Code Details Mascot"
              width={150}
              height={150}
              priority
              className="transform -scale-x-100"
            />
            {/* Speech bubble */}
            <div className="absolute -top-5 left-0 bg-card p-3 rounded-lg shadow-lg border border-yellow-500/30">
              <p className="text-xs font-medium text-yellow-200">
                Don&apos;t lose your work!
              </p>
              <div className="absolute -bottom-2 left-8 w-3 h-3 bg-card border-r border-b border-yellow-500/30 transform rotate-45" />
            </div>
          </div>

          {/* Warning message */}
          <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4 w-full">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-500/20 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                  Changes Detected
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Your edits to title, description, category, tags, links, or images have not been saved.
                  {pendingImageCount > 0 && (
                    <span className="block mt-1 font-medium">
                      {pendingImageCount} uploaded {pendingImageCount === 1 ? 'image' : 'images'} will be deleted.
                    </span>
                  )}
                  Are you sure you want to discard these changes?
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-yellow-900/30 hover:bg-yellow-950/30 text-yellow-200/70 cursor-pointer"
          >
            Continue Editing
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex items-center gap-2 bg-yellow-950/80 hover:bg-yellow-900/80 cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4" />
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
