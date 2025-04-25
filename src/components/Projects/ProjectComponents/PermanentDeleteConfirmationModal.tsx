"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PermanentDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isDeleting?: boolean;
}

export function PermanentDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isDeleting = false,
}: PermanentDeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950/95 border-red-900/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            Permanent Deletion Warning
          </DialogTitle>
          <DialogDescription className="text-red-200/70">
            This action will <span className="font-bold">permanently delete</span> this project.
            This cannot be undone and the project cannot be restored.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-2 text-sm text-red-200/50">About to permanently delete:</p>
          <div className="flex items-center gap-2 p-3 rounded-md border border-red-900/20 bg-gray-950">
            <Badge variant="destructive" className="bg-red-950/60 text-red-200">
              Project
            </Badge>
            <span className="font-medium text-red-200/80">{projectTitle}</span>
          </div>
          
          <div className="mt-4 p-4 bg-red-950/20 border border-red-900/20 rounded-md">
            <p className="text-red-200/90 text-sm">
              ⚠️ Once a project is permanently deleted:
            </p>
            <ul className="list-disc list-inside text-sm text-red-200/70 mt-2 space-y-1">
              <li>All project data will be permanently removed</li>
              <li>This action cannot be reversed</li>
              <li>The project cannot be restored</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isDeleting}
            className="border-red-900/30 hover:bg-red-950/30 text-red-200/70"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-950/80 hover:bg-red-900/80"
          >
            {isDeleting ? (
              "Permanently Deleting..."
            ) : (
              <>
                <Trash2 size={16} />
                Permanently Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}