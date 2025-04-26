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
} from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Code,
  Heart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagSubmissionManagement } from "@/components/administrator/TagSubmissionManagement";
import { TagList } from "@/components/TagList";
import { FormattedDate } from "@/lib/FormattedDate";
import { Overview } from "@/components/dashboard/overview";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientOnly } from "@/components/ClientOnly";
import { fetchDashboardData } from "@/app/actions/dashboard";

// Type definitions for the component props
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: Date; // Changed from string to Date
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
  };
  submissions: Array<any>; // Type from getPendingTagSubmissions
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

  React.useEffect(() => {
    async function loadData() {
      const data = await fetchDashboardData();
      setStats(data);
    }
    loadData();
  }, []);

  if (!stats) {
    return <DashboardLoading />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your project dashboard. Here&apos;s an overview of
          your current status.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          description={stats.stats.mostPopularProjects[0] ? `Most liked: ${stats.stats.mostPopularProjects[0].title}` : "No favorites yet"}
          icon={<Heart className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Total Tags"
          value={stats.stats.projectStats.totalTags.toString()}
          description={`${stats.submissions.length} pending reviews`}
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Activity Overview Chart */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Overview data={stats.stats.activeProjects.map(p => ({ name: p.title, total: p.total_favorites }))} />
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
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
              className="w-full flex items-center justify-center"
            >
              View all activity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Projects Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
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
              className="w-full flex items-center justify-center"
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
                <div key={tag.name} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-muted-foreground">{tag.count} projects</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ClientOnly>

      {/* Tag Submissions Management Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tag Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <TagSubmissionManagement initialSubmissions={stats.submissions} />
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
            <Suspense fallback={<DashboardLoading />}>
              <DashboardContent />
            </Suspense>
          </ErrorBoundary>

          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
