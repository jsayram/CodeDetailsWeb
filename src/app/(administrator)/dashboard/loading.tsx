import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn } from "@clerk/nextjs";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";

// Stats card skeletons that match the exact layouts
function MyProjectsCardSkeleton() {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[80px]" /> {/* "My Projects" */}
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <Skeleton className="h-12 w-12 mb-2" /> {/* Large number */}
        <Skeleton className="h-3 w-[120px] mb-3" /> {/* "updated this week" */}
        <Skeleton className="h-8 w-full rounded-md" /> {/* "View All Projects" button */}
      </CardContent>
    </Card>
  );
}

function FavoritesReceivedCardSkeleton() {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[120px]" /> {/* "Favorites Received" */}
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-row gap-3 overflow-hidden p-4">
        {/* Left side - Total count (w-1/3) */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-1/3 border-r border-border pr-3">
          <Skeleton className="h-9 w-10 mb-1" /> {/* text-4xl number */}
          <Skeleton className="h-3 w-8" /> {/* "Total" */}
        </div>
        {/* Right side - Project list (flex-1) */}
        <div className="flex-1 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1.5">
              <Skeleton className="h-3 w-[65%]" /> {/* Project title */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" /> {/* Heart icon */}
                <Skeleton className="h-3 w-4" /> {/* Count */}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FavoritesGivenCardSkeleton() {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[100px]" /> {/* "Favorites Given" */}
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <Skeleton className="h-12 w-12 mb-2" /> {/* Large number */}
        <Skeleton className="h-3 w-[140px] mb-3" /> {/* "Projects you've favorited ❤️" */}
        <Skeleton className="h-8 w-full rounded-md" /> {/* "View All Favorites" button */}
      </CardContent>
    </Card>
  );
}

function TagsCardSkeleton() {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[60px]" /> {/* "My Tags" */}
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-row gap-4 overflow-hidden p-4">
        {/* Left side - Total count (w-1/2) */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-1/2 border-r border-border pr-4">
          <Skeleton className="h-12 w-8 mb-2" /> {/* text-5xl number */}
          <Skeleton className="h-3 w-[70px]" /> {/* "Unique tags" */}
        </div>
        {/* Right side - Tag badges (flex-1) */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap gap-1.5 content-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-12 rounded-full" /> /* Badge skeletons */
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Project card skeleton - matches h-[200px] 3xl:h-[440px] layout
function ProjectCardSkeleton() {
  return (
    <Card className="h-[200px] 3xl:h-[440px] flex flex-col relative">
      {/* Category badge skeleton */}
      <Skeleton className="absolute top-3 left-3 h-6 w-16 rounded-full" />
      {/* Date and favorites skeleton */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
      </div>
      <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
        <div className="flex flex-col justify-between h-full">
          <Skeleton className="h-5 w-[80%] mb-3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex-shrink-0 pt-3 pb-3" />
    </Card>
  );
}

// Favorite card skeleton
function FavoriteCardSkeleton() {
  return (
    <Card className="h-[200px] 3xl:h-[440px] flex flex-col relative">
      {/* Category badge skeleton */}
      <Skeleton className="absolute top-3 left-3 h-6 w-16 rounded-full" />
      <CardHeader className="flex-1 min-h-0 pb-3 pt-12 px-4">
        <div className="flex flex-col justify-between h-full">
          <Skeleton className="h-5 w-[80%] mb-2" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      </CardHeader>
      <CardFooter className="flex-shrink-0 pt-3 pb-3" />
    </Card>
  );
}

export default function UserDashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SidebarProvider>
        <SignedIn>
        </SignedIn>
        <SidebarInset>
          <main className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
            {/* Dashboard Banner Loading */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-end mb-2">
                  <Skeleton className="h-9 w-24" />
                </div>
                {/* Banner Skeleton - matches PageBanner structure */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/50 rounded-2xl shadow-lg px-6 py-4 w-full border border-muted animate-pulse mb-6">
                  {/* Icon skeleton */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                  {/* Text content skeleton */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 gap-2">
                    <Skeleton className="h-8 w-64 md:w-96" />
                    <Skeleton className="h-4 w-48 md:w-[500px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards Row - 4 columns on xl */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <MyProjectsCardSkeleton />
              <FavoritesReceivedCardSkeleton />
              <FavoritesGivenCardSkeleton />
              <TagsCardSkeleton />
            </div>

            {/* Main Content - Three Columns */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-6">
              {/* Recent Appreciation Card */}
              <Card className="md:col-span-2 xl:col-span-1 flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardHeader className="flex-shrink-0 pt-0">
                  <Skeleton className="h-3 w-[200px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-muted/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-[70%]" />
                          <Skeleton className="h-8 w-full rounded-md" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-4 w-[110px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardHeader className="flex-shrink-0 pt-0">
                  <Skeleton className="h-3 w-[220px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-[55%]" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-[75%]" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Popular Tags Card */}
              <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardHeader className="flex-shrink-0 pt-0">
                  <Skeleton className="h-3 w-[250px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[35%]" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                  {/* Single use tags collapsible skeleton */}
                  <div className="border rounded-lg p-3 mt-3">
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Projects Section */}
            <Card className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <div className="flex-1">
                  <Skeleton className="h-6 w-[200px] mb-1" />
                  <Skeleton className="h-3 w-[180px]" />
                </div>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects I've Favorited */}
            <Card className="mb-6 flex flex-col h-[620px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <div className="flex-1">
                  <Skeleton className="h-6 w-[240px] mb-1" />
                  <Skeleton className="h-3 w-[260px]" />
                </div>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <FavoriteCardSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* My Tag Submissions */}
            <Card className="flex flex-col h-[600px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
                <div className="flex-1">
                  <Skeleton className="h-5 w-[160px] mb-2" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
                {/* About Tag Submissions accordion skeleton */}
                <div className="border border-muted rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
                
                {/* Three columns for tag submissions */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, colIdx) => (
                    <div key={colIdx}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 pr-2">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div
                            key={j}
                            className="p-3 rounded-lg bg-muted/30"
                            style={{ animationDelay: `${(colIdx * 3 + j) * 50}ms` }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Skeleton className="h-5 w-16 rounded-full" />
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-full rounded-md mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>

          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
