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
  Code,
  Heart,
  Star,
  Tag as TagIcon,
  TrendingUp,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedDate } from "@/lib/FormattedDate";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchUserDashboardData } from "@/app/actions/user-dashboard";
import { useDashboardCache } from "@/hooks/use-dashboard-cache";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

interface ProjectCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  total_favorites: number;
  category: string;
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
  project_title: string;
  status: string;
  created_at: Date | null;
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

// Project card component
function ProjectCard({ slug, title, description, total_favorites, category }: ProjectCardProps) {
  return (
    <Link href={`/projects/${slug}`} className="cursor-pointer">
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description || "No description provided"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Badge variant="outline">{category}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3 w-3" />
            {total_favorites}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

// Favorite card component
function FavoriteCard({ slug, title, owner_username, category }: FavoriteCardProps) {
  return (
    <Link href={`/projects/${slug}`} className="cursor-pointer">
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">by {owner_username}</p>
        </CardHeader>
        <CardFooter>
          <Badge variant="outline">{category}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}

// Tag submission card
function TagSubmissionCard({ tag_name, project_title, status, created_at }: TagSubmissionCardProps) {
  const statusColor = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex-1">
        <p className="text-sm font-medium">{tag_name}</p>
        <p className="text-xs text-muted-foreground">for {project_title}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusColor}>{status}</Badge>
        {created_at && (
          <p className="text-xs text-muted-foreground">
            <FormattedDate date={created_at} format="datetime" />
          </p>
        )}
      </div>
    </div>
  );
}

// Dashboard content component
function DashboardContent() {
  const { data: dashboardData, loading, error, refresh } = useDashboardCache(
    "user-dashboard",
    fetchUserDashboardData,
    []
  );

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive">Error loading dashboard: {error.message}</p>
          <Button onClick={refresh} className="mt-4 cursor-pointer">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <DashboardLoading />;
  }

  const { stats } = dashboardData;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your personal analytics and project overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="My Projects"
          value={stats.totalProjects.toString()}
          description={`${stats.projectStats.activeThisWeek} updated this week`}
          icon={<Code className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Favorites Received"
          value={stats.totalFavorites.toString()}
          description={
            stats.projectStats.mostPopularProject
              ? `Most liked: ${stats.projectStats.mostPopularProject.title.substring(0, 20)}...`
              : "No favorites yet"
          }
          icon={<Heart className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Favorites Given"
          value={stats.totalFavoritesGiven.toString()}
          description="Projects you've favorited"
          icon={<Star className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="My Tags"
          value={stats.projectStats.totalTags.toString()}
          description="Unique tags used"
          icon={<TagIcon className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    title={activity.title}
                    description={`Project ${activity.action}`}
                    timestamp={activity.timestamp}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/projects" className="w-full cursor-pointer">
              <Button variant="ghost" size="sm" className="w-full flex items-center justify-center">
                View all projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">My Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {stats.topTags.slice(0, 6).map((tag) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between p-2 bg-muted/10 rounded-lg"
                  >
                    <span className="text-sm font-medium truncate">{tag.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{tag.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Projects Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.myProjects.slice(0, 6).map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any projects yet</p>
              <Link href="/projects/new" className="cursor-pointer">
                <Button>Create Your First Project</Button>
              </Link>
            </div>
          )}
        </CardContent>
        {stats.myProjects.length > 6 && (
          <CardFooter>
            <Link href="/projects" className="w-full cursor-pointer">
              <Button variant="outline" className="w-full">
                View All My Projects
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>

      {/* Projects I've Favorited */}
      {stats.myFavorites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Projects I've Favorited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.myFavorites.slice(0, 6).map((favorite) => (
                <FavoriteCard key={favorite.id} {...favorite} />
              ))}
            </div>
          </CardContent>
          {stats.myFavorites.length > 6 && (
            <CardFooter>
              <Link href="/projects/favorites" className="w-full cursor-pointer">
                <Button variant="outline" className="w-full cursor-pointer">
                  View All Favorites
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      )}

      {/* My Tag Submissions */}
      {stats.myTagSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Tag Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.myTagSubmissions.map((submission, index) => (
                <TagSubmissionCard key={index} {...submission} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
