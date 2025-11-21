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
  project_id: string;
  project_slug: string;
  project_title: string;
  status: string;
  admin_notes: string | null;
  created_at: Date | null;
  is_now_available: boolean;
  project_tag_count: number;
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
function ProjectCard({
  slug,
  title,
  description,
  total_favorites,
  category,
}: ProjectCardProps) {
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
function FavoriteCard({
  slug,
  title,
  owner_username,
  category,
}: FavoriteCardProps) {
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
}: TagSubmissionCardProps) {
  const statusColor =
    status === "approved"
      ? "default"
      : status === "rejected"
      ? "destructive"
      : "secondary";

  const isProjectAtCapacity = project_tag_count >= MAX_PROJECT_TAGS;

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium">{tag_name}</p>
          <p className="text-xs text-muted-foreground">for {project_title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColor}>{status}</Badge>
          {is_now_available && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
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
                <span className="font-medium">Tag is available,</span> but this project already has the maximum of {MAX_PROJECT_TAGS} tags. Remove a tag first to add this one.
              </p>
              <Link href={`/projects/${project_slug}?edit=true&tag=${encodeURIComponent(tag_name)}`} className="cursor-pointer">
                <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
                  Manage Project Tags
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs text-green-700 dark:text-green-400">
                <span className="font-medium">Good news!</span> This tag was approved for use in the system after further consideration. You can add it to your project.
              </p>
              <Link href={`/projects/${project_slug}?edit=true&tag=${encodeURIComponent(tag_name)}`} className="cursor-pointer">
                <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
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
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {favoriter_profile_image ? (
          <Image
            src={favoriter_profile_image}
            alt={favoriter_username || "User"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          <span className="text-primary">
            {favoriter_username || "Someone"}
          </span>
          {" favorited "}
          <Link
            href={`/projects/${project_slug}`}
            className="hover:underline cursor-pointer"
          >
            {project_title}
          </Link>
        </p>
        {favorited_at && (
          <p className="text-xs text-muted-foreground">
            <FormattedDate date={favorited_at} format="datetime" />
          </p>
        )}
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive">
            Error loading dashboard: {error.message}
          </p>
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
      {/* Dashboard Banner */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="cursor-pointer self-start"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          </div>
          <PageBanner
            icon={<PieChart className="h-8 w-8 text-purple-500" />}
            bannerTitle="Dashboard - Your Personal Analytics Hub"
            description={
              stats.totalProjects > 0
                ? `Welcome back! You've shared ${
                    stats.totalProjects
                  } amazing project${
                    stats.totalProjects > 1 ? "s" : ""
                  } with the community. ${stats.totalFavorites} developers have shown their appreciation with favorites!`
                : "Welcome back! Your creative journey starts here. Share your first project and inspire the community!"
            }
            isUserBanner={false}
            gradientFrom="purple-900"
            gradientVia="indigo-800"
            gradientTo="violet-800"
            borderColor="border-purple-700/40"
            textGradient="from-purple-400 via-indigo-400 to-violet-400"
          />
        </div>
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
              ? `Most liked: ${stats.projectStats.mostPopularProject.title.substring(
                  0,
                  20
                )}...`
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

      {/* Main Content - Three Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Left Column - Recent Appreciation */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Appreciation
            </CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {stats.recentAppreciation && stats.recentAppreciation.length > 0 ? (
              <div className="space-y-2">
                {stats.recentAppreciation
                  .slice(0, 5)
                  .map((appreciation, index) => (
                    <RecentAppreciationItem key={index} {...appreciation} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No favorites yet. Don't worry someone will like your masterpiece soon!
                </p>
              </div>
            )}
          </CardContent>
          {stats.recentAppreciation && stats.recentAppreciation.length > 5 && (
            <CardFooter className="text-xs text-muted-foreground text-center">
              Showing 5 most recent
            </CardFooter>
          )}
        </Card>

        {/* Middle Column - Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
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
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/projects" className="w-full cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-center"
              >
                View all projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Right Column - Popular Tags */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              My Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {stats.topTags.slice(0, 6).map((tag) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between p-2 bg-muted/10 rounded-lg"
                  >
                    <span className="text-sm font-medium truncate">
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {tag.count}
                    </span>
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
              <p className="text-muted-foreground mb-4">
                You haven't created any projects yet
              </p>
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
              <Link
                href="/projects/favorites"
                className="w-full cursor-pointer"
              >
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">My Tag Submissions</CardTitle>
            <CardDescription className="text-sm">
              {stats.myTagSubmissions.length} tag
              {stats.myTagSubmissions.length > 1 ? "s" : ""} submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Tag Contribution Info Accordion */}
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="about-submissions" className="border border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 via-purple/5 to-primary/5">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">About Tag Submissions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">✨ You're a Tag Hero!</span> Every tag you submit is like adding a new superpower to Code Details! When approved, your tags join our global tag library, helping thousands of developers discover incredible projects. You're literally shaping how the community finds and organizes amazing work. So thank you for making Code Details a better place, one tag at a time!
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">💙 Rejections? No big deal!</span> Think of our tag review like quality control for the whole community's benefit. We're just making sure every tag is clean, consistent, and super useful for discovery. It's never about you or your awesome work, it's about keeping our tag system crisp and searchable for everyone. Keep those tag ideas coming!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-yellow-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending ({stats.myTagSubmissions.filter(s => s.status === 'pending').length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter(s => s.status === 'pending').length > 0 ? (
                    stats.myTagSubmissions
                      .filter(s => s.status === 'pending')
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending submissions</p>
                  )}
                </div>
              </div>

              {/* Approved Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-green-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Approved ({stats.myTagSubmissions.filter(s => s.status === 'approved').length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter(s => s.status === 'approved').length > 0 ? (
                    stats.myTagSubmissions
                      .filter(s => s.status === 'approved')
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No approved submissions</p>
                  )}
                </div>
              </div>

              {/* Rejected Submissions Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-1 rounded-full bg-red-500"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Rejected ({stats.myTagSubmissions.filter(s => s.status === 'rejected').length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                  {stats.myTagSubmissions.filter(s => s.status === 'rejected').length > 0 ? (
                    stats.myTagSubmissions
                      .filter(s => s.status === 'rejected')
                      .map((submission, index) => (
                        <TagSubmissionCard key={index} {...submission} />
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No rejected submissions</p>
                  )}
                </div>
              </div>
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
