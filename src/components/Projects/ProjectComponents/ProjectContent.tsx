"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Calendar, User, Clock, Tags, ArrowLeft, Edit, Eye, RefreshCcwIcon } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { Separator } from "@/components/ui/separator";
import { SelectProject } from "@/db/schema/projects";
import { toast } from "sonner";
import { useUser, useAuth, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { updateProject } from "@/app/actions/projects";
import { TagSelector } from "./TagSelectorComponent";
import { TagInfo } from "@/db/operations/tag-operations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { slugify } from "@/utils/stringUtils";

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
  project: SelectProject | null;
  error?: string;
  userProfile?: UserProfile | null;
}

export function ProjectContent({
  project,
  error,
  userProfile,
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
  });
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string; category?: string; slug?: string }>({});

  // Refs
  const formInitializedRef = useRef(false);
  const projectIdRef = useRef<string | null>(null);
  
  // Derived state with proper memoization
  const isOwner = useMemo(() => {
    return !!userId && 
      !!userProfile?.user_id && 
      userId === userProfile.user_id;
  }, [userId, userProfile?.user_id]);

  // Handle edit mode with useMemo to prevent unnecessary re-renders
  const isEditMode = useMemo(() => {
    const shouldEdit = searchParams?.get('edit') === 'true';
    return shouldEdit && isOwner;
  }, [searchParams, isOwner]);

  // Form field change handlers - memoized to maintain stable references
  const handleFieldChange = useCallback(<T extends keyof typeof formData>(field: T, value: typeof formData[T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when field changes
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  const handleCategoryChange = useCallback((value: string) => {
    handleFieldChange('category', value as ProjectCategory);
  }, [handleFieldChange]);

  // Handle tag changes with useCallback to maintain stable reference
  const handleTagsChange = useCallback((tags: TagInfo[]) => {
    setSelectedTags(tags);
  }, []);

  // Reset form state and initialize from project data when entering edit mode
  useEffect(() => {
    if (!project) return;
    
    // Check if this is a new project load or edit mode changed
    const isNewProject = project.id !== projectIdRef.current;
    const shouldInitializeForm = isEditMode && (isNewProject || !formInitializedRef.current);
    
    if (shouldInitializeForm) {
      // Set form data from project
      setFormData({
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        category: (project.category as ProjectCategory) || "web",
      });

      // Set tags
      if (project.tags && project.tags.length > 0) {
        setSelectedTags(project.tags.map(name => ({ 
          id: `tag-${name}`, // Add unique ID to prevent React key warnings
          name 
        })));
      } else {
        setSelectedTags([]);
      }
      
      // Reset form errors
      setFormErrors({});
      
      // Mark as initialized and store project ID
      formInitializedRef.current = true;
      projectIdRef.current = project.id;
    } else if (!isEditMode) {
      // Reset initialization flag when exiting edit mode
      formInitializedRef.current = false;
    }
  }, [project, isEditMode]);

  const generateSlug = useCallback(() => {
    if (formData.title) {
      const newSlug = slugify(formData.title);
      handleFieldChange('slug', newSlug);
    }
  }, [formData.title, handleFieldChange]);

  const handleEditModeToggle = useCallback(() => {
    const url = new URL(window.location.href);
    const currentEditMode = searchParams?.get('edit') === 'true';
    
    if (!currentEditMode) {
      url.searchParams.set('edit', 'true');
    } else {
      url.searchParams.delete('edit');
    }
    
    router.replace(url.pathname + url.search, { 
      scroll: false,
    });
  }, [searchParams, router]);

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
    if (isNavigatingUser || !userProfile?.username) return;
    setIsNavigatingUser(true);
    router.push(`/users/${encodeURIComponent(userProfile.username)}`);
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      if (!project?.id) throw new Error("Project ID is missing");
      if (!userId) throw new Error("You must be logged in to update a project");

      // Validate title and slug
      if (!formData.title.trim() || formData.title.length < 3) {
        setFormErrors(prev => ({ ...prev, title: "Title must be at least 3 characters" }));
        setIsUpdating(false);
        return;
      }

      if (!formData.slug.trim()) {
        setFormErrors(prev => ({ ...prev, slug: "Slug is required" }));
        setIsUpdating(false);
        return;
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
        setFormErrors(prev => ({ ...prev, slug: "Slug must contain only lowercase letters, numbers, and hyphens" }));
        setIsUpdating(false);
        return;
      }

      const projectData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        tags: selectedTags.map(tag => tag.name)
      };

      const result = await updateProject(project.id, projectData, userId);
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Project updated successfully!");
      
      // Reset form initialization state
      formInitializedRef.current = false;
      
      // Exit edit mode
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      
      // If slug changed, navigate to new URL
      if (result.data && result.data.slug !== project.slug) {
        setIsNavigatingAfterSave(true);
        router.push(`/projects/${result.data.slug}`);
      } else {
        // If slug didn't change, just remove the edit parameter
        router.replace(url.pathname + url.search, { scroll: false });
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    } finally {
      if (!isNavigatingAfterSave) {
        setIsUpdating(false);
      }
    }
  };

  if (!project || !userProfile || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "Project not found"}</p>
              <p className="text-muted-foreground">
                Please check the URL or sign in to view the project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = userProfile?.full_name || userProfile?.username.split("@")[0] || "Anonymous User";

  const renderContent = () => (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header Section */}
      <div className="mb-6 bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-start gap-6">
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
              {userProfile?.profile_image_url ? (
                <AvatarImage src={userProfile.profile_image_url} alt={displayName} />
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
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
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
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditModeToggle}
                    className="flex items-center gap-2"
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {PROJECT_CATEGORIES[project.category as keyof typeof PROJECT_CATEGORIES]?.label || project.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-5 w-5" />
                    <span>{project.total_favorites || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {isEditMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className={formErrors?.title ? "border-red-500" : ""}
                  />
                  {formErrors?.title && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="slug" className="text-sm font-medium">
                    Slug (URL-friendly identifier) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      className={`flex-1 ${formErrors?.slug ? "border-red-500" : ""}`}
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
                    <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
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
                      {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
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
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <TagSelector
                    projectId={project?.id}
                    initialTags={selectedTags.map(tag => tag.name)}
                    onTagsChange={handleTagsChange}
                    className="w-full"
                    isOwner={isOwner}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEditModeToggle}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
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
                          {project.created_at && <FormattedDate date={project.created_at} />}
                          {!project.created_at && <span>No date available</span>}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                <CardTitle>Tags</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!isEditMode ? (
                project.tags && project.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No tags added</p>
                )
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
                    {PROJECT_CATEGORIES[project.category as keyof typeof PROJECT_CATEGORIES]?.description || project.category}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Engagement</p>
                  <p className="text-muted-foreground">{project.total_favorites || 0} favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return renderContent();
}
