"use client";

import React from "react";
import { AlertTriangle, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnfavoriteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isUnfavoriting?: boolean;
}

export function UnfavoriteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isUnfavoriting = false,
}: UnfavoriteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950/95 border-red-900/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            Remove from Favorites?
          </DialogTitle>
          <DialogDescription className="text-red-200/70">
            Are you sure you want to remove <span className="font-semibold">{projectTitle}</span> from your favorites?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isUnfavoriting}
            className="border-red-900/30 hover:bg-red-950/30 text-red-200/70"
          >
            Keep in Favorites
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isUnfavoriting}
            className="flex items-center gap-2 bg-red-950/80 hover:bg-red-900/80"
          >
            {isUnfavoriting ? (
              "Removing..."
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Remove from Favorites
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}