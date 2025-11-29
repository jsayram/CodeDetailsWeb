"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_CATEGORIES,
  ProjectCategory,
} from "@/constants/project-categories";
import { PROJECT_TEXT_LIMITS } from "@/constants/project-limits";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Calendar,
  User,
  Clock,
  Tags,
  ArrowLeft,
  Edit,
  Eye,
  RefreshCcwIcon,
} from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { Separator } from "@/components/ui/separator";
import { SelectProject } from "@/db/schema/projects";
import { validateUrlFormat } from "@/lib/url-validation";
import { toast } from "sonner";
import { useUser, useAuth, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createProject, updateProject } from "@/app/actions/projects";
import { approveRejectedTagSubmission } from "@/app/actions/tag-submissions";
import { TagSelector } from "./TagSelectorComponent";
import { TagInfo } from "@/db/operations/tag-operations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { slugify } from "@/utils/stringUtils";
import { ProjectTagSubmissionButton } from "./ProjectTagSubmissionButton";
import { useProjectTagSubmissions } from "@/hooks/use-project-tag-submissions";
import { ProjectLinksManager } from "./ProjectLinksManager";
import { ProjectLinksDisplay } from "./ProjectLinksDisplay";
import { ProjectLink } from "@/types/project-links";
import { UnsavedChangesConfirmationModal } from "./UnsavedChangesConfirmationModal";
import { SelectProjectWithOwner } from "@/db/schema/projects";

interface UserProfile extends SelectProject {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  tier: string;
  email_address: string;
  created_at: Date;
  updated_at: Date;
}

interface ProjectContentProps {
  project: SelectProjectWithOwner | null;
  error?: string;
  userProfile?: UserProfile | null;
  create?: boolean;
}

export function ProjectContent({
  project,
  error,
  userProfile,
  create = false,
}: ProjectContentProps): React.ReactElement {
  const { user } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [isNavigatingUser, setIsNavigatingUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNavigatingAfterSave, setIsNavigatingAfterSave] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category: "web" as ProjectCategory,
    url_links: [] as ProjectLink[],
  });
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
    slug?: string;
  }>({});

  // Track original values for change detection
  const [originalFormData, setOriginalFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category: "web" as ProjectCategory,
    url_links: [] as ProjectLink[],
  });
  const [originalTags, setOriginalTags] = useState<TagInfo[]>([]);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Tag submissions for the project
  const {
    pendingTags,
    refreshPendingTags,
    isLoading: isLoadingPendingTags,
  } = useProjectTagSubmissions(project?.id || "");

  // Refs
  const formInitializedRef = useRef(false);
  const projectIdRef = useRef<string | null>(null);

  // Derived state with proper memoization
  const isOwner = useMemo(() => {
    return !!userId && !!userProfile?.user_id && userId === userProfile.user_id;
  }, [userId, userProfile?.user_id]);

  // Handle edit mode with useMemo to prevent unnecessary re-renders
  const isEditMode = useMemo(() => {
    // Always in edit mode if creating a new project
    if (create) return true;

    // Otherwise check URL parameter
    const shouldEdit = searchParams?.get("edit") === "true";
    return shouldEdit && isOwner;
  }, [searchParams, isOwner, create]);

  // Form field change handlers - memoized to maintain stable references
  const handleFieldChange = useCallback(
    <T extends keyof typeof formData>(
      field: T,
      value: (typeof formData)[T]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear validation error when field changes (only for error fields)
      if (field in formErrors) {
        setFormErrors((prev) => ({ ...prev, [field as keyof typeof formErrors]: undefined }));
      }
    },
    [formErrors]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      handleFieldChange("category", value as ProjectCategory);
    },
    [handleFieldChange]
  );

  // Handle tag changes with useCallback to maintain stable reference
  const handleTagsChange = useCallback((tags: TagInfo[]) => {
    setSelectedTags(tags);
  }, []);

  // Handle url_links changes
  const handleLinksChange = useCallback((links: ProjectLink[]) => {
    setFormData((prev) => ({ ...prev, url_links: links }));
  }, []);

  // Reset form state and initialize from project data when entering edit mode
  useEffect(() => {
    if (!project) return;

    // Check if this is a new project load
    const isNewProject = project.id !== projectIdRef.current;
    
    if (isEditMode) {
      // ALWAYS reinitialize when entering edit mode to ensure fresh data
      // This fixes the issue where links don't show up after being idle
      const initialFormData = {
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        category: (project.category as ProjectCategory) || "web",
        url_links: (project.url_links as ProjectLink[]) || [],
      };
      
      setFormData(initialFormData);
      setOriginalFormData(initialFormData);

      // Set tags
      const initialTags = project.tags && project.tags.length > 0
        ? project.tags.map((name) => ({
            id: `tag-${name}`, // Add unique ID to prevent React key warnings
            name,
          }))
        : [];
      setSelectedTags(initialTags);
      setOriginalTags(initialTags);

      // Reset form errors
      setFormErrors({});

      // Mark as initialized and store project ID
      formInitializedRef.current = true;
      projectIdRef.current = project.id;
    } else {
      // Reset initialization flag when exiting edit mode
      formInitializedRef.current = false;
    }
  }, [project, isEditMode]);

  // Handle tag query parameter - auto-populate tag from URL
  useEffect(() => {
    if (!isEditMode) return;
    
    const tagFromUrl = searchParams?.get("tag");
    if (!tagFromUrl) return;

    // Check if tag already exists in selected tags
    const tagExists = selectedTags.some(
      (tag) => tag.name.toLowerCase() === tagFromUrl.toLowerCase()
    );

    if (!tagExists) {
      // Add the tag from URL to selected tags
      const newTag: TagInfo = {
        id: `tag-${tagFromUrl}`,
        name: tagFromUrl,
      };
      
      setSelectedTags((prev) => [...prev, newTag]);
      
      // Show a toast to inform the user
      toast.info(`Tag "${tagFromUrl}" has been added to the tag field`, {
        description: "You can save the project to save the tag to your project, or cancel the edit to discard.",
      });
    }
  }, [isEditMode, searchParams, selectedTags]);

  const generateSlug = useCallback(() => {
    if (formData.title) {
      const newSlug = slugify(formData.title);
      handleFieldChange("slug", newSlug);
    }
  }, [formData.title, handleFieldChange]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Check if any form fields changed
    const formChanged = 
      formData.title !== originalFormData.title ||
      formData.slug !== originalFormData.slug ||
      formData.description !== originalFormData.description ||
      formData.category !== originalFormData.category;

    // Check if tags changed
    const tagsChanged = 
      selectedTags.length !== originalTags.length ||
      selectedTags.some((tag, index) => tag.name !== originalTags[index]?.name);

    // Check if url_links changed
    const linksChanged = 
      formData.url_links.length !== originalFormData.url_links.length ||
      formData.url_links.some((link, index) => {
        const originalLink = originalFormData.url_links[index];
        return !originalLink || 
               link.url !== originalLink.url || 
               link.type !== originalLink.type ||
               link.label !== originalLink.label;
      });

    return formChanged || tagsChanged || linksChanged;
  }, [formData, originalFormData, selectedTags, originalTags]);

  // Handler for confirming discard of unsaved changes
  const handleConfirmDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    
    // Reset form data to original project values
    if (project) {
      setFormData({
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        category: (project.category as ProjectCategory) || "web",
        url_links: (project.url_links as ProjectLink[]) || [],
      });

      // Reset tags
      if (project.tags && project.tags.length > 0) {
        setSelectedTags(
          project.tags.map((name) => ({
            id: `tag-${name}`,
            name,
          }))
        );
      } else {
        setSelectedTags([]);
      }

      // Reset form errors
      setFormErrors({});
    }

    // Exit edit mode
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    url.searchParams.delete("tag");
    router.replace(url.pathname + url.search, {
      scroll: false,
    });
  }, [project, router]);

  const handleEditModeToggle = useCallback(() => {
    // Don't allow toggling out of edit mode in create mode
    if (create) return;

    const url = new URL(window.location.href);
    const currentEditMode = searchParams?.get("edit") === "true";

    if (!currentEditMode) {
      url.searchParams.set("edit", "true");
    } else {
      // Check for unsaved changes before canceling
      if (hasUnsavedChanges()) {
        setShowUnsavedChangesModal(true);
        return; // Show modal, don't proceed yet
      }

      // When exiting edit mode (Cancel), reset form data to original project values
      if (project) {
        setFormData({
          title: project.title || "",
          slug: project.slug || "",
          description: project.description || "",
          category: (project.category as ProjectCategory) || "web",
          url_links: (project.url_links as ProjectLink[]) || [],
        });

        // Reset tags
        if (project.tags && project.tags.length > 0) {
          setSelectedTags(
            project.tags.map((name) => ({
              id: `tag-${name}`,
              name,
            }))
          );
        } else {
          setSelectedTags([]);
        }

        // Reset form errors
        setFormErrors({});
      }

      url.searchParams.delete("edit");
      // Remove tag parameter when exiting edit mode
      url.searchParams.delete("tag");
    }

    router.replace(url.pathname + url.search, {
      scroll: false,
    });
  }, [searchParams, router, create, project, hasUnsavedChanges]);

  // Check if we have a valid username to navigate to (handle orphaned projects)
  const navigableUsername = userProfile?.username || project?.owner_username;
  const canNavigateToUser = !!navigableUsername;

  const handleNavigateUser = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>You have to be logged in to view user profiles silly goose</p>
        </div>
      );
      return;
    }
    if (isNavigatingUser || !canNavigateToUser || !navigableUsername) return;
    setIsNavigatingUser(true);
    router.push(`/users/${encodeURIComponent(navigableUsername)}`);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validate title
    if (!formData.title.trim() || formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    // Validate slug
    if (!formData.slug.trim()) {
      errors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    // Validate url_links - check for empty URLs and invalid formats
    const hasEmptyLinks = formData.url_links.some(link => !link.url || link.url.trim() === '' || link.url === 'https://');
    if (hasEmptyLinks) {
      toast.error("Please fill in all link URLs or remove empty links before saving");
      // Trigger highlighting of empty URL fields
      window.dispatchEvent(new Event('highlight-empty-links'));
      setIsUpdating(false);
      return false;
    }

    // Check for invalid URL formats
    const invalidLinks = formData.url_links.filter(link => {
      const formatResult = validateUrlFormat(link.url);
      return !formatResult.valid;
    });
    
    if (invalidLinks.length > 0) {
      toast.error("Some links have invalid URL format", {
        description: "Please fix the URL format or use the 'Fix URL' button before saving",
        duration: 5000,
      });
      // Trigger highlighting of invalid URL fields
      window.dispatchEvent(new Event('highlight-invalid-links'));
      setIsUpdating(false);
      return false;
    }

    // Warn about unreachable links but don't block saving
    const unreachableLinks = formData.url_links.filter(link => link.reachable === false);
    if (unreachableLinks.length > 0) {
      toast.warning(`${unreachableLinks.length} unreachable link(s) will not be displayed on your project`, {
        description: "Fix and re-verify them or they won't appear to visitors",
        duration: 5000,
      });
    }

    // Update errors state
    setFormErrors(errors);

    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      if (!userId) throw new Error("You must be logged in to update a project");

      // Re-validate all URLs before saving (in case state changed)
      const hasInvalidUrls = formData.url_links.some(link => {
        if (!link.url || link.url.trim() === '') return true;
        const formatResult = validateUrlFormat(link.url);
        return !formatResult.valid;
      });

      if (hasInvalidUrls) {
        toast.error("Cannot save: Some links have invalid URL format", {
          description: "Please fix all URL formats or remove invalid links before saving",
          duration: 5000,
        });
        setIsUpdating(false);
        return;
      }

      // Validate the form
      if (!validateForm()) {
        setIsUpdating(false);
        return;
      }

      // Filter out unreachable links and invalid formats - only save verified reachable links with valid formats
      const validLinks = formData.url_links.filter(link => {
        // Must be reachable (not explicitly marked as unreachable)
        if (link.reachable === false) return false;
        
        // Must have valid URL format
        const formatResult = validateUrlFormat(link.url);
        return formatResult.valid;
      });

      const projectData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        tags: selectedTags.map((tag) => tag.name),
        url_links: validLinks,
      };

      console.log('ProjectContent sending data:', JSON.stringify(projectData, null, 2));

      let result;

      if (create) {
        // Create new project
        result = await createProject(projectData, userId);
        if (result.success) {
          toast.success("Project created successfully!");
          // Navigate to the new project if we have a slug
          setIsNavigatingAfterSave(true);
          if (result.data?.slug) {
            router.push(`/projects/${result.data.slug}`);
          } else {
            // Fallback to projects list if no slug is available
            router.push("/projects");
          }
        }
      } else {
        // Update existing project
        if (!project?.id) throw new Error("Project ID is missing");
        result = await updateProject(project.id, projectData, userId);
        if (result.success) {
          toast.success("Project updated successfully!");

          // Check if there was a tag from URL that was added
          const tagFromUrl = searchParams?.get("tag");
          if (tagFromUrl && user?.primaryEmailAddress?.emailAddress) {
            // Check if the tag from URL is in the saved tags
            const tagWasAdded = projectData.tags.some(
              (tag) => tag.toLowerCase() === tagFromUrl.toLowerCase()
            );
            
            if (tagWasAdded) {
              // Approve the rejected tag submission
              try {
                await approveRejectedTagSubmission(
                  project.id,
                  tagFromUrl,
                  user.primaryEmailAddress.emailAddress
                );
              } catch (error) {
                console.error("Failed to approve rejected tag submission:", error);
                // Don't throw - project was saved successfully
              }
            }
          }

          // Reset form initialization state
          formInitializedRef.current = false;

          // Exit edit mode
          const url = new URL(window.location.href);
          url.searchParams.delete("edit");
          url.searchParams.delete("tag");

          // If slug changed, navigate to new URL
          if (result.data && result.data.slug !== project.slug) {
            setIsNavigatingAfterSave(true);
            router.push(`/projects/${result.data.slug}`);
          } else {
            // If slug didn't change, just remove the edit parameter
            router.replace(url.pathname + url.search, { scroll: false });
            router.refresh();
          }
        }
      }

      if (!result.success) {
        // Parse validation errors and set form field errors
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          const newFormErrors: typeof formErrors = {};
          result.validationErrors.forEach((err: { field: string; message: string }) => {
            if (err.field === 'title') newFormErrors.title = err.message;
            if (err.field === 'description') newFormErrors.description = err.message;
            if (err.field === 'category') newFormErrors.category = err.message;
            if (err.field === 'slug') newFormErrors.slug = err.message;
          });
          setFormErrors(newFormErrors);
        }
        // Show error toast but don't throw - fail gracefully
        toast.error(result.error || "Failed to save project");
        return;
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save project"
      );
    } finally {
      if (!isNavigatingAfterSave) {
        setIsUpdating(false);
      }
    }
  };

  const handleCancel = () => {
    if (create) {
      // When in create mode, navigate back to projects page
      router.push("/projects");
    } else {
      // In edit mode, just toggle back to view mode
      handleEditModeToggle();
    }
  };

  // Only show error if project is missing or there's an explicit error
  // userProfile can be null for orphaned projects (deleted users)
  if (!project || error) {
    return (
      <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Error
              </h2>
              <p className="text-muted-foreground">
                {error || "Project not found"}
              </p>
              <p className="text-muted-foreground">
                Please check the URL or sign in to view the project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle display name for orphaned projects (no userProfile)
  const displayName =
    userProfile?.full_name ||
    userProfile?.username?.split("@")[0] ||
    project.owner_full_name ||
    project.owner_username?.split("@")[0] ||
    "Unknown User";

  const renderContent = () => (
    <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 py-8">
      <div className="flex items-row justify-between mb-4">
      {!create && (
        <div className="flex items-between gap-2">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditModeToggle}
              className="flex items-center gap-2 hover:cursor-pointer"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  View Mode
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Project
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-5">
        <Badge variant="secondary" className="capitalize">
          {PROJECT_CATEGORIES[
            project.category as keyof typeof PROJECT_CATEGORIES
          ]?.label || project.category}
        </Badge>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Heart className="h-5 w-5" />
          <span>{project.total_favorites || 0}</span>
        </div>
      </div>
      </div>
      {/* Profile Header Section */}
      <div className="mb-6 bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-col gap-6">
          {!create && (
            <button
              onClick={handleNavigateUser}
              disabled={isNavigatingUser}
              className={`relative ${
                isNavigatingUser
                  ? "cursor-wait"
                  : "cursor-pointer hover:opacity-80 transition-opacity"
              }`}
              aria-label="View user profile"
            >
              <Avatar className="h-24 w-24 border-4 border-background">
                {(userProfile?.profile_image_url || project.owner_profile_image_url) ? (
                  <AvatarImage
                    src={userProfile?.profile_image_url || project.owner_profile_image_url || ""}
                    alt={displayName}
                  />
                ) : (
                  <AvatarFallback className="text-2xl">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              {isNavigatingUser && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-col justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {create ? "Create New Project" : project.title}
                </h1>
                {!create && (
                  canNavigateToUser ? (
                    <button
                      onClick={handleNavigateUser}
                      disabled={isNavigatingUser}
                      className={`text-muted-foreground ${
                        isNavigatingUser
                          ? "cursor-wait opacity-70"
                          : "hover:text-primary hover:underline cursor-pointer"
                      }`}
                    >
                      by {displayName}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">
                      by {displayName}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div
          className={`${create ? "md:col-span-3" : "md:col-span-2"} space-y-6`}
        >
          {isEditMode ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {create ? "Create New Project" : "Edit Project"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    maxLength={PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH}
                    className={formErrors?.title ? "border-red-500" : ""}
                  />
                  <div className="flex justify-between text-xs">
                    {formErrors?.title ? (
                      <p className="text-red-500">{formErrors.title}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-muted-foreground">
                      {formData.title.length}/{PROJECT_TEXT_LIMITS.MAX_TITLE_LENGTH}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="slug" className="text-sm font-medium">
                    Slug (URL-friendly identifier){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        handleFieldChange("slug", e.target.value)
                      }
                      maxLength={PROJECT_TEXT_LIMITS.MAX_SLUG_LENGTH}
                      className={`flex-1 ${
                        formErrors?.slug ? "border-red-500" : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      title="Generate slug from title"
                    >
                      <RefreshCcwIcon className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                  {formErrors?.slug && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.slug}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Project Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_CATEGORIES).map(
                        ([value, { label }]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    maxLength={PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH}
                    rows={5}
                    className="resize-none"
                  />
                  <div className="flex justify-end text-xs text-muted-foreground">
                    {formData.description.length}/{PROJECT_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <TagSelector
                    projectId={create ? undefined : project?.id}
                    initialTags={selectedTags.map((tag) => tag.name)}
                    onTagsChange={handleTagsChange}
                    className="w-full"
                    isOwner={isOwner}
                  />
                </div>

                {/* Project Links Manager */}
                <ProjectLinksManager
                  key={`links-${isEditMode}-${project.id}`}
                  initialLinks={formData.url_links}
                  onChange={handleLinksChange}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={isUpdating} className="cursor-pointer">
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        {create ? "Creating..." : "Saving..."}
                      </div>
                    ) : create ? (
                      "Create Project"
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Project Links Display - show if links exist */}
              {project.url_links && (project.url_links as ProjectLink[]).length > 0 && (
                <ProjectLinksDisplay links={project.url_links as ProjectLink[]} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>About This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg">
                      {project.description || "No description provided"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-muted-foreground">
                          {project.created_at && (
                            <FormattedDate date={project.created_at} />
                          )}
                          {!project.created_at && (
                            <span>No date available</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {project.updated_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-muted-foreground">
                            <FormattedDate date={project.updated_at} />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar - only show in view/edit mode, not in create mode */}
        {!create && (
          <div className="space-y-6">
            {/* Tags Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    <CardTitle>Tags</CardTitle>
                  </div>

                  {/* Add the tag suggestion button here if not in edit mode and user is the owner */}
                  {!isEditMode && !create && isOwner && (
                    <ProjectTagSubmissionButton
                      projectId={project.id || ""}
                      projectTitle={project.title}
                      currentTags={project.tags || []}
                      pendingTags={pendingTags}
                      onSubmit={refreshPendingTags}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditMode ? (
                  <>
                    {project.tags && project.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mb-3">
                        No tags added yet
                      </p>
                    )}

                    {/* Display pending tag submissions */}
                    {pendingTags && pendingTags.length > 0 && (
                      <div className="mt-4">
                        <div className="rounded-md bg-muted/50 p-3 space-y-2">
                          <p className="text-sm font-medium">
                            Pending Tag Submissions:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {pendingTags.map((submission) => (
                              <span
                                key={submission.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              >
                                {submission.tag_name}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            These tags will appear on the project once approved.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-muted-foreground">
                      {PROJECT_CATEGORIES[
                        project.category as keyof typeof PROJECT_CATEGORIES
                      ]?.description || project.category}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Engagement</p>
                    <p className="text-muted-foreground">
                      {project.total_favorites || 0} favorites
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onConfirm={handleConfirmDiscardChanges}
      />
    </div>
  );

  return renderContent();
}
