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
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  projectCategory?: ProjectCategory;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  projectCategory,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950/95 border-red-900/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <span className="relative text-3xl">🪦</span>Send to Graveyard?
          </DialogTitle>
          <DialogDescription className="text-red-200/70">
            This project will be removed from community projects and sent to the digital graveyard.
            You can find it later in the deleted projects section.
          </DialogDescription>
          {projectCategory && (
            <span className="text-sm text-red-200/70 mt-2">
              Category: {PROJECT_CATEGORIES[projectCategory].label}
            </span>
          )}
        </DialogHeader>

        <div className="py-4">
          <p className="mb-2 text-sm text-red-200/50">About to delete:</p>
          <div className="flex items-center gap-2 p-3 rounded-md border border-red-900/20 bg-gray-950">
            <Badge variant="destructive" className="bg-red-950/60 text-red-200">
              Project
            </Badge>
            <span className="font-medium text-red-200/80">{projectTitle}</span>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isDeleting}
            className="border-red-900/30 hover:bg-red-950/30 text-red-200/70"
          >
            Keep Alive
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-950/80 hover:bg-red-900/80"
          >
            {isDeleting ? (
              "Sending to graveyard..."
            ) : (
              <>
                <Trash2 size={16} />
                Send to Graveyard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
