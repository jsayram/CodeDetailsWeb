"use client";

import React from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Code,
  Heart,
  ShieldCheck,
  Users,
  Moon,
  AlertCircle,
  TrendingUp,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  X,
  Save,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TagSubmissionManagement } from "@/components/administrator/TagSubmissionManagement";
import { TagList } from "@/components/TagList";
import { FormattedDate } from "@/lib/FormattedDate";
import { Overview } from "@/components/dashboard/overview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientOnly } from "@/components/ClientOnly";
import { fetchAdminDashboardData } from "@/app/actions/admin-dashboard";
import { fetchAllUsersAction, updateUserAction, checkIsSuperAdmin } from "@/app/actions/user-management";
import { getCachedTopContributors, getCachedTagPipelineAnalytics } from "@/app/actions/advanced-analytics";
import type { TopContributor, TagPipelineMetrics } from "@/app/actions/advanced-analytics";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/db/operations/userManagementOperations";
import { toast } from "sonner";
import { TopContributorsCard } from "@/components/administrator/TopContributorsCard";
import { TagPipelineCard, TopSubmittersCard, RecentSubmissionsCard } from "@/components/administrator/TagPipelineCard";
import { HighlightText } from "@/components/HighlightText";

// Type definitions
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: Date;
}



interface DashboardStats {
  stats: {
    totalProjects: number;
    activeUsers: number;
    projectStats: {
      activeThisWeek: number;
      totalFavorites: number;
      totalTags: number;
    };
    mostPopularProjects: Array<{
      id: string;
      title: string;
      slug: string;
      favorites: number;
      owner: string;
    }>;
    recentActivity: Array<{
      id: string;
      title: string;
      action: string;
      username: string;
      timestamp: Date;
      slug: string;
    }>;
    projectsNeedingAttention: Array<{
      id: string;
      title: string;
      slug: string;
      owner: string;
      missingDescription: boolean;
      missingTags: boolean;
      issueCount: number;
    }>;
    topTags: Array<{
      name: string;
      count: number;
    }>;
    allProjects: Array<{
      id: string;
      title: string;
      slug: string;
      total_favorites: number;
      category: string;
      owner: string;
      created_at: Date | null;
      tag_count: number;
    }>;
    userGrowth: {
      totalUsers: number;
      newUsersThisWeek: number;
      newUsersThisMonth: number;
    };
    newUsersList: Array<{
      id: string;
      user_id: string;
      username: string;
      full_name: string | null;
      email_address: string | null;
      tier: string | null;
      profile_image_url: string | null;
      created_at: Date | null;
    }>;
    categoryDistribution: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    engagementMetrics: {
      avgFavoritesPerProject: number;
      avgTagsPerProject: number;
      projectsWithoutFavorites: number;
      projectsWithoutTags: number;
    };
  };
  submissions: Array<{
    tag_name: string;
    count: number;
    submissions: Array<{
      id: string;
      tag_name: string;
      project_id: string;
      submitter_email: string;
      description: string | null;
      status: string;
      created_at: Date | null;
      updated_at: Date | null;
      admin_notes: string | null;
      reviewed_at: Date | null;
      project_title?: string;
    }>;
  }>;
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

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[150px]" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] flex items-center justify-center bg-muted/5">
          <BarChart3 className="h-16 w-16 text-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

// Simple stats card component
function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card className="h-[180px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <div className="text-3xl md:text-4xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-2 text-center">{description}</p>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({ title, description, timestamp, slug }: ActivityItemProps & { slug: string }) {
  const [isNavigating, setIsNavigating] = React.useState(false);

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
            <p className="text-sm font-medium truncate hover:text-primary transition-colors">{title}</p>
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

// Project needing attention item
function ProjectNeedsAttentionItem({
  title,
  slug,
  owner,
  missingDescription,
  missingTags,
  issueCount,
}: {
  title: string;
  slug: string;
  owner: string;
  missingDescription: boolean;
  missingTags: boolean;
  issueCount: number;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="flex flex-col space-y-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
            <p className="text-sm font-medium truncate min-w-0">{title}</p>
          </div>
          <span className="text-xs font-semibold text-destructive ml-2 flex-shrink-0">
            {issueCount} issue{issueCount > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">by {owner}</p>
        <div className="flex flex-wrap gap-1.5">
          {missingDescription && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              No description
            </span>
          )}
          {missingTags && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              No tags
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Most liked project item
function MostLikedProjectItem({
  title,
  slug,
  favorites,
  rank,
  owner,
}: {
  title: string;
  slug: string;
  favorites: number;
  rank: number;
  owner: string;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">#{rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
            <p className="text-sm font-medium truncate hover:text-primary transition-colors">{title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">by {owner}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span className="text-sm font-semibold">{favorites}</span>
        </div>
      </div>
    </Link>
  );
}

// Category card item with loading state
function CategoryCardItem({
  category,
  count,
  percentage,
}: {
  category: string;
  count: number;
  percentage: number;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Link
      href={`/categories/${category}`}
      onClick={() => setIsNavigating(true)}
      className="flex flex-col p-3 md:p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 hover:border-primary/40 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 text-primary" />}
          <span className="font-semibold capitalize text-base md:text-lg group-hover:text-primary transition-colors truncate">
            {category}
          </span>
        </div>
        <span className="text-xl md:text-2xl font-bold text-primary flex-shrink-0 ml-2">
          {count}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm text-muted-foreground">
          {percentage}% of all projects
        </span>
      </div>
      <div className="mt-2 h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 group-hover:bg-primary/80"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Link>
  );
}

// Project with no favorites item
function NoFavoritesProjectItem({
  title,
  slug,
  owner,
}: {
  title: string;
  slug: string;
  owner: string;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Link
      href={`/projects/${slug}`}
      className="block cursor-pointer"
      onClick={() => setIsNavigating(true)}
    >
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
            <p className="text-sm font-medium truncate hover:text-primary transition-colors">{title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">by {owner}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 text-muted-foreground">
          <Heart className="h-3.5 w-3.5" />
          <span className="text-xs">0</span>
        </div>
      </div>
    </Link>
  );
}

// New User Item component
function NewUserItem({
  id,
  user_id,
  username,
  full_name,
  email_address,
  tier,
  profile_image_url,
  created_at,
}: {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  email_address: string | null;
  tier: string | null;
  profile_image_url: string | null;
  created_at: Date | null;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="space-y-2">
      <Link
        href={`/users/${username}`}
        className="block cursor-pointer"
        onClick={() => setIsNavigating(true)}
      >
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
              <Users className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                {username}
                {full_name && (
                  <span className="text-xs text-muted-foreground ml-2">({full_name})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {email_address && (
                <p className="text-xs text-muted-foreground truncate">{email_address}</p>
              )}
              {tier && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {tier}
                </span>
              )}
            </div>
          </div>
          {created_at && (
            <p className="text-xs text-muted-foreground flex-shrink-0">
              <FormattedDate date={created_at} format="date" />
            </p>
          )}
        </div>
      </Link>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-muted-foreground hover:text-primary transition-colors ml-2"
      >
        {isExpanded ? '▼' : '▶'} Database Info
      </button>
      {isExpanded && (
        <div className="ml-2 p-3 rounded-lg bg-muted/20 text-xs space-y-1 font-mono">
          <div className="flex gap-2">
            <span className="text-muted-foreground min-w-[100px]">UUID:</span>
            <span className="text-foreground break-all">{id}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground min-w-[100px]">User ID:</span>
            <span className="text-foreground break-all">{user_id}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground min-w-[100px]">Username:</span>
            <span className="text-foreground">{username}</span>
          </div>
          {full_name && (
            <div className="flex gap-2">
              <span className="text-muted-foreground min-w-[100px]">Full Name:</span>
              <span className="text-foreground">{full_name}</span>
            </div>
          )}
          {email_address && (
            <div className="flex gap-2">
              <span className="text-muted-foreground min-w-[100px]">Email:</span>
              <span className="text-foreground break-all">{email_address}</span>
            </div>
          )}
          {tier && (
            <div className="flex gap-2">
              <span className="text-muted-foreground min-w-[100px]">Tier:</span>
              <span className="text-foreground">{tier}</span>
            </div>
          )}
          {profile_image_url && (
            <div className="flex gap-2">
              <span className="text-muted-foreground min-w-[100px]">Profile Image:</span>
              <span className="text-foreground break-all">{profile_image_url}</span>
            </div>
          )}
          {created_at && (
            <div className="flex gap-2">
              <span className="text-muted-foreground min-w-[100px]">Created At:</span>
              <span className="text-foreground">{created_at.toISOString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// View All Activity Button component
function ViewAllActivityButton() {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full flex items-center justify-center cursor-pointer"
      onClick={() => setIsNavigating(true)}
      disabled={isNavigating}
    >
      {isNavigating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      View all activity
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

// View All Projects Button component
function ViewAllProjectsButton() {
  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <Link href="/projects" className="w-full">
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex items-center justify-center cursor-pointer"
        onClick={() => setIsNavigating(true)}
        disabled={isNavigating}
      >
        {isNavigating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        View all projects
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  );
}

// Edit User Dialog component
function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = React.useState({
    username: "",
    full_name: "",
    email_address: "",
    tier: "free",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        full_name: user.full_name || "",
        email_address: user.email_address || "",
        tier: user.tier || "free",
      });
      setError(null);
      setShowConfirmation(false);
    }
  }, [user]);

  const handleSaveClick = () => {
    // Show confirmation before saving
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateUserAction(user.id, formData);
      toast.success("User profile updated successfully");
      onSave();
      onOpenChange(false);
      setShowConfirmation(false);
      
      // Scroll to user management card
      setTimeout(() => {
        const userMgmtCard = document.getElementById('user-management');
        if (userMgmtCard) {
          userMgmtCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            userMgmtCard.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              userMgmtCard.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 1000);
          }, 500);
        }
      }, 100);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved to the database.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tier</label>
            <Select
              value={formData.tier}
              onValueChange={(value) => setFormData({ ...formData, tier: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user && (
            <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground font-mono">
              <div>UUID: {user.id}</div>
              <div>User ID: {user.user_id}</div>
            </div>
          )}
        </div>
        {!showConfirmation ? (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold text-base text-foreground">Confirm User Profile Changes</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please review the changes below before saving. This will update the user's profile in the database.
                    </p>
                  </div>
                  {user && (
                    <div className="space-y-2">
                      {formData.username !== (user.username || "") && (
                        <div className="rounded-md bg-muted/50 p-3 border border-border">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Username</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">{user.username || "(empty)"}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground">{formData.username}</span>
                          </div>
                        </div>
                      )}
                      {formData.full_name !== (user.full_name || "") && (
                        <div className="rounded-md bg-muted/50 p-3 border border-border">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Full Name</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">{user.full_name || "(empty)"}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground">{formData.full_name}</span>
                          </div>
                        </div>
                      )}
                      {formData.email_address !== (user.email_address || "") && (
                        <div className="rounded-md bg-muted/50 p-3 border border-border">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Email Address</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">{user.email_address || "(empty)"}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground">{formData.email_address}</span>
                          </div>
                        </div>
                      )}
                      {formData.tier !== (user.tier || "free") && (
                        <div className="rounded-md bg-muted/50 p-3 border border-border">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Tier</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through capitalize">{user.tier || "free"}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground capitalize">{formData.tier}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelConfirmation}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} disabled={isSaving} variant="destructive">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Confirm & Save Changes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Editable User Item component
function EditableUserItem({
  user,
  isSuperAdmin,
  onEdit,
  searchQuery = "",
}: {
  user: UserProfile;
  isSuperAdmin: boolean;
  onEdit: (user: UserProfile) => void;
  searchQuery?: string;
}) {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2 w-full">
        <Link
          href={`/users/${user.username}`}
          className="flex-1 min-w-0 block cursor-pointer"
          onClick={() => setIsNavigating(true)}
        >
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isNavigating && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                <Users className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                  <HighlightText text={user.username} highlight={searchQuery} />
                  {user.full_name && (
                    <span className="text-xs text-muted-foreground ml-2 truncate">(<HighlightText text={user.full_name} highlight={searchQuery} />)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {user.email_address && (
                  <p className="text-xs text-muted-foreground truncate min-w-0 max-w-full"><HighlightText text={user.email_address} highlight={searchQuery} /></p>
                )}
                {user.tier && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <HighlightText text={user.tier} highlight={searchQuery} />
                  </span>
                )}
              </div>
            </div>
            {user.created_at && (
              <p className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                <FormattedDate date={user.created_at} format="date" />
              </p>
            )}
          </div>
        </Link>
        {isSuperAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(user)}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-muted-foreground hover:text-primary transition-colors ml-2 whitespace-nowrap"
      >
        {isExpanded ? '▼' : '▶'} Database Info
      </button>
      {isExpanded && (
        <div className="w-full overflow-hidden">
          <div className="ml-2 p-3 rounded-lg bg-muted/20 text-xs space-y-1 font-mono overflow-x-auto">
            <div className="flex gap-2 min-w-0">
              <span className="text-muted-foreground min-w-[100px] flex-shrink-0">UUID:</span>
              <span className="text-foreground break-all min-w-0">{user.id}</span>
            </div>
            <div className="flex gap-2 min-w-0">
              <span className="text-muted-foreground min-w-[100px] flex-shrink-0">User ID:</span>
              <span className="text-foreground break-all min-w-0">{user.user_id}</span>
            </div>
            <div className="flex gap-2 min-w-0">
              <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Username:</span>
              <span className="text-foreground truncate min-w-0">{user.username}</span>
            </div>
            {user.full_name && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Full Name:</span>
                <span className="text-foreground truncate min-w-0">{user.full_name}</span>
              </div>
            )}
            {user.email_address && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Email:</span>
                <span className="text-foreground break-all min-w-0">{user.email_address}</span>
              </div>
            )}
            {user.tier && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Tier:</span>
                <span className="text-foreground truncate min-w-0">{user.tier}</span>
              </div>
            )}
            {user.profile_image_url && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Profile Image:</span>
                <span className="text-foreground break-all min-w-0">{user.profile_image_url}</span>
              </div>
            )}
            {user.created_at && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Created At:</span>
                <span className="text-foreground break-all min-w-0">{user.created_at.toISOString()}</span>
              </div>
            )}
            {user.updated_at && (
              <div className="flex gap-2 min-w-0">
                <span className="text-muted-foreground min-w-[100px] flex-shrink-0">Updated At:</span>
                <span className="text-foreground break-all min-w-0">{user.updated_at.toISOString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// All Users Management Card component  
function AllUsersCard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'recent-edit' | 'alphabetical' | 'most-active'>('recent-edit');
  const [tierFilter, setTierFilter] = React.useState<'all' | 'free' | 'pro' | 'diamond'>('all');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Load users
  React.useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const result = await fetchAllUsersAction(debouncedSearch || undefined, currentPage, sortBy, tierFilter);
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [debouncedSearch, currentPage, sortBy, tierFilter]);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveComplete = () => {
    // Reload users after successful save
    setLoading(true);
    fetchAllUsersAction(debouncedSearch || undefined, currentPage, sortBy, tierFilter)
      .then((result) => {
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Card id="user-management" className="flex flex-col h-[600px] scroll-mt-4">
        <CardHeader className="flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              User Management {isSuperAdmin && <span className="text-xs text-amber-500 ml-2">(Super Admin)</span>}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
              <Input
                placeholder="Search by username, email, tier, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
              />
            </div>
            <Select value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent-edit">Recently Edited</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="most-active">Most Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {users.length} of {total} users {debouncedSearch && `(filtered)`}
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <EditableUserItem
                  key={user.id}
                  user={user}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={handleEdit}
                  searchQuery={debouncedSearch}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {debouncedSearch ? "No users found matching your search" : "No users found"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveComplete}
      />
    </>
  );
}

// Dashboard content component
function DashboardContent() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [topContributors, setTopContributors] = React.useState<TopContributor[]>([]);
  const [tagPipelineMetrics, setTagPipelineMetrics] = React.useState<TagPipelineMetrics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isClearingCache, setIsClearingCache] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [data, superAdminStatus] = await Promise.all([
        fetchAdminDashboardData(),
        checkIsSuperAdmin(),
      ]);
      setStats(data);
      setIsSuperAdmin(superAdminStatus);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = React.useCallback(async () => {
    try {
      const [contributors, pipelineMetrics] = await Promise.all([
        getCachedTopContributors(20),
        getCachedTagPipelineAnalytics(),
      ]);
      setTopContributors(contributors);
      setTagPipelineMetrics(pipelineMetrics);
    } catch (error) {
      console.error("Failed to load advanced analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const handleClearCache = React.useCallback(async () => {
    if (!confirm('Are you sure you want to clear all cache? This will revalidate all cached data across the platform.')) {
      return;
    }

    setIsClearingCache(true);
    try {
      const cacheTags = ['projects', 'user-profile', 'tier', 'analytics', 'tags', 'categories'];
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: cacheTags }),
      });

      if (response.ok) {
        toast.success('Cache cleared successfully! Data will be refreshed.');
        // Reload data after cache clear
        await Promise.all([loadData(), loadAnalytics()]);
      } else {
        toast.error('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('An error occurred while clearing cache.');
    } finally {
      setIsClearingCache(false);
    }
  }, [loadData, loadAnalytics]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadData(), loadAnalytics()]);
    setIsRefreshing(false);
  }, [loadData, loadAnalytics]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load advanced analytics
  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="w-full min-w-0 px-4 2xl:px-8 3xl:px-12 py-8">
        <div className="text-center">
          <p className="text-destructive text-sm md:text-base">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <DashboardLoading />;
  }

  return (
    <div className="w-full min-w-0 px-4 2xl:px-8 3xl:px-12 py-8">
      {/* Dashboard Header with Refresh Button */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base 3xl:text-lg 4xl:text-xl">
              Platform-wide analytics and administration
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="cursor-pointer"
            >
              <X
                className={`h-4 w-4 mr-2 ${isClearingCache ? "animate-spin" : ""}`}
              />
              {isClearingCache ? "Clearing..." : "Clear Cache"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="cursor-pointer"
            >
              <RefreshCcw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatsCard
          title="Total Projects"
          value={stats.stats.totalProjects.toString()}
          description={`${stats.stats.projectStats.activeThisWeek} active this week`}
          icon={<Code className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Active Users"
          value={stats.stats.activeUsers.toString()}
          description="Active in last 7 days"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Total Likes"
          value={stats.stats.projectStats.totalFavorites.toString()}
          description={
            stats.stats.mostPopularProjects[0]
              ? `Most liked: ${stats.stats.mostPopularProjects[0].title}`
              : "No favorites yet"
          }
          icon={<Heart className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Total Tags"
          value={stats.stats.projectStats.totalTags.toString()}
          description={`${stats.submissions.length} pending reviews`}
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <div 
          onClick={() => {
            const el = document.getElementById('user-management');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                  el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 1000);
              }, 500);
            }
          }}
          className="block cursor-pointer"
        >
          <StatsCard
            title="Total Users"
            value={stats.stats.userGrowth.totalUsers.toString()}
            description={`${stats.stats.userGrowth.newUsersThisWeek} joined this week`}
            icon={<Users className="h-4 w-4 text-emerald-500" />}
          />
        </div>
        <div 
          onClick={() => {
            const el = document.getElementById('projects-no-favorites');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                  el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 1000);
              }, 500);
            }
          }}
          className="block cursor-pointer"
        >
          <StatsCard
            title="Avg Favorites/Project"
            value={Math.round(stats.stats.engagementMetrics.avgFavoritesPerProject).toString()}
            description={`${stats.stats.engagementMetrics.projectsWithoutFavorites} projects with no favorites`}
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          />
        </div>
        <div 
          onClick={() => {
            const el = document.getElementById('projects-needing-attention');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                  el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 1000);
              }, 500);
            }
          }}
          className="block cursor-pointer"
        >
          <StatsCard
            title="Avg Tags/Project"
            value={Math.round(stats.stats.engagementMetrics.avgTagsPerProject).toString()}
            description={`${stats.stats.engagementMetrics.projectsWithoutTags} projects without tags`}
            icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          />
        </div>
        <div 
          onClick={() => {
            const el = document.getElementById('new-users-list');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                  el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 1000);
              }, 500);
            }
          }}
          className="block cursor-pointer"
        >
          <StatsCard
            title="New Users (30d)"
            value={stats.stats.userGrowth.newUsersThisMonth.toString()}
            description="Monthly growth"
            icon={<Users className="h-4 w-4 text-amber-500" />}
          />
        </div>
      </div>

      {/* Category Distribution */}
      <Card className="mb-4 md:mb-6 flex flex-col h-[600px]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-base md:text-lg">Project Categories</CardTitle>
          <CardDescription className="text-xs md:text-sm">
          Distribution of projects across categories
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 md:gap-4">
            {stats.stats.categoryDistribution.map((cat) => (
              <CategoryCardItem
                key={cat.category}
                category={cat.category}
                count={cat.count}
                percentage={cat.percentage}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview Chart */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <Card className="mb-4 md:mb-6 flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-base md:text-lg">Projects Overview</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              A comprehensive view of all projects and their favorites
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 md:px-6 flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <Overview
              data={stats.stats.allProjects.map((p) => ({
                name:
                  p.title.length > 20
                    ? p.title.substring(0, 20) + "..."
                    : p.title,
                total: p.total_favorites,
                category: p.category,
                tagCount: Number(p.tag_count),
                owner: p.owner,
                createdAt: p.created_at ? p.created_at.toString() : undefined,
                slug: p.slug,
              }))}
            />
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2 mb-6">
        {/* Activity Card */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="space-y-2">
              {stats.stats.recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={`Project ${activity.action} by ${activity.username}`}
                  timestamp={activity.timestamp}
                  slug={activity.slug}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex-shrink-0">
            <ViewAllActivityButton />
          </CardFooter>
        </Card>

        {/* Projects Needing Attention Card */}
        <Card id="projects-needing-attention" className="flex flex-col h-[600px] scroll-mt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Projects Needing Attention
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.stats.projectsNeedingAttention.length > 0 ? (
              <div className="space-y-2">
                  {stats.stats.projectsNeedingAttention.map((project) => (
                    <ProjectNeedsAttentionItem key={project.id} {...project} />
                  ))}
                </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-12 w-12 mx-auto text-green-500/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  All projects look great! 🎉
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-shrink-0">
            <ViewAllProjectsButton />
          </CardFooter>
        </Card>
      </div>

      {/* Top 10 Most Liked Projects and Projects With No Favorites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top 10 Most Liked Projects */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Top 10 Most Liked Projects
            </CardTitle>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.stats.mostPopularProjects.length > 0 ? (
              <div className="space-y-2">
                {stats.stats.mostPopularProjects.slice(0, 10).map((project, index) => (
                  <MostLikedProjectItem
                    key={project.id}
                    title={project.title}
                    slug={project.slug}
                    favorites={project.favorites}
                    rank={index + 1}
                    owner={project.owner}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No favorited projects yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects With No Favorites */}
        <Card id="projects-no-favorites" className="flex flex-col h-[600px] scroll-mt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Projects With No Favorites
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {stats.stats.allProjects.filter(p => p.total_favorites === 0).length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {stats.stats.allProjects.filter(p => p.total_favorites === 0).length} projects need some love ❤️
                </p>
                {stats.stats.allProjects
                  .filter(p => p.total_favorites === 0)
                  .map((project) => (
                    <NoFavoritesProjectItem
                      key={project.id}
                      title={project.title}
                      slug={project.slug}
                      owner={project.owner}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-green-500/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Great! All projects have received favorites 🎉
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Management and New Users Section */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* User Management - Super Admin Only */}
          <AllUsersCard isSuperAdmin={isSuperAdmin} />
          
          {/* New Users (30d) */}
          <Card id="new-users-list" className="flex flex-col h-[600px] scroll-mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-medium">
                New Users (Last 30 Days)
              </CardTitle>
              <Users className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
              {stats.stats.newUsersList.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {stats.stats.newUsersList.length} new {stats.stats.newUsersList.length === 1 ? 'user' : 'users'} joined in the last 30 days
                  </p>
                  {stats.stats.newUsersList.map((user) => (
                    <NewUserItem
                      key={user.id}
                      id={user.id}
                      user_id={user.user_id}
                      username={user.username}
                      full_name={user.full_name}
                      email_address={user.email_address}
                      tier={user.tier}
                      profile_image_url={user.profile_image_url}
                      created_at={user.created_at}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No new users in the last 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mb-6">
          {/* New Users (30d) - Full width for non-super admins */}
          <Card id="new-users-list" className="flex flex-col h-[600px] scroll-mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-medium">
                New Users (Last 30 Days)
              </CardTitle>
              <Users className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
              {stats.stats.newUsersList.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {stats.stats.newUsersList.length} new {stats.stats.newUsersList.length === 1 ? 'user' : 'users'} joined in the last 30 days
                  </p>
                  {stats.stats.newUsersList.map((user) => (
                    <NewUserItem
                      key={user.id}
                      id={user.id}
                      user_id={user.user_id}
                      username={user.username}
                      full_name={user.full_name}
                      email_address={user.email_address}
                      tier={user.tier}
                      profile_image_url={user.profile_image_url}
                      created_at={user.created_at}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No new users in the last 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tag Submissions Management Section - Full Width */}
      <div className="mt-4 md:mt-6">
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base md:text-lg">
              Tag Submissions for Review
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {stats.submissions.length} pending tag
              {stats.submissions.length !== 1 ? "s" : ""} awaiting approval or
              rejection
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <TagSubmissionManagement initialSubmissions={stats.submissions} />
          </CardContent>
        </Card>
      </div>

      {/* Popular Tags and Tag List Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 md:mt-6">
        {/* Popular Tags */}
        <ClientOnly fallback={<ChartSkeleton />}>
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-base md:text-lg">Popular Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
              <div className="grid grid-cols-2 gap-2">
                {stats.stats.topTags.map((tag) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between p-2.5 bg-muted/10 rounded-lg min-w-0"
                  >
                    <span className="font-medium text-sm truncate">{tag.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ClientOnly>

        {/* Tag List */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-base md:text-xl">Tag List</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <TagList />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <div className="mt-6 md:mt-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Top Contributors Leaderboard - 60% width (3 columns) */}
          <div className="md:col-span-3">
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : (
              <TopContributorsCard contributors={topContributors} />
            )}
          </div>

          {/* Tag Pipeline Analytics - 40% width (2 columns) */}
          <div className="md:col-span-2">
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : tagPipelineMetrics ? (
              <TagPipelineCard metrics={tagPipelineMetrics} />
            ) : null}
          </div>
        </div>

        {/* Top Submitters and Recent Submissions - Below Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Top Tag Submitters */}
          <div>
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : tagPipelineMetrics ? (
              <TopSubmittersCard metrics={tagPipelineMetrics} />
            ) : null}
          </div>

          {/* Recent Tag Submissions */}
          <div>
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : tagPipelineMetrics ? (
              <RecentSubmissionsCard metrics={tagPipelineMetrics} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Admin Test Pages Section */}
      <div className="mt-4 md:mt-6">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-base md:text-xl flex items-center gap-2">
              <Code className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Admin Test Pages
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Developer testing and debugging tools - Admin access only
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-4">
              <a
                href="/api/projects/test"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-3 md:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    <span className="font-semibold text-xs md:text-sm">Project API Test</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-left">
                    Test project API endpoints and functionality
                  </span>
                </Button>
              </a>

              <a
                href="/api/darkmodetest"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-3 md:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    <span className="font-semibold text-xs md:text-sm">Dark Mode Test</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-left">
                    Test dark mode theme components
                  </span>
                </Button>
              </a>

              <a
                href="/api/toasttest"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-3 md:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    <span className="font-semibold text-xs md:text-sm">Toast Test</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-left">
                    Test toast notification system
                  </span>
                </Button>
              </a>

              <Link href="/test-cache">
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-3 md:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    <span className="font-semibold text-xs md:text-sm">Cache Performance</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-left">
                    Test cache performance and efficiency
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading state for the dashboard
function DashboardLoading() {
  return (
    <div className="w-full min-w-0 px-4 2xl:px-8 3xl:px-12 py-8">
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-6 md:h-8 w-[180px] md:w-[200px] mb-2" />
        <Skeleton className="h-3 md:h-4 w-[250px] md:w-[300px]" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6 md:mb-8">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <ChartSkeleton />

      <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:grid-cols-2 mt-4 md:mt-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SidebarProvider>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <SidebarInset className="min-w-0">
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
