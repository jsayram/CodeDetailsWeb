"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitNewTag } from "@/app/actions/tag-submissions";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { useTagCache } from "@/hooks/use-tag-cache";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";
import { Tag as TagIcon, Info, AlertCircle, CheckCircle2, X, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROFANITY_LIST } from "@/constants/profanity-list";
import { useRouter, useParams } from "next/navigation";
import { SelectTagSubmission } from "@/db/schema/tag_submissions";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageBanner } from "@/components/ui/page-banner";
import { UnsavedChangesConfirmationModal } from "@/components/Projects/ProjectComponents/UnsavedChangesConfirmationModal";

// Validation function for tag names with enhanced rules
const validateTagName = async (
  tag: string
): Promise<{ isValid: boolean; message?: string }> => {
  const normalized = tag.trim().toLowerCase();

  if (!normalized) {
    return { isValid: false, message: "Tag name cannot be empty" };
  }

  if (normalized.length < 2) {
    return {
      isValid: false,
      message: "Must be at least 2 characters",
    };
  }

  if (normalized.length > 45) {
    const excess = normalized.length - 45;
    return {
      isValid: false,
      message: `Must be 45 characters or less (currently ${normalized.length} characters, remove ${excess} character${excess !== 1 ? 's' : ''})`,
    };
  }

  // Check for invalid characters first
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return {
      isValid: false,
      message: "Only lowercase letters, numbers, and hyphens allowed",
    };
  }

  // Check for proper hyphen usage
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return {
      isValid: false,
      message: "Cannot start/end with hyphen or have consecutive hyphens",
    };
  }

  // Check for offensive or inappropriate content
  const matchedWord = PROFANITY_LIST.find(word => normalized.includes(word));
  if (matchedWord) {
    return {
      isValid: false,
      message: ` is not a nice tag, please choose a different tag!`,
    };
  }
  return { isValid: true };
};

export default function SuggestTagsPage() {
  const router = useRouter();
  const params = useParams();
  const projectSlug = params.slug as string;
  
  const { user, isLoaded } = useUser();
  const { refreshCache } = useTagCache();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [email, setEmail] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagReasons, setTagReasons] = useState<Record<string, string>>({});
  const [processedTags, setProcessedTags] = useState<
    Array<{
      name: string;
      isValid: boolean;
      message?: string;
      willBeSubmitted?: boolean;
      reason?: string;
    }>
  >([]);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Project data state
  const [projectData, setProjectData] = useState<{
    id: string;
    title: string;
    tags: string[];
  } | null>(null);
  const [pendingTags, setPendingTags] = useState<SelectTagSubmission[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  const currentTags = projectData?.tags || [];
  const currentTagCount = currentTags.length;
  const remainingTagSlots = MAX_PROJECT_TAGS - currentTagCount;

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/slug/${projectSlug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProjectData({
          id: data.id,
          title: data.title,
          tags: data.tags || [],
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project data");
        router.push(`/projects/${projectSlug}`);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProjectData();
  }, [projectSlug, router]);

  // Fetch pending tag submissions
  useEffect(() => {
    const fetchPendingTags = async () => {
      if (!projectData?.id || !user?.primaryEmailAddress?.emailAddress) return;

      try {
        const response = await fetch(
          `/api/projects/${projectData.id}/tag-submissions?status=pending&email=${encodeURIComponent(
            user.primaryEmailAddress.emailAddress
          )}`,
          { cache: "no-store" }
        );
        const submissions = await response.json();

        if (Array.isArray(submissions)) {
          setPendingTags(submissions);
        }
      } catch (error) {
        console.error("Failed to load pending tag submissions:", error);
        setPendingTags([]);
      }
    };

    fetchPendingTags();
  }, [projectData?.id, user?.primaryEmailAddress?.emailAddress]);

  // Set user email when loaded
  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user, isLoaded]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // Check if user has typed tags or tag reasons
    const hasTypedTags = tagInput.trim().length > 0;
    const hasTypedReasons = Object.values(tagReasons).some(reason => reason.trim().length > 0);
    // Check if there are valid tags ready to submit
    const hasValidTags = processedTags.some(t => t.isValid && t.willBeSubmitted);
    
    return hasTypedTags || hasTypedReasons || hasValidTags;
  };

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(`/projects/${projectSlug}`);
      setShowUnsavedChangesModal(true);
    } else {
      router.push(`/projects/${projectSlug}`);
    }
  };

  // Confirm discard changes and navigate
  const handleConfirmDiscardChanges = () => {
    setShowUnsavedChangesModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const processTagInput = async (input: string) => {
    if (!input.trim()) {
      setProcessedTags([]);
      setTagError(null);
      return true;
    }
    
    setProcessedTags([]); // Clear existing tags while processing

    // Keep track of normalized tags we've seen
    const seenNormalizedTags = new Set<string>();

    const tagPromises = input
      .split(",")
      .map((tag) => ({
        original: tag,
        normalized: tag.trim().toLowerCase(),
      }))
      .filter(({ normalized }) => normalized) // Remove empty tags
      .filter(({ normalized }) => {
        // If we've seen this normalized tag before, filter it out
        if (seenNormalizedTags.has(normalized)) {
          return false;
        }
        // Otherwise, add it to our set and keep it
        seenNormalizedTags.add(normalized);
        return true;
      })
      .map(async ({ normalized }, index) => {
        const validation = await validateTagName(normalized);

        // Check if tag already exists in current tags
        if (currentTags.map(t => t.toLowerCase()).includes(normalized)) {
          return {
            name: normalized,
            isValid: false,
            message: "Tag already exists on this project",
            willBeSubmitted: false
          };
        }
        
        // Check if tag is already pending approval
        if (pendingTags.some(pt => pt.tag_name.toLowerCase() === normalized)) {
          return {
            name: normalized,
            isValid: false,
            message: "Tag already pending approval",
            willBeSubmitted: false
          };
        }

        // Mark which tags will be submitted based on remaining slots
        const willBeSubmitted = index < remainingTagSlots;

        // If valid but exceeds limit, add a note about submission status
        if (validation.isValid) {
          if (!willBeSubmitted) {
            return {
              name: normalized,
              isValid: true,
              willBeSubmitted: false,
              message: `Will not be submitted - exceeds the limit of ${MAX_PROJECT_TAGS} tags`,
            };
          }
          return {
            name: normalized,
            isValid: true,
            willBeSubmitted: true,
          };
        }

        return {
          name: normalized,
          isValid: false,
          message: validation.message,
          willBeSubmitted: false,
        };
      });

    const processedResults = await Promise.all(tagPromises);

    // Add a warning if some valid tags won't be submitted
    const validTags = processedResults.filter((tag) => tag.isValid);
    const willBeSubmitted = validTags.filter((tag) => tag.willBeSubmitted);
    const willNotBeSubmitted = validTags.filter((tag) => !tag.willBeSubmitted);

    if (willNotBeSubmitted.length > 0) {
      setTagError(
        `Only ${willBeSubmitted.length} tag(s) will be submitted to stay within the ${MAX_PROJECT_TAGS} tag limit`
      );
    } else {
      setTagError(
        processedResults.some((tag) => !tag.isValid)
          ? "Please fix invalid tags"
          : null
      );
    }

    setProcessedTags(processedResults);
    return !processedResults.some((tag) => !tag.isValid);
  };

  const removeInvalidTag = (tagName: string) => {
    // Prevent scroll jump by maintaining scroll position
    const scrollContainer = document.querySelector('[data-tag-validation-scroll]');
    const scrollPosition = scrollContainer?.scrollTop || 0;
    
    // Remove the tag from the input
    const tags = tagInput.split(",").map(t => t.trim()).filter(t => t);
    const updatedTags = tags.filter(t => t.toLowerCase() !== tagName.toLowerCase());
    const newInput = updatedTags.join(", ");
    setTagInput(newInput);
    
    // Remove the reason for this tag
    setTagReasons(prev => {
      const updated = { ...prev };
      delete updated[tagName];
      return updated;
    });
    
    // Reprocess the updated input
    if (newInput) {
      processTagInput(newInput);
    } else {
      setProcessedTags([]);
      setTagError(null);
    }
    
    // Restore scroll position after DOM update
    setTimeout(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPosition;
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be signed in to submit tags");
      return;
    }

    if (!email) {
      toast.error("Email is required");
      return;
    }

    const isValid = await processTagInput(tagInput);
    if (!isValid) return;

    // Check if all valid tags have reasons
    const validTags = processedTags.filter(
      (tag) => tag.isValid && tag.willBeSubmitted
    );

    const tagsWithoutReasons = validTags.filter(
      (tag) => !tagReasons[tag.name] || tagReasons[tag.name].trim() === ""
    );

    if (tagsWithoutReasons.length > 0) {
      toast.error(
        <div>
          <p className="font-semibold">Please add reasons for:</p>
          <ul className="list-disc pl-4 mt-1">
            {tagsWithoutReasons.map((tag) => (
              <li key={tag.name}>#{tag.name}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    setIsSubmitting(true);

    try{
      if (validTags.length === 0) {
        toast.error("No valid tags to submit");
        setIsSubmitting(false);
        return;
      }

      const results = [];
      const errors = [];
      const autoApproved = [];

      for (const tag of validTags) {
        try {
          const result = await submitNewTag(
            tag.name,
            projectData?.id || "",
            email,
            tagReasons[tag.name] || ""
          );
          if (result.status === "auto_approved") {
            autoApproved.push(tag.name);
          } else {
            results.push(result);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          errors.push(`${tag.name}: ${errorMessage}`);
          console.error(`Error submitting tag ${tag.name}:`, error);
        }
      }

      // If any tags were auto-approved, refresh the tag cache
      if (autoApproved.length > 0) {
        await refreshCache();
      }

      if (errors.length > 0) {
        // Show errors for failed submissions
        toast.error(
          <div>
            <p>Some tags could not be submitted:</p>
            <ul className="list-disc pl-4 mt-2">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        );
      }

      // Show message for auto-approved tags
      if (autoApproved.length > 0) {
        toast.success(
          `${autoApproved.join(", ")} ${
            autoApproved.length === 1 ? "has" : "have"
          } been automatically added to your project`
        );
      }

      // Show message for pending tags
      if (results.length > 0) {
        const message =
          results.length === 1
            ? "Tag submission received! Once approved, it will be automatically connected to this project."
            : `${results.length} tag submissions received! Once approved, they will be automatically connected to this project.`;
        toast.success(message);
      }

      // If any tags were processed successfully, navigate back
      if (results.length > 0 || autoApproved.length > 0) {
        router.push(`/projects/${projectSlug}`);
      }
    } catch (error) {
      console.error("Error in tag submission:", error);
      toast.error("Failed to submit tag(s). Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || isLoadingProject) {
    return null; // Loading state handled by loading.tsx
  }

  if (!user) {
    return (
      <SidebarProvider>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <SidebarInset>
          <SignedOut>
            <HeaderSectionNoSideBar showMobileMenu={false} />
          </SignedOut>
          <SignedIn>
            <HeaderSection />
          </SignedIn>
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="max-w-md w-full text-center space-y-4">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <h1 className="text-2xl font-bold">Sign In Required</h1>
              <p className="text-muted-foreground">
                You must be signed in to suggest tags for this project.
              </p>
              <Button onClick={() => router.push(`/projects/${projectSlug}`)}>
                Back to Project
              </Button>
            </div>
          </div>
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <SignedIn>
        <AppSidebar />
      </SignedIn>
      <SidebarInset>
        <SignedOut>
          <HeaderSectionNoSideBar showMobileMenu={false} />
        </SignedOut>
        <SignedIn>
          <HeaderSection />
        </SignedIn>

        {/* Page Banner */}
        <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 mb-0 py-3">
          <PageBanner
            icon={<TagIcon className="h-8 w-8 text-primary" />}
            bannerTitle="Suggest Tags for Your Project"
            description={
              <div>
                <p>Help categorize this project by suggesting relevant tags. Your suggestions will be reviewed before being added.</p>
                <p className="mt-2 text-xs">
                  <span className="font-semibold">Project:</span> {projectData?.title || "Loading..."} | 
                  <span className="font-semibold ml-2">Your Email:</span> {email || "Loading..."}
                </p>
              </div>
            }
            isUserBanner={false}
            gradientFrom="indigo-900"
            gradientVia="blue-800"
            gradientTo="purple-800"
            borderColor="border-indigo-700/40"
            textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
          />
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 py-8">
          <div className="container max-w-6xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Project
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Centered Tag Input at Top */}
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                      <TagIcon className="h-5 w-5" />
                      Enter Tag Names
                    </CardTitle>
                    <CardDescription className="text-center">
                      Separate multiple tags with commas (e.g., react, next-js, typescript)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      id="tag-name"
                      placeholder="e.g. react, next-js, typescript"
                      value={tagInput}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setTagInput(newValue);
                        if (!newValue) {
                          setProcessedTags([]);
                          setTagError(null);
                        } else if (newValue.includes(',')) {
                          // Validate immediately when comma is detected
                          processTagInput(newValue);
                        }
                      }}
                      onBlur={() => processTagInput(tagInput)}
                      required
                      autoFocus
                      className="text-base h-16 focus:ring-2 focus:ring-primary focus:border-primary"
                    />

                    {/* Badge Preview - Shows typed tags */}
                    {tagInput && tagInput.includes(',') && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md border border-border">
                          {tagInput.split(',').map((tag, idx) => {
                            const trimmed = tag.trim();
                            if (!trimmed) return null;
                            
                            // Find the corresponding processed tag to check validity
                            const processedTag = processedTags.find(pt => pt.name === trimmed.toLowerCase());
                            
                            // Only show valid tags in preview
                            if (processedTag && !processedTag.isValid) return null;
                            
                            return (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-sm font-mono px-2 py-1 max-w-full truncate"
                                title={trimmed}
                              >
                                #{trimmed}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Two Cards Side-by-Side Below */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left - Requirements Card */}
                <div className="lg:w-1/3">
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="h-5 w-5 text-warning flex-shrink-0" />
                        Requirements & Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tag Requirements */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">Tag Rules:</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>2-45 characters long</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>Lowercase letters, numbers, hyphens only</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>No spaces or special characters</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>Separate multiple tags with commas</span>
                          </li>
                        </ul>
                      </div>

                      {/* Auto-Approval Info */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-foreground">Existing Tags:</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>Tags already in the system are auto-approved</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span>If a pending tag gets approved for another user, it becomes available immediately</span>
                          </li>
                        </ul>
                      </div>

                      {/* Guidelines */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-foreground">Best Practices:</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-info mt-0.5">•</span>
                            <span>Use existing tags when possible</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-info mt-0.5">•</span>
                            <span>Choose descriptive, specific tags</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-info mt-0.5">•</span>
                            <span>Avoid duplicate or similar tags</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-info mt-0.5">•</span>
                            <span>Keep tags relevant to the project</span>
                          </li>
                        </ul>
                      </div>

                      {/* Submission Info */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-foreground">Submission:</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">•</span>
                            <span>New tags require approval</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">•</span>
                            <span>Invalid tags will be auto-rejected</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">•</span>
                            <span className="font-semibold">A reason is required for each tag needing approval</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">•</span>
                            <span>Check your dashboard for pending, approved, or rejected tags</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right - Tag Validation Card */}
                <div className="lg:w-2/3">
                  <Card className="h-full border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Tag Validation
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-sm font-bold px-3 py-1">
                            <span className={remainingTagSlots > 0 ? 'text-success' : 'text-destructive'}>
                              ({currentTagCount}/{MAX_PROJECT_TAGS}) Tags
                            </span>
                          </Badge>
                          {pendingTags.length > 0 && (
                            <Badge variant="outline" className="text-sm font-bold px-3 py-1 border-warning text-warning">
                             ({pendingTags.length}) Pending Approval
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div 
                        data-tag-validation-scroll
                        className="h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50"
                      >
                          {/* Validation Results */}
                          {processedTags.length > 0 ? (
                            <div className="space-y-3">
                              {processedTags.map((tag, index) => {
                                const hasReason = tagReasons[tag.name] && tagReasons[tag.name].trim() !== "";
                                const isReadyToSubmit = tag.isValid && tag.willBeSubmitted && hasReason;
                                const needsReason = tag.isValid && tag.willBeSubmitted && !hasReason;
                                
                                return (
                                  <div key={index} className="space-y-2">
                                    <div
                                      className={`flex items-center justify-between gap-3 p-3 rounded-md border-2 ${
                                        isReadyToSubmit
                                          ? "bg-success/20 border-success"
                                          : needsReason
                                          ? "bg-warning/20 border-warning"
                                          : !tag.isValid
                                          ? "bg-destructive/20 border-destructive"
                                          : "bg-warning/20 border-warning"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                        {isReadyToSubmit ? (
                                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                                        ) : (
                                          <AlertCircle className={`h-5 w-5 flex-shrink-0 ${!tag.isValid ? 'text-destructive' : 'text-warning'}`} />
                                        )}
                                        <p className={`font-mono font-bold text-sm truncate ${
                                          isReadyToSubmit
                                            ? "text-success"
                                            : needsReason
                                            ? "text-warning"
                                            : !tag.isValid
                                            ? "text-destructive"
                                            : "text-warning"
                                        }`}>
                                          #{tag.name}
                                        </p>
                                        {isReadyToSubmit && (
                                          <span className="text-xs text-success ml-2 flex-shrink-0">✓ Ready to submit</span>
                                        )}
                                        {needsReason && (
                                          <span className="text-xs text-warning ml-2 flex-shrink-0">Reason required</span>
                                        )}
                                      </div>
                                      {(!tag.isValid || !tag.willBeSubmitted) && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeInvalidTag(tag.name)}
                                          className="flex-shrink-0 h-auto py-1 px-3 text-destructive hover:text-destructive hover:bg-destructive/20 border-destructive cursor-pointer"
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          REMOVE
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {/* Show error message for invalid tags */}
                                    {!tag.isValid && tag.message && (
                                      <p className="text-xs text-destructive ml-10">
                                        {tag.message}
                                      </p>
                                    )}
                                    
                                    {/* Show warning message for valid but not submittable tags */}
                                    {tag.isValid && !tag.willBeSubmitted && tag.message && (
                                      <p className="text-xs text-warning ml-10">
                                        {tag.message}
                                      </p>
                                    )}
                                    
                                    {/* Reason input for valid tags that will be submitted */}
                                    {tag.isValid && tag.willBeSubmitted && (
                                      <div className="ml-10 space-y-1">
                                        <label htmlFor={`reason-${tag.name}`} className="text-xs font-medium text-muted-foreground">
                                          Reason for approval: <span className="text-destructive">*</span>
                                        </label>
                                        <Textarea
                                          id={`reason-${tag.name}`}
                                          placeholder={`Why should #${tag.name} be approved?`}
                                          value={tagReasons[tag.name] || ""}
                                          onChange={(e) => {
                                            setTagReasons(prev => ({
                                              ...prev,
                                              [tag.name]: e.target.value
                                            }));
                                          }}
                                          className="text-sm min-h-[80px] resize-none"
                                          rows={3}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Empty State */
                            <div className="flex items-center justify-center h-full">
                              <p className="text-sm text-muted-foreground text-center px-4">
                                Enter tags above separated by commas to see validation results
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center mt-4 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isSubmitting || !!tagError || processedTags.filter(t => t.isValid && t.willBeSubmitted).length === 0}
                            className="w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="animate-pulse">Submitting...</span>
                              </>
                            ) : (
                              <>Submit {processedTags.filter(t => t.isValid && t.willBeSubmitted).length > 0 && `(${processedTags.filter(t => t.isValid && t.willBeSubmitted).length})`}</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
            </form>
          </div>
        </div>

        <FooterSection />
      </SidebarInset>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onConfirm={handleConfirmDiscardChanges}
      />
    </SidebarProvider>
  );
}
