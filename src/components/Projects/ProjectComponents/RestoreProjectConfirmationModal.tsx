"use client";

import React from "react";
import { Undo2 } from "lucide-react";
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

interface RestoreProjectConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isRestoring?: boolean;
}

export function RestoreProjectConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isRestoring = false,
}: RestoreProjectConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950/95 border-green-900/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-500">
            <Undo2 className="h-6 w-6" />
            Restore Project
          </DialogTitle>
          <DialogDescription className="text-green-200/70">
            This will restore the project from the graveyard and make it visible to the community again.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-2 text-sm text-green-200/50">About to restore:</p>
          <div className="flex items-center gap-2 p-3 rounded-md border border-green-900/20 bg-gray-950">
            <Badge className="bg-green-950/60 text-green-200 hover:bg-green-900/60">
              Project
            </Badge>
            <span className="font-medium text-green-200/80">{projectTitle}</span>
          </div>
          
          <div className="mt-4 p-4 bg-green-950/20 border border-green-900/20 rounded-md">
            <p className="text-green-200/90 text-sm">
              ✨ When a project is restored:
            </p>
            <ul className="list-disc list-inside text-sm text-green-200/70 mt-2 space-y-1">
              <li>It will be visible to the community again</li>
              <li>All project data and tags will be preserved</li>
              <li>The project will appear in your active projects list</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isRestoring}
            className="border-green-900/30 hover:bg-green-950/30 text-green-200/70 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isRestoring}
            className="flex items-center gap-2 bg-green-950/80 hover:bg-green-900/80 text-green-50 cursor-pointer"
          >
            {isRestoring ? (
              "Restoring Project..."
            ) : (
              <>
                <Undo2 size={16} />
                Restore Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}