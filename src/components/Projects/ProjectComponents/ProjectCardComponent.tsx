"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Project } from "@/types/models/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Heart,
  Trash2,
  Edit,
  User,
  Undo2,
  Share2,
  ImageIcon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  permanentlyDeleteProject,
  restoreProject,
} from "@/app/actions/projects";
import { toast } from "sonner";
import { PermanentDeleteConfirmationModal } from "./PermanentDeleteConfirmationModal";
import { RestoreProjectConfirmationModal } from "./RestoreProjectConfirmationModal";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { getInitials } from "@/utils/stringUtils";
import { FavoriteButton } from "./FavoriteButton";
import Image from "next/image";
import { API_ROUTES } from "@/constants/api-routes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
  isFavorite?: boolean;
  hideActions?: boolean;
}

export const ProjectCard = React.memo(
  function ProjectCard({
    project,
    onViewDetails,
    onToggleFavorite,
    onDeleteProject,
    onUpdateProject,
    isFavorite = false,
    hideActions = false,
  }: ProjectCardProps) {
    const { user } = useUser();
    const { userId } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] =
      useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [loadingTag, setLoadingTag] = useState<string | null>(null);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [isNavigatingUser, setIsNavigatingUser] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if current user is the owner
    const isOwner = project.user_id === userId;

    useEffect(() => {
      const checkScreenSize = () => {
        setIsMobile(window.innerWidth < 400);
      };

      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // This is the number of tags that will be shown on the card
    // If there are more than this number of tags, a "+N" button will be displayed
    let tagShowLimitOnCard = 3;
    if (isMobile) {
      tagShowLimitOnCard = 2;
    }

    // Handle permanent deletion
    const handlePermanentDelete = async (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      setShowPermanentDeleteModal(true);
    };

    const handlePermanentDeleteConfirm = async () => {
      if (!userId || !isOwner) return;
      setIsDeleting(true);

      try {
        const result = await permanentlyDeleteProject(project.id, userId);
        setShowPermanentDeleteModal(false);

        if (result.success) {
          // Remove from current list immediately
          if (onDeleteProject) {
            onDeleteProject(project.id, true);
          }
          toast.dismiss();
          toast.success(
            <div className="relative flex flex-row items-center gap-2">
              <Image
                src="/images/mascot.png"
                alt="Code Minion"
                width={50}
                height={50}
                className="relative rounded-md"
              />
              <p>Project permanently deleted!</p>
            </div>
          );
        } else {
          toast.dismiss();
          toast.error(
            <div className="relative flex flex-row items-center gap-2">
              <Image
                src="/images/mascot.png"
                alt="Code Minion"
                width={50}
                height={50}
                className="relative rounded-md"
              />
              <p>{result.error || "Failed to delete project permanently"}</p>
            </div>
          );
        }
      } catch (error) {
        console.error("Error permanently deleting project:", error);
        toast.error("An error occurred while deleting the project");
      } finally {
        setIsDeleting(false);
      }
    };

    // Handle restoration
    const handleRestore = async (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      setShowRestoreModal(true);
    };

    const handleRestoreConfirm = async () => {
      if (!userId || !isOwner) return;
      setIsRestoring(true);

      try {
        const result = await restoreProject(project.id, userId);
        setShowRestoreModal(false);

        if (result.success) {
          // Remove from current list immediately
          if (onDeleteProject) {
            onDeleteProject(project.id, true);
          }
          toast.dismiss();
          toast.success(
            <div className="relative flex flex-row items-center gap-2">
              <Image
                src="/images/mascot.png"
                alt="Code Details Mascot"
                width={50}
                height={50}
                className="relative rounded-md"
              />
              <p>Project restored successfully </p>
            </div>
          );
        } else {
          toast.error(result.error || "Failed to restore project");
        }
      } catch (error) {
        console.error("Error restoring project:", error);
        toast.error("An error occurred while restoring the project");
      } finally {
        setIsRestoring(false);
      }
    };

    // Handle delete button click
    const handleDeleteClick = (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.stopPropagation();
      if (onDeleteProject) {
        onDeleteProject(project.id, false);
      }
    };

    // Safely handle tags array (could be undefined or null after migration)
    const tags = useMemo(() => {
      return project.tags || [];
    }, [project.tags]);

    // Check if the current user is the project owner
    const isCurrentUserProject = useMemo(() => {
      return user?.id === project.user_id;
    }, [user?.id, project.user_id]);

    // Display username logic
    const displayUsername = useMemo(() => {
      // First try full name
      if (project.profile?.full_name) {
        return project.profile.full_name;
      }

      // Then try to combine first and last name if either exists
      if (project.profile?.first_name || project.profile?.last_name) {
        return [project.profile.first_name, project.profile.last_name]
          .filter(Boolean) // Remove null/undefined values
          .join(" ")
          .trim();
      }

      // Fall back to username or email
      return (
        project.profile?.username?.split("@")[0] ||
        project.profile?.email_address?.split("@")[0] ||
        "Unknown user"
      );
    }, [isCurrentUserProject, project.profile]);

    // Get initials for the avatar fallback
    const userInitials = useMemo(() => {
      // Try to get initials from full name first, then username, then email
      const nameForInitials =
        project.profile?.full_name ||
        project.profile?.username?.split("@")[0] ||
        project.profile?.email_address?.split("@")[0] ||
        "??";
      return getInitials(nameForInitials);
    }, [project.profile]);

    // Get consistent random emoji for project placeholder
    const projectEmoji = useMemo(() => {
      const emojis = [
        "🎨", "🚀", "💡", "⚡", "🔥", "✨", "🌟", "💻", 
        "🎯", "🎪", "🎭", "🎬", "🎮", "🎲", "🎰", "🎸",
        "🎹", "🎺", "🎻", "🎼", "🔮", "💎", "🏆", "🚁",
        "🛸", "🌈", "🦄", "🐉", "🦋", "🌺", "🌸", "🍄"
      ];
      // Use project ID to get consistent emoji
      const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return emojis[hash % emojis.length];
    }, [project.id]);

    const handleTagClick = async (e: React.MouseEvent, tag: string) => {
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
            <p>You have to sign in to browse projects by tags silly</p>
          </div>
        );
        return;
      }

      // Rest of the existing tag click logic
      const currentPath = window.location.pathname;
      const tagPath = `/tags/${encodeURIComponent(tag)}`;
      if (currentPath === tagPath) {
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
            <div>
              {"You are already looking at projects tagged with "}
              <Badge>
                {"#"}
                {tag}
              </Badge>
              {" you silly goose"}
            </div>
          </div>
        );
        return;
      }

      if (loadingTag) return;
      setLoadingTag(tag);
      router.push(tagPath);
    };

    const handleTagExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowAllTags(true);
    };

    const handleCategoryClick = async (e: React.MouseEvent) => {
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
            <p>You have to sign in to browse projects by categories silly</p>
          </div>
        );
        return;
      }
      const currentPath = window.location.pathname;
      const categoryPath = `/categories/${encodeURIComponent(
        project.category
      )}`;
      if (currentPath === categoryPath) {
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
            {
              <div>
                {"You are already looking at projects in the "}
                <Badge className="bg-muted-foreground button-ghost">
                  {PROJECT_CATEGORIES[project.category]?.label}
                </Badge>
                {" category you silly goose"}
              </div>
            }
          </div>
        );
        return;
      }

      if (isCategoryLoading) return;
      setIsCategoryLoading(true);
      router.push(categoryPath);
    };

    const handleCardClick = async () => {
      if (isNavigating) return;
      setIsNavigating(true);
      router.push(`/projects/${project.slug}`);
    };

    const handleViewDetailsClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isNavigating) return;
      setIsNavigating(true);
      router.push(`/projects/${project.slug}`);
    };

    const handleNavigateUser = async (e: React.MouseEvent) => {
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
            <p>{`You have to sign in to view ${project.profile?.full_name}'s profile page`}</p>
          </div>
        );
        return;
      }
      const username = project.profile?.username;
      if (isNavigatingUser || !username) return;
      setIsNavigatingUser(true);
      try {
        router.push(`/users/${encodeURIComponent(username)}`);
      } finally {
        setIsNavigatingUser(false);
      }
    };

    const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/projects/${encodeURIComponent(
        project.slug || ""
      )}`;
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast.dismiss();
          toast.success(
            <div className="abosolute flex flex-row items-center justify-items-center gap-2 p-1 hover:p-1 w-auto">
              <Image
                src="/images/mascot.png"
                alt="Code Minion"
                width={50}
                height={50}
                className="relative flex item-center"
              />
              <div className="flex flex-col w-auto">
                <p className="text-foreground w-full">
                  {"Project copied to your clipboard!"}
                </p>
                <p className="text-muted-foreground w-full">{`"${shareUrl}"`}</p>
              </div>
              <ExternalLink
                size={30}
                className="text-muted-foreground ml-2 hover:cursor-pointer cursor-pointer"
                onClick={() => {
                  window.open(`/projects/${project.slug}`, "_blank");
                }}
              />
            </div>
          );
        })
        .catch(() => {
          toast.error("Failed to copy share link");
        });
    };

    return (
      <>
        <Card
          className={`group relative overflow-hidden w-full h-[620px] flex flex-col transition-all duration-200 project-card cursor-pointer hover:scale-[1.02] border-2 border-transparent category-${
            project.category
          }
            ${project.deleted_at ? "deleted" : ""} ${
            isNavigating ? "opacity-70 pointer-events-none" : ""
          }`}
          onClick={handleCardClick}
        >
          {isNavigating && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex justify-between items-start px-4 -mt-1 absolute w-full z-[5]">
            {/* Category Badge */}
            <div className={` category-${project.category} border-0`}>
              <Badge
                variant={project.deleted_at ? "outline" : "secondary"}
                className={`category-${
                  project.category
                } border-0 category-badge capitalize text-sm cursor-pointer hover:bg-[var(--bg-light)] dark:hover:bg-[var(--bg-dark)] ${
                  isCategoryLoading ? "opacity-70 pointer-events-none" : ""
                }`}
                onClick={handleCategoryClick}
              >
                {isCategoryLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    {PROJECT_CATEGORIES[project.category]?.label ||
                      project.category}
                  </span>
                ) : (
                  PROJECT_CATEGORIES[project.category]?.label ||
                  project.category
                )}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {!project.deleted_at && !hideActions ? (
                <>
                  {isOwner && (
                    <div className="action-buttons-group flex gap-0.5">
                      {onUpdateProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="action-button hover:text-blue-500 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateProject?.(project);
                          }}
                          aria-label="Update project"
                        >
                          <Edit size={16} className="sm:hidden" />
                          <Edit size={18} className="hidden sm:inline" />
                        </Button>
                      )}
                      {onDeleteProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="action-button hover:text-red-500 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={handleDeleteClick}
                          aria-label="Delete project"
                        >
                          <Trash2 size={16} className="sm:hidden" />
                          <Trash2 size={18} className="hidden sm:inline" />
                        </Button>
                      )}
                      {/* Share button moved to footer */}
                    </div>
                  )}
                  {!hideActions && user && (
                    <FavoriteButton
                      isFavorite={!!isFavorite}
                      count={Number(project.total_favorites) || 0}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (!user) {
                          toast.info(
                            "You have to sign in to favorite projects silly"
                          );
                          return;
                        }
                        onToggleFavorite?.(project.id, !isFavorite);
                      }}
                      ariaLabel={
                        isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    />
                  )}
                  {!user && Number(project.total_favorites) > 0 && (
                    <div className="flex items-center gap-1">
                      <Heart
                        size={20}
                        fill="currentColor"
                        className={"text-red-500"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {Number(project.total_favorites)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                isOwner && (
                  <div className="action-buttons-group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="action-button hover:text-green-500"
                      onClick={handleRestore}
                      aria-label="Restore project"
                    >
                      <Undo2 size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="action-button hover:text-red-500"
                      onClick={handlePermanentDelete}
                      aria-label="Permanently delete project"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Content area with fixed heights */}
          <div className="card-content mx-2 flex flex-col flex-1 min-h-0">
            {/* Image placeholder section */}
            <div className="h-[120px] mb-3 rounded-lg bg-muted/30 border border-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="text-7xl">
                  {projectEmoji}
                </div>
              </div>
            </div>

            {/* Project title - fixed height */}
            <div className="h-[60px] flex items-start mb-1 flex-shrink-0">
              <h3
                className={`text-lg sm:text-xl font-semibold line-clamp-2 ${
                  project.deleted_at ? "text-foreground dark:text-foreground" : ""
                }`}
              >
                {project.title}
              </h3>
            </div>

            {/* Description - fills remaining space and fully scrollable */}
            <div className="flex-1 min-h-0 mb-2 rounded-md p-3">
              <div
                className={`card-description text-xs sm:text-sm leading-relaxed h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 ${
                  project.deleted_at
                    ? "text-foreground dark:text-foreground/90"
                    : ""
                }`}
              >
                {project.description || "No description provided"}
              </div>
            </div>
          </div>

          {/* Card footer with extended section for tags - fixed at bottom */}
          <div className="flex flex-col flex-shrink-0 -mt-5">
            <div className="card-footer border-t h-[60px] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Avatar navigates to user profile */}
                <button
                  type="button"
                  disabled={isNavigatingUser}
                  onClick={handleNavigateUser}
                  className={
                    isNavigatingUser
                      ? "opacity-50 cursor-wait p-0"
                      : "cursor-pointer p-0"
                  }
                >
                  <Avatar className="h-8 w-8">
                    {project.profile?.profile_image_url ? (
                      <AvatarImage
                        src={project.profile.profile_image_url}
                        alt={displayUsername}
                      />
                    ) : (
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {userInitials || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
                {/* Username navigates to user profile */}
                <button
                  type="button"
                  disabled={isNavigatingUser}
                  onClick={handleNavigateUser}
                  className={`text-xs truncate max-w-[120px] cursor-pointer hover:underline ${
                    isNavigatingUser ? "opacity-50 cursor-wait" : ""
                  } ${project.deleted_at ? "text-red-400/50" : ""}`}
                  title={displayUsername}
                >
                  {displayUsername}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Share button moved to the left of View Project button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="action-button hover:text-purple-500 h-8 w-8 p-0 flex-shrink-0 cursor-pointer"
                      onClick={handleShareClick}
                      aria-label="Share project"
                    >
                      <Share2 size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy project link to clipboard</p>
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleViewDetailsClick}
                  className={`card-button ${
                    project.deleted_at
                      ? "bg-[oklch(0.3_0.05_280)] text-[oklch(0.9_0.02_280)] hover:bg-[oklch(0.35_0.05_280)]"
                      : ""
                  } ${isNavigating ? "opacity-70 pointer-events-none" : ""}`}
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    "View Project"
                  )}
                </Button>
              </div>
            </div>

            {/* Tags section below footer with fixed height and scroll */}
            <div className="px-6 py-3 border-t bg-muted/5 h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5 content-start">
                {tags.length > 0 ? (
                  <>
                    {(showAllTags
                      ? tags
                      : tags.slice(0, tagShowLimitOnCard)
                    ).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        } cursor-pointer text-xs px-2 py-0.5 ${
                          loadingTag === tag
                            ? "opacity-70 pointer-events-none"
                            : ""
                        }`}
                        onClick={(e) => handleTagClick(e, tag)}
                      >
                        {loadingTag === tag ? (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            #{tag}
                          </span>
                        ) : (
                          `#${tag}`
                        )}
                      </Badge>
                    ))}
                    {!showAllTags && tags.length > tagShowLimitOnCard && (
                      <Badge
                        variant="secondary"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        } hover:bg-accent cursor-pointer text-xs px-2 py-0.5`}
                        onClick={handleTagExpandClick}
                      >
                        +{tags.length - tagShowLimitOnCard}
                      </Badge>
                    )}
                    {showAllTags && tags.length > tagShowLimitOnCard && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          project.deleted_at ? "tag-badge-deleted" : "tag-badge"
                        } bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 cursor-pointer ml-auto mt-2 text-xs px-3 py-1 rounded-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllTags(false);
                        }}
                      >
                        ❌ Close Tags
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No tags added
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Confirmation Modals */}
        <PermanentDeleteConfirmationModal
          isOpen={showPermanentDeleteModal}
          onClose={() => setShowPermanentDeleteModal(false)}
          onConfirm={handlePermanentDeleteConfirm}
          projectTitle={project.title}
          isDeleting={isDeleting}
        />

        <RestoreProjectConfirmationModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          onConfirm={handleRestoreConfirm}
          projectTitle={project.title}
          isRestoring={isRestoring}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function that only re-renders when necessary props change
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.project.title === nextProps.project.title &&
      prevProps.project.description === nextProps.project.description &&
      prevProps.isFavorite === nextProps.isFavorite &&
      JSON.stringify(prevProps.project.tags || []) ===
        JSON.stringify(nextProps.project.tags || []) &&
      prevProps.project.category === nextProps.project.category
    );
  }
);
