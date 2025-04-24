"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitNewTag } from "@/app/actions/tag-submissions";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/providers/projects-provider";
import { ClientOnly } from "@/components/ClientOnly";

interface TagSubmissionModalProps {
  projectId: string;
}

// Validation function for tag names
const validateTagName = (tag: string): { isValid: boolean; message?: string } => {
  const normalized = tag.trim().toLowerCase();
  
  if (!normalized) {
    return { isValid: false, message: "Tag name cannot be empty" };
  }
  
  if (normalized.length < 2) {
    return { isValid: false, message: "Tag name must be at least 2 characters long" };
  }
  
  if (normalized.length > 30) {
    return { isValid: false, message: "Tag name must be less than 30 characters" };
  }
  
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return { 
      isValid: false, 
      message: "Tags can only contain lowercase letters, numbers, and hyphens" 
    };
  }
  
  return { isValid: true };
};

export function TagSubmissionModal({ projectId }: TagSubmissionModalProps) {
  const { user, isLoaded } = useUser();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [processedTags, setProcessedTags] = useState<Array<{ name: string; isValid: boolean; message?: string }>>([]);

  // Get project details
  const project = projects?.find(p => p.id === projectId);
  const isOwner = project?.user_id === user?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user, isLoaded, mounted]);

  const processTagInput = (input: string) => {
    const tags = input
      .split(',')
      .map(tag => ({ 
        original: tag,
        normalized: tag.trim().toLowerCase()
      }))
      .filter(({ normalized }) => normalized) // Remove empty tags
      .map(({ normalized }) => {
        const validation = validateTagName(normalized);
        return {
          name: normalized,
          isValid: validation.isValid,
          message: validation.message
        };
      });

    setProcessedTags(tags);
    const hasInvalid = tags.some(tag => !tag.isValid);
    setTagError(hasInvalid ? "Please fix invalid tags" : null);
    return !hasInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error("You are not authorized to request a tag for this project.");
      return;
    }

    const isValid = processTagInput(tagInput);
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // Submit each valid tag as a separate submission
      const validTags = processedTags.filter(tag => tag.isValid);
      
      for (const tag of validTags) {
        await submitNewTag(tag.name, projectId, email, description);
      }

      const message = validTags.length === 1
        ? "Tag submission received! Once approved, it will be automatically connected to this project."
        : `${validTags.length} tag submissions received! Once approved, they will be automatically connected to this project.`;

      toast.success(message);
      setOpen(false);
      
      // Reset form
      setTagInput("");
      setEmail("");
      setDescription("");
      setProcessedTags([]);
      setTagError(null);
    } catch (error) {
      toast.error("Failed to submit tag(s). Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isOwner || !isLoaded}>
          Request New Tag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isOwner ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Submit New Tag</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  Propose new tags for this project
                  <ClientOnly>
                    {project && (
                      <div className="bg-muted/50 p-2 rounded-md text-sm">
                        <Badge variant="outline" className="mb-1">{project.title}</Badge>
                      </div>
                    )}
                  </ClientOnly>
                  <div className="text-xs text-muted-foreground mt-2">
                    You can submit multiple tags by separating them with commas.
                    Tags must be lowercase, no spaces, URL-safe, and contain only letters, numbers, and hyphens.
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="tag-name">Tag Name</label>
                <Input
                  id="tag-name"
                  placeholder="e.g. react, next-js, typescript"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (!e.target.value) {
                      setProcessedTags([]);
                      setTagError(null);
                    }
                  }}
                  onBlur={() => processTagInput(tagInput)}
                  required
                />
                {processedTags.length > 0 && (
                  <div className="space-y-2">
                    {processedTags.map((tag, index) => (
                      <div 
                        key={index}
                        className={`text-sm ${tag.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {tag.name} {!tag.isValid && `- ${tag.message}`}
                      </div>
                    ))}
                  </div>
                )}
                {tagError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{tagError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Your Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description (Optional)</label>
                <Textarea
                  id="description"
                  placeholder="Why should these tags be added to this project?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !!tagError}>
                {isSubmitting ? "Submitting..." : "Submit Tag"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-sm text-muted-foreground">
            You are not authorized to request a tag for this project.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}