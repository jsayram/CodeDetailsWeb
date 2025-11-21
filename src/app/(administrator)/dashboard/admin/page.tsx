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

interface ProjectItemProps {
  title: string;
  description: string;
  progress: number;
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
    activeProjects: Array<{
      id: string;
      title: string;
      description: string | null;
      progress: number;
      total_favorites: number;
    }>;
    topTags: Array<{
      name: string;
      count: number;
    }>;
    allProjects: Array<{
      id: string;
      title: string;
      total_favorites: number;
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

// Project item with progress bar
function ProjectItem({ title, description, progress }: ProjectItemProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{progress}%</p>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <DashboardLoading />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform-wide analytics and administration
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.stats.userGrowth.totalUsers.toString()}
          description={`${stats.stats.userGrowth.newUsersThisWeek} joined this week`}
          icon={<Users className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          title="Avg Favorites/Project"
          value={stats.stats.engagementMetrics.avgFavoritesPerProject.toFixed(1)}
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Categories</CardTitle>
          <CardDescription>
            Distribution of projects across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.stats.categoryDistribution.map((cat) => (
              <div
                key={cat.category}
                className="flex flex-col p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize text-lg">
                    {cat.category}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {cat.count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>
              A comprehensive view of all projects and their favorites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${Math.max(600, stats.stats.allProjects.length * 40)}px` }}>
                <Overview
                  data={stats.stats.allProjects.map((p) => ({
                    name:
                      p.title.length > 20
                        ? p.title.substring(0, 20) + "..."
                        : p.title,
                    total: p.total_favorites,
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              className="w-full flex items-center justify-center cursor-pointer"
            >
              View all activity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Projects Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.stats.activeProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  title={project.title}
                  description={project.description || "No description"}
                  progress={project.progress}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center cursor-pointer"
            >
              View all projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Popular Tags Chart */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.stats.topTags.map((tag) => (
                <div
                  key={tag.name}
                  className="flex items-center justify-between p-4 bg-muted/10 rounded-lg"
                >
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {tag.count} projects
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Tag Submissions Management Section */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tag Submissions</CardTitle>
            <CardDescription className="text-sm">
              {stats.submissions.length} pending tag{stats.submissions.length !== 1 ? 's' : ''} for review
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[600px] overflow-y-scroll scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
              <TagSubmissionManagement initialSubmissions={stats.submissions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Test Pages Section */}
      <div className="mt-6">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Admin Test Pages
            </CardTitle>
            <CardDescription>
              Developer testing and debugging tools - Admin access only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/api/projects/test" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Project API Test</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Test project API endpoints and functionality
                  </span>
                </Button>
              </a>
              
              <a href="/api/darkmodetest" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Dark Mode Test</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Test dark mode theme components
                  </span>
                </Button>
              </a>
              
              <a href="/api/toasttest" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Toast Test</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Test toast notification system
                  </span>
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tag List</CardTitle>
          </CardHeader>
          <CardContent>
            <TagList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Loading state for the dashboard
function DashboardLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
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

      <ChartSkeleton />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
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
