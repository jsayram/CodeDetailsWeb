"use client";

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
import { useState, useEffect } from "react";
import { submitNewTag } from "@/app/actions/tag-submissions";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/providers/projects-provider";
import { ClientOnly } from "@/components/ClientOnly";

interface TagSubmissionModalProps {
  projectId: string;
}

export function TagSubmissionModal({ projectId }: TagSubmissionModalProps) {
  const { user, isLoaded } = useUser();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagName, setTagName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [mounted, setMounted] = useState(false);

  // Get project details
  const project = projects?.find(p => p.id === projectId);

  // Check if the current user is the owner of the project
  const isOwner = project?.user_id === user?.id;

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-populate email from Clerk user data only after mounting and user is loaded
  useEffect(() => {
    if (mounted && isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user, isLoaded, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!isOwner) {
        toast.error("You are not authorized to request a tag for this project.");
        return;
      }

      await submitNewTag(tagName, projectId, email, description);
      toast.success("Tag submission received! Once approved, it will be automatically connected to this project.");
      setOpen(false);
      // Reset form
      setTagName("");
      setEmail("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to submit tag. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

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
                  Propose a new tag for this project
                  <ClientOnly>
                    {project && (
                      <div className="bg-muted/50 p-2 rounded-md text-sm">
                        <Badge variant="outline" className="mb-1">{project.title}</Badge>
                      </div>
                    )}
                  </ClientOnly>
                  <div className="text-xs text-muted-foreground mt-2">
                    Once approved, this tag will be automatically connected to the project.
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="tag-name">Tag Name</label>
                <Input
                  id="tag-name"
                  placeholder="Enter tag name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                />
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
                  placeholder="Why should this tag be added to this project?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
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