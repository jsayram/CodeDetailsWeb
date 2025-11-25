"use client";

import React, { useState } from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn, useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Code,
  Heart,
  Star,
  Tag as TagIcon,
  TrendingUp,
  RefreshCw,
  Activity,
  PieChart,
  Sparkles,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedDate } from "@/lib/FormattedDate";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchUserDashboardData } from "@/app/actions/user-dashboard";
import { useDashboardCache } from "@/hooks/use-dashboard-cache";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { PageBanner } from "@/components/ui/page-banner";
import { MAX_PROJECT_TAGS } from "@/constants/tag-constants";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";
import { UserDashboardStats } from "@/db/operations/userDashboardOperations";
import { toast } from "sonner";

// Type definitions
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface ActivityItemProps {
  slug: string;
  title: string;
  description: string;
  timestamp: Date;
}

interface ProjectCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  total_favorites: number;
  category: string;
  tags?: string[];
  created_at?: Date | null;
}

interface FavoriteCardProps {
  id: string;
  slug: string;
  title: string;
  owner_username: string | null;
  category: string;
}

interface TagSubmissionCardProps {
  tag_name: string;
  project_id: string;
  project_slug: string;
  project_title: string;
  status: string;
  admin_notes: string | null;
  created_at: Date | null;
  is_now_available: boolean;
  project_tag_count: number;
  is_on_original_project?: boolean;
  other_projects_using_tag?: { slug: string; title: string }[];
}

interface RecentAppreciationItemProps {
  project_slug: string;
  project_title: string;
  favoriter_username: string | null;
  favoriter_profile_image: string | null;
  favorited_at: Date | null;
}

// Loading skeleton for stats card
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-[60px] mb-1" />
        <Skeleton className="h-4 w-[120px]" />
      </CardContent>
    </Card>
  );
}

// Simple stats card component
function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <div className="text-5xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-2 text-center">{description}</p>
      </CardContent>
    </Card>
  );
}

// My Projects card component with button
function MyProjectsCard({ totalProjects, activeThisWeek }: { totalProjects: number; activeThisWeek: number }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Card className="stat-card h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">My Projects</CardTitle>
        <Code className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <div className="text-5xl font-bold">{totalProjects}</div>
        <p className="text-xs text-muted-foreground mt-2 text-center">{activeThisWeek} updated this week</p>
        <Link href="/projects/projects-portfolio" className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full cursor-pointer text-xs"
            onClick={() => setIsNavigating(true)}
            disabled={isNavigating}
          >
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            View All Projects
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Favorite project item component
function FavoriteProjectItem({ project }: { project: { id: string; slug: string; title: string; total_favorites: number } }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="text-xs p-1.5 rounded hover:bg-muted/50 transition-colors flex items-center justify-between group">
        <span className="truncate flex-1 group-hover:text-primary">{project.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isNavigating && <Loader2 className="h-3 w-3 animate-spin" />}
          <Heart className="h-3 w-3" />
          <span className="text-xs font-medium">{project.total_favorites}</span>
        </div>
      </div>
    </Link>
  );
}

// Favorites Received card component with project list
function FavoritesReceivedCard({ 
  totalFavorites, 
  projectsWithFavorites 
}: { 
  totalFavorites: number; 
  projectsWithFavorites: { id: string; slug: string; title: string; total_favorites: number }[] 
}) {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Favorites Received</CardTitle>
        <Heart className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-row gap-3 overflow-hidden p-4">
        {/* Left side - Total count */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-1/3 border-r border-border pr-3">
          <div className="text-4xl font-bold">{totalFavorites}</div>
          <p className="text-xs text-muted-foreground mt-1 text-center">Total</p>
        </div>
        
        {/* Right side - Scrollable project list */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {projectsWithFavorites.length > 0 ? (
            <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
              <div className="space-y-1">
                {projectsWithFavorites.map((project) => (
                  <FavoriteProjectItem key={project.id} project={project} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground text-center">No projects have received favorites yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Favorites Given card component with button
function FavoritesGivenCard({ totalFavoritesGiven }: { totalFavoritesGiven: number }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Favorites Given</CardTitle>
        <Star className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <div className="text-5xl font-bold">{totalFavoritesGiven}</div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Projects you've favorited ❤️</p>
        <Link href="/projects/favorites" className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full cursor-pointer text-xs"
            onClick={() => setIsNavigating(true)}
            disabled={isNavigating}
          >
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            View All Favorites
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Tags card component showing all tags
interface TagsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  tags: { name: string }[];
}

function TagsCard({ title, value, icon, tags }: TagsCardProps) {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex-1 flex flex-row gap-4 overflow-hidden p-4">
        {/* Left side - Total count */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-1/2 border-r border-border pr-4">
          <div className="text-5xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Unique tags
          </p>
        </div>

        {/* Right side - Scrollable tags */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tags && tags.length > 0 ? (
            <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
              <div className="flex flex-wrap gap-1.5 content-start">
                {tags.map((tag, index) => (
                  <Badge
                    key={`${tag.name}-${index}`}
                    variant="secondary"
                    className="text-xs h-5"
                  >
                    <span className="text-foreground">#</span>{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tags yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({
  slug,
  title,
  description,
  timestamp,
}: ActivityItemProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="flex flex-col space-y-1 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
            <p className="text-sm font-medium hover:text-primary transition-colors truncate">
              {title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">
            <FormattedDate date={timestamp} format="datetime" />
          </p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}

// Popular tag project item component
function PopularTagProjectItem({
  project,
}: {
  project: { id: string; slug: string; title: string };
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="text-xs p-2 rounded hover:bg-muted/50 transition-colors hover:text-primary flex items-center gap-1 min-w-0">
        {isNavigating && (
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        )}
        <span className="truncate">{project.title}</span>
      </div>
    </Link>
  );
}

// Single-use tag item component
function SingleUseTagItem({
  tag,
}: {
  tag: {
    name: string;
    count: number;
    projects: { id: string; slug: string; title: string }[];
  };
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors gap-2 min-w-0">
      <span className="text-sm font-medium truncate min-w-0">#{tag.name}</span>
      {tag.projects && tag.projects.length > 0 && (
        <Link
          href={`/projects/${tag.projects[0].slug}`}
          className="text-xs text-primary hover:underline cursor-pointer ml-2 inline-flex items-center gap-1 min-w-0 flex-shrink-0 max-w-[50%]"
          onClick={() => setIsNavigating(true)}
        >
          {isNavigating && (
            <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
          )}
          <span className="truncate">{tag.projects[0].title}</span>
        </Link>
      )}
    </div>
  );
}

// Project card component
function ProjectCard({
  slug,
  title,
  description,
  total_favorites,
  category,
  tags = [],
  created_at,
}: ProjectCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="cursor-pointer h-full"
      onClick={() => setIsNavigating(true)}
    >
      <Card className="hover:bg-accent/50 transition-colors relative h-[200px] 3xl:h-[440px] flex flex-col">
        {isNavigating && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <Badge variant="outline" className={`absolute top-3 left-3 px-3 py-1 category-badge category-${category?.toLowerCase().replace(/[\s&/]+/g, '-')}`}>
          {PROJECT_CATEGORIES[category as ProjectCategory]?.label || category}
        </Badge>
        {created_at && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            <div className="text-[10px] text-muted-foreground">
              <FormattedDate date={created_at} />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Heart className={`h-3 w-3 ${total_favorites > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {total_favorites}
            </div>
          </div>
        )}
        <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 min-h-0 flex flex-col justify-between">
              <CardTitle className="text-base line-clamp-2 mb-3">{title}</CardTitle>
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-[10px] px-2 py-0.5 h-5"
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] px-2 py-0.5 h-5"
                    >
                      +{tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end items-center flex-shrink-0 pt-3 pb-3">
        </CardFooter>
      </Card>
    </Link>
  );
}

// Favorite card component
function FavoriteCard({
  slug,
  title,
  owner_username,
  category,
}: FavoriteCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="cursor-pointer h-full"
      onClick={() => setIsNavigating(true)}
    >
      <Card className="hover:bg-accent/50 transition-colors relative h-[200px] 3xl:h-[440px] flex flex-col">
        {isNavigating && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <Badge variant="outline" className={`absolute top-3 left-3 px-3 py-1 category-badge category-${category?.toLowerCase().replace(/[\s&/]+/g, '-')}`}>
          {PROJECT_CATEGORIES[category as ProjectCategory]?.label || category}
        </Badge>
        <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 min-h-0 flex flex-col justify-between">
              <CardTitle className="text-base line-clamp-2 mb-3">{title}</CardTitle>
              <p className="text-xs text-muted-foreground line-clamp-2">
                by {owner_username}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end flex-shrink-0 pt-3 pb-3">
        </CardFooter>
      </Card>
    </Link>
  );
}

// Tag submission card
function TagSubmissionCard({
  tag_name,
  project_id,
  project_slug,
  project_title,
  status,
  admin_notes,
  created_at,
  is_now_available,
  project_tag_count,
  is_on_original_project,
  other_projects_using_tag,
}: TagSubmissionCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Unified badge styling with status-based text colors
  const badgeClassName =
    status === "approved"
      ? "text-xs bg-green-700 dark:bg-green-400 text-black dark:text-black border-transparent"
      : status === "rejected"
      ? "text-xs bg-red-700 dark:bg-red-400 text-black dark:text-black border-transparent"
      : "text-xs bg-yellow-900 dark:bg-yellow-500 text-black dark:text-black border-transparent";

  const isProjectAtCapacity = project_tag_count >= MAX_PROJECT_TAGS;

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={badgeClassName}>
              <span className="opacity-70">#</span>{tag_name}
            </Badge>
            {status === "approved" && (
              is_on_original_project ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 text-xs">
                  ✅ In Project
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-xs">
                  ⚠️ System Only
                </Badge>
              )
            )}
          </div>
          <Link
            href={`/projects/${project_slug}`}
            className="cursor-pointer block"
            onClick={() => setIsNavigating(true)}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-auto w-full px-2 py-1 hover:cursor-pointer hover:text-primary transition-colors text-left justify-start overflow-hidden"
              disabled={isNavigating}
            >
              <div className="flex items-start gap-1 min-w-0 w-full overflow-hidden">
                {isNavigating && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 mt-0.5" />
                )}
                <span className="truncate text-xs">
                  Originally submitted for: {project_title}
                </span>
              </div>
            </Button>
          </Link>
          {status === "approved" && other_projects_using_tag && other_projects_using_tag.length > 0 && (
            <div className="text-xs text-muted-foreground pt-1">
              <span className="font-medium">Also used in:</span>{" "}
              {other_projects_using_tag.map((proj, idx) => (
                <span key={proj.slug}>
                  <Link 
                    href={`/projects/${proj.slug}`}
                    className="text-primary hover:underline"
                  >
                    {proj.title}
                  </Link>
                  {idx < other_projects_using_tag.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {is_now_available && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
            >
              Now Available
            </Badge>
          )}
          {created_at && (
            <p className="text-xs text-muted-foreground">
              <FormattedDate date={created_at} format="datetime" />
            </p>
          )}
        </div>
      </div>
      {status === "rejected" && admin_notes && (
        <div className="mt-2 pt-2 border-t border-destructive/20">
          <p className="text-xs text-destructive/80">
            <span className="font-medium">Reason: </span>
            {admin_notes}
          </p>
        </div>
      )}
      {is_now_available && (
        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
          {isProjectAtCapacity ? (
            <>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">Tag is available,</span> but this
                project already has the maximum of {MAX_PROJECT_TAGS} tags.
                Remove a tag first to add this one.
              </p>
              <Link
                href={`/projects/${project_slug}?edit=true&tag=${encodeURIComponent(
                  tag_name
                )}`}
                className="cursor-pointer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={() => setIsNavigating(true)}
                  disabled={isNavigating}
                >
                  {isNavigating && (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  )}
                  Manage Project Tags
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs text-green-700 dark:text-green-400">
                <span className="font-medium">Good news!</span> This tag was
                approved for use in the system after further consideration. You
                can add it to your project.
              </p>
              <Link
                href={`/projects/${project_slug}?edit=true&tag=${encodeURIComponent(
                  tag_name
                )}`}
                className="cursor-pointer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={() => setIsNavigating(true)}
                  disabled={isNavigating}
                >
                  {isNavigating && (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  )}
                  Add to Project
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Recent Appreciation item component
function RecentAppreciationItem({
  project_slug,
  project_title,
  favoriter_username,
  favoriter_profile_image,
  favorited_at,
}: RecentAppreciationItemProps) {
  const [isNavigatingToUser, setIsNavigatingToUser] = useState(false);
  const [isNavigatingToProject, setIsNavigatingToProject] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0">
          {favoriter_profile_image ? (
            <Image
              src={favoriter_profile_image}
              alt={favoriter_username || "User"}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium break-words">
            {favoriter_username ? (
              <Link
                href={`/users/${favoriter_username}`}
                className="text-primary hover:underline cursor-pointer font-semibold inline-flex items-center gap-1 max-w-full"
                onClick={() => setIsNavigatingToUser(true)}
              >
                {isNavigatingToUser && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                )}
                <span className="truncate">{favoriter_username}</span>
              </Link>
            ) : (
              <span className="text-primary font-semibold">Someone</span>
            )}
            <span className="text-muted-foreground font-normal">
              {" "}
              favorited ❤️
            </span>
          </p>
            <Link
            href={`/projects/${project_slug}`}
            className="cursor-pointer block min-w-0 w-full"
            onClick={() => setIsNavigatingToProject(true)}
            >
            <Button
              variant="outline"
              size="sm"
              className="h-auto w-full px-2 py-1 hover:cursor-pointer hover:text-primary transition-colors text-left justify-start overflow-hidden"
              disabled={isNavigatingToProject}
            >
              <div className="flex items-start gap-1 min-w-0 w-full overflow-hidden">
                {isNavigatingToProject && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 mt-0.5" />
                )}
                <span className="line-clamp-2 break-words min-w-0 overflow-hidden">{project_title}</span>
              </div>
            </Button>
            </Link>
          {favorited_at && (
            <p className="text-xs text-muted-foreground">
              <FormattedDate date={favorited_at} format="datetime" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// View All Projects Button component
function ViewAllProjectsButton() {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <CardFooter className="flex-shrink-0 flex justify-center">
      <Link href="/projects" className="cursor-pointer">
        <Button
          className="w-auto px-6 cursor-pointer"
          onClick={() => setIsNavigating(true)}
          disabled={isNavigating}
        >
          {isNavigating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          View All My Projects
        </Button>
      </Link>
    </CardFooter>
  );
}

// View All Favorites Button component
function ViewAllFavoritesButton() {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <CardFooter className="flex-shrink-0 flex justify-center">
      <Link href="/projects/favorites" className="cursor-pointer">
        <Button
          className="w-auto px-6 cursor-pointer"
          onClick={() => setIsNavigating(true)}
          disabled={isNavigating}
        >
          {isNavigating && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          View All Projects I've Favorited ❤️
        </Button>
      </Link>
    </CardFooter>
  );
}

// Dashboard error component
function DashboardError({
  error,
  refresh,
}: {
  error: Error;
  refresh: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <div className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
      <div className="text-center">
        <p className="text-destructive">
          Error loading dashboard: {error.message}
        </p>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-4 cursor-pointer"
        >
          {isRefreshing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isRefreshing ? "Retrying..." : "Retry"}
        </Button>
      </div>
    </div>
  );
}

// Dashboard content component
function DashboardContent() {
  const {
    data: dashboardData,
    loading,
    error,
    refresh,
  } = useDashboardCache("user-dashboard", fetchUserDashboardData, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError error={error} refresh={refresh} />;
  }

  if (!dashboardData) {
    return <DashboardLoading />;
  }

  const { stats } = dashboardData;

  return <DashboardMain stats={stats} refresh={refresh} />;
}

// Dashboard main content with stats
function DashboardMain({
  stats,
  refresh,
}: {
  stats: UserDashboardStats;
  refresh: () => void;
}) {
  const { user } = useUser();
  const [refreshingTagSubmissions, setRefreshingTagSubmissions] = React.useState(false);

  const refreshTagSubmissions = React.useCallback(async () => {
    setRefreshingTagSubmissions(true);
    try {
      await refresh();
      toast.success('Tag submissions refreshed');
    } catch (error) {
      toast.error('Failed to refresh tag submissions');
      console.error('Error refreshing tag submissions:', error);
    } finally {
      setRefreshingTagSubmissions(false);
    }
  }, [refresh]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <main className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
      {/* Dashboard Banner */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="cursor-pointer self-start"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <PageBanner
            icon={<PieChart className="h-8 w-8 text-purple-500" />}
            userName={user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "User"}
            bannerTitle="Personal Analytics Dashboard"
            description={
              stats.totalProjects > 0
                ? (
                  <div className="space-y-1">
                    <div>📂 You have shared <a href="#my-projects-card" className="font-semibold text-primary hover:underline cursor-pointer scroll-smooth" onClick={(e) => { e.preventDefault(); const el = document.getElementById('my-projects-card'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); const card = el.querySelector('.stat-card'); if (card) { setTimeout(() => card?.classList.add('highlight-flash'), 500); setTimeout(() => card?.classList.remove('highlight-flash'), 3000); } } }}>{stats.totalProjects}</a> project{stats.totalProjects > 1 ? "s" : ""} with the community</div>
                  </div>
                )
                : "Welcome back! Your creative journey starts here. Share your first project and inspire the community! This dashboard is only visible to you."
            }
            isUserBanner={true}
            gradientFrom="purple-900"
            gradientVia="indigo-800"
            gradientTo="violet-800"
            borderColor="border-purple-700/40"
            textGradient="from-purple-400 via-indigo-400 to-violet-400"
          />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <div id="my-projects-card" className="scroll-mt-20">
          <MyProjectsCard 
            totalProjects={stats.totalProjects} 
            activeThisWeek={stats.projectStats.activeThisWeek}
          />
        </div>
        <div id="favorites-received-card" className="scroll-mt-20">
          <FavoritesReceivedCard
            totalFavorites={stats.totalFavorites}
            projectsWithFavorites={stats.projectsWithFavorites}
          />
        </div>
        <div id="favorites-given-card" className="scroll-mt-20">
          <FavoritesGivenCard totalFavoritesGiven={stats.totalFavoritesGiven} />
        </div>
        <div id="my-tags-card" className="scroll-mt-20">
          <TagsCard
          title="My Tags"
          value={(stats.allTags?.length || 0).toString()}
          icon={<TagIcon className="h-4 w-4 text-primary" />}
            tags={stats.allTags || []}
          />
        </div>
      </div>      {/* Main Content - Three Columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {/* Left Column - Recent Appreciation */}
        <Card className="md:col-span-2 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Recent Appreciation
            </CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <CardDescription className="text-xs">
              Favorites received in the last 90 days
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.recentAppreciation && stats.recentAppreciation.length > 0 ? (
              <div className="space-y-2">
                {stats.recentAppreciation
                  .slice(0, 8)
                  .map((appreciation, index) => (
                    <RecentAppreciationItem key={index} {...appreciation} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No favorites received in the last 90 days. Don't worry someone will like your
                  masterpiece soon!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Column - Recent Activity */}
        <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <CardDescription className="text-xs">
              Projects created or updated in the last 60 days
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {stats.recentActivity.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    slug={activity.slug}
                    title={activity.title}
                    description={`Project ${activity.action}`}
                    timestamp={activity.timestamp}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity in the last 60 days
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Popular Tags */}
        <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              My Popular Tags
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardHeader className="flex-shrink-0 pt-0">
            <CardDescription className="text-xs">
              Most frequently used tags (number shows project count)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.topTags.length > 0 ? (
              <>
                <div className="space-y-2">
                  {/* Show tags with 2+ projects (up to 8 total) */}
                  {stats.topTags
                    .filter((tag) => tag.count > 1)
                    .slice(0, 8)
                    .map((tag) => (
                      <Accordion key={tag.name} type="single" collapsible>
                        <AccordionItem
                          value={tag.name}
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-3 py-2 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                              <span className="text-sm font-medium truncate">
                                <span className="text-foreground">#</span>{tag.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {tag.count}{" "}
                                  {tag.count === 1 ? "project" : "projects"}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-2">
                            <div className="space-y-1">
                              {tag.projects && tag.projects.length > 0 ? (
                                tag.projects.map((project) => (
                                  <PopularTagProjectItem
                                    key={project.id}
                                    project={project}
                                  />
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No projects found
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                </div>

                {/* Show tags with only 1 project in a collapsible section */}
                {stats.topTags.filter((tag) => tag.count === 1).length > 0 && (
                  <Accordion type="single" collapsible className="mt-3">
                    <AccordionItem
                      value="single-use-tags"
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Tags used in a single project (
                            {
                              stats.topTags.filter((tag) => tag.count === 1)
                                .length
                            }
                            )
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-2">
                        <div className="space-y-1">
                          {stats.topTags
                            .filter((tag) => tag.count === 1)
                            .map((tag) => (
                              <SingleUseTagItem key={tag.name} tag={tag} />
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Projects Section */}
      <Card id="my-projects" className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px] scroll-mt-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
          <div className="flex-1">
            <CardTitle>My Recent Projects ({Math.min(stats.myProjects.length, 8)})</CardTitle>
            <CardDescription className="text-xs mt-1">
              Your most recently created or updated projects
            </CardDescription>
          </div>
          <Code className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {stats.myProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.myProjects.slice(0, 8).map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't created any projects yet
              </p>
              <Link href="/projects/new" className="cursor-pointer">
                <Button onClick={() => {}} className="cursor-pointer">
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
        {stats.myProjects.length > 8 && <ViewAllProjectsButton />}
      </Card>

      {/* Projects I've Favorited */}
      {stats.myFavorites.length > 0 && (
        <Card id="favorites-given" className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px] scroll-mt-20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <div className="flex-1">
              <CardTitle>Projects I've Favorited ❤️ ({Math.min(stats.myFavorites.length, 8)})</CardTitle>
              <CardDescription className="text-xs mt-1">
                Projects you most recently favorited from the community
              </CardDescription>
            </div>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.myFavorites.slice(0, 8).map((favorite) => (
                <FavoriteCard key={favorite.id} {...favorite} />
              ))}
            </div>
          </CardContent>
          {stats.myFavorites.length > 8 && <ViewAllFavoritesButton />}
        </Card>
      )}

      {/* My Tag Submissions */}
      <Card id="tag-submissions" className="flex flex-col h-[600px] 3xl:h-[1200px] scroll-mt-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
          <div className="flex-1">
          <CardTitle className="text-lg">My Tag Submissions</CardTitle>
          <CardDescription className="text-sm">
            {stats.myTagSubmissions.length > 0 ? (
              <>
                {stats.myTagSubmissions.length} tag
                {stats.myTagSubmissions.length > 1 ? "s" : ""} submitted
              </>
            ) : (
              "No tag submissions yet"
            )}
          </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer"
              onClick={refreshTagSubmissions}
              disabled={refreshingTagSubmissions}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshingTagSubmissions ? 'animate-spin' : ''}`} />
            </Button>
            <TagIcon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {/* Tag Contribution Info Accordion */}
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem
              value="about-submissions"
              className="border border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 via-purple/5 to-primary/5"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    About Tag Submissions
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      ✨ Share Your Tags
                    </span>{" "}
                    <span className="text-foreground">
                      When editing your project, submit tags you think should be in the system if not already there for you. Once{" "}
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        approved
                      </span>
                      , you can use them in your projects and others can add them to theirs too!
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      🎯 Why Tags Matter
                    </span>{" "}
                    <span className="text-foreground">
                      Tags add specific tech details beyond categorieslike frameworks, languages, or concepts helping developers find exactly what they need and your projects more efficiently and deliberately.
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      💡 Review Process
                    </span>{" "}
                    <span className="text-foreground">
                      Tags get reviewed for quality as they are available for everyone in the community.{" "}
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        Rejections?
                      </span>{" "}
                      Don't sweat it! They're not about you, we are just keeping tags clean, consistent, and useful for everyone.
                    </span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {stats.myTagSubmissions.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Pending Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-yellow-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending (
                    {
                      stats.myTagSubmissions.filter(
                        (s) => s.status === "pending"
                      ).length
                    }
                    )
                  </h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter((s) => s.status === "pending")
                    .length > 0 ? (
                    stats.myTagSubmissions
                      .filter((s) => s.status === "pending")
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending submissions
                    </p>
                  )}
                </div>
              </div>

              {/* Approved Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-green-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Approved (
                    {
                      stats.myTagSubmissions.filter(
                        (s) => s.status === "approved"
                      ).length
                    }
                    )
                  </h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter((s) => s.status === "approved")
                    .length > 0 ? (
                    stats.myTagSubmissions
                      .filter((s) => s.status === "approved")
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No approved submissions
                    </p>
                  )}
                </div>
              </div>

              {/* Rejected Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-red-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Rejected (
                    {
                      stats.myTagSubmissions.filter(
                        (s) => s.status === "rejected"
                      ).length
                    }
                    )
                  </h3>
                </div>
                {/* Rejected column help message */}
                {stats.myTagSubmissions.filter((s) => s.status === "rejected").length > 0 && (
                  <Accordion type="single" collapsible className="mb-3">
                    <AccordionItem
                      value="rejected-help"
                      className="border border-muted-foreground/20 rounded-lg bg-muted/20"
                    >
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <span className="text-xs font-semibold text-foreground">
                          💡 Got a Rejection? Here's What to Do
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">Think this was a mistake?</span> You can resubmit the tag with a better explanation of why it's useful for the community. Focus on how it helps categorize projects, describes specific technologies, or aids in discovery for all users.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                <div className="space-y-2 max-h-[500px] overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter((s) => s.status === "rejected")
                    .length > 0 ? (
                    stats.myTagSubmissions
                      .filter((s) => s.status === "rejected")
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No rejected submissions
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TagIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tag Submissions Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                When you edit a project, you can submit new tags that aren't in the system yet. 
                Once approved, they'll be available for everyone to use!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

// Loading state for the dashboard
function DashboardLoading() {
  return (
    <main className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>

      <Skeleton className="h-[400px]" />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SidebarProvider>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <SidebarInset>
          <HeaderSection
            showLogo={false}
            showDarkModeButton={true}
            showMobileMenu={false}
          />

          <ErrorBoundary>
            <DashboardContent />
          </ErrorBoundary>

          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
