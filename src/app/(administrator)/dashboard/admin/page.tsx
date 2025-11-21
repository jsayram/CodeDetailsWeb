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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TagSubmissionManagement } from "@/components/administrator/TagSubmissionManagement";
import { TagList } from "@/components/TagList";
import { FormattedDate } from "@/lib/FormattedDate";
import { Overview } from "@/components/dashboard/overview";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientOnly } from "@/components/ClientOnly";
import { fetchAdminDashboardData } from "@/app/actions/admin-dashboard";

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
      favorites: number;
    }>;
    recentActivity: Array<{
      id: string;
      title: string;
      action: string;
      username: string;
      timestamp: Date;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({ title, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          <FormattedDate date={timestamp} format="datetime" />
        </p>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
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
  return (
    <Link href={`/projects/${slug}`} className="block">
      <div className="flex flex-col space-y-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate flex-1">{title}</p>
          <span className="text-xs font-semibold text-destructive ml-2">
            {issueCount} issue{issueCount > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">by {owner}</p>
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

// Dashboard content component
function DashboardContent() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAdminDashboardData();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
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
    <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
      {/* Dashboard Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Platform-wide analytics and administration
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4 mb-4 md:mb-6">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4 mb-6 md:mb-8">
        <StatsCard
          title="Total Users"
          value={stats.stats.userGrowth.totalUsers.toString()}
          description={`${stats.stats.userGrowth.newUsersThisWeek} joined this week`}
          icon={<Users className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          title="Avg Favorites/Project"
          value={stats.stats.engagementMetrics.avgFavoritesPerProject.toFixed(
            1
          )}
          description={`${stats.stats.engagementMetrics.projectsWithoutFavorites} projects with no favorites`}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          title="Avg Tags/Project"
          value={stats.stats.engagementMetrics.avgTagsPerProject.toFixed(1)}
          description={`${stats.stats.engagementMetrics.projectsWithoutTags} projects without tags`}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
        />
        <StatsCard
          title="New Users (30d)"
          value={stats.stats.userGrowth.newUsersThisMonth.toString()}
          description="Monthly growth"
          icon={<Users className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Category Distribution */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Project Categories</CardTitle>
          <CardDescription className="text-xs md:text-sm">
          Distribution of projects across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 md:gap-4">
            {stats.stats.categoryDistribution.map((cat) => (
              <div
                key={cat.category}
                className="flex flex-col p-3 md:p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize text-base md:text-lg">
                    {cat.category}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-primary">
                    {cat.count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {cat.percentage}% of all projects
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview Chart */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Projects Overview</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              A comprehensive view of all projects and their favorites
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 md:px-6">
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
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 md:gap-6">
        {/* Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {stats.stats.recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={`Project ${activity.action} by ${activity.username}`}
                  timestamp={activity.timestamp}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center cursor-pointer text-xs md:text-sm"
            >
              View all activity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Projects Needing Attention Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects Needing Attention
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {stats.stats.projectsNeedingAttention.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                <div className="space-y-2">
                  {stats.stats.projectsNeedingAttention.map((project) => (
                    <ProjectNeedsAttentionItem key={project.id} {...project} />
                  ))}
                </div>
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
          <CardFooter>
            <Link href="/projects" className="w-full">
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-center cursor-pointer text-xs md:text-sm"
              >
                View all projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Popular Tags Chart */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <Card className="mt-4 md:mt-6">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {stats.stats.topTags.map((tag) => (
                <div
                  key={tag.name}
                  className="flex items-center justify-between p-3 md:p-4 bg-muted/10 rounded-lg"
                >
                  <span className="font-medium text-sm md:text-base truncate">{tag.name}</span>
                  <span className="text-xs md:text-sm text-muted-foreground ml-2 flex-shrink-0">
                    {tag.count} projects
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Tag Submissions Management Section */}
      <div className="mt-4 md:mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">
              Tag Submissions for Review
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {stats.submissions.length} pending tag
              {stats.submissions.length !== 1 ? "s" : ""} awaiting approval or
              rejection
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[500px] md:max-h-[600px] overflow-y-scroll scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
              <TagSubmissionManagement initialSubmissions={stats.submissions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 md:mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Tag List</CardTitle>
          </CardHeader>
          <CardContent>
            <TagList />
          </CardContent>
        </Card>
      </div>

      {/* Admin Test Pages Section */}
      <div className="mt-4 md:mt-6">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-base md:text-xl flex items-center gap-2">
              <Code className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Admin Test Pages
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Developer testing and debugging tools - Admin access only
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Loading state for the dashboard
function DashboardLoading() {
  return (
    <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
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
    </main>
  );
}

export default function AdminDashboardPage() {
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
