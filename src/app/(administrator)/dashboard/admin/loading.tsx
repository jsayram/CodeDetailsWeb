import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn } from "@clerk/nextjs";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";

// Loading skeleton for stats card
function StatsCardSkeleton() {
  return (
    <Card className="h-[180px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[150px] mb-1" />
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] flex items-center justify-center bg-muted/5">
          <Skeleton className="h-16 w-16 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardLoading() {
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

          <div className="w-full min-w-0 px-4 2xl:px-8 3xl:px-12 py-8">
            {/* Dashboard Header */}
            <div className="mb-6 md:mb-8">\n              <div className="flex items-center justify-between mb-2">
                <div>
                  <Skeleton className="h-8 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>

            {/* Additional Analytics Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>

            {/* Category Distribution */}
            <Card className="mb-4 md:mb-6 flex flex-col h-[600px]">
              <CardHeader className="flex-shrink-0">
                <Skeleton className="h-5 w-[180px] mb-1" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col p-3 md:p-4 rounded-lg border"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-6 w-[60%]" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                      <Skeleton className="h-3 w-[80%] mb-2" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects Overview Chart */}
            <ChartSkeleton />

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2 my-6">
              {/* Recent Activity Card */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-[60%]" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3 w-[80%]" />
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 border-t">
                  <Skeleton className="h-9 w-full" />
                </div>
              </Card>

              {/* Projects Needing Attention Card */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-muted/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex justify-between mb-2">
                        <Skeleton className="h-4 w-[60%]" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-[40%] mb-2" />
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 border-t">
                  <Skeleton className="h-9 w-full" />
                </div>
              </Card>
            </div>

            {/* Top 10 Most Liked and No Favorites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Most Liked */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-[70%] mb-1" />
                        <Skeleton className="h-3 w-[40%]" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* No Favorites */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-[180px] mb-3" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex-1">
                        <Skeleton className="h-4 w-[60%] mb-1" />
                        <Skeleton className="h-3 w-[40%]" />
                      </div>
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* User Management and New Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* User Management */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex-shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[140px]" />
                    <Skeleton className="h-10 w-[180px]" />
                  </div>
                  <Skeleton className="h-3 w-[200px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex-1 p-2.5 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-4 w-[50%]" />
                        </div>
                        <Skeleton className="h-3 w-[70%]" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </Card>

              {/* New Users */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-[200px] mb-3" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-muted/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-[60%]" />
                      </div>
                      <Skeleton className="h-3 w-[80%]" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Tag Submissions */}
            <Card className="flex flex-col h-[600px] mb-6">
              <CardHeader className="pb-3 flex-shrink-0">
                <Skeleton className="h-5 w-[200px] mb-1" />
                <Skeleton className="h-4 w-[300px]" />
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-muted/30"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-5 w-[30%]" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Popular Tags and Tag List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Popular Tags */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex-shrink-0">
                  <Skeleton className="h-5 w-[120px]" />
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-muted/10"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-[60%]" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tag List */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex-shrink-0">
                  <Skeleton className="h-6 w-[100px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-8 w-full"
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              {/* Top Contributors - 60% */}
              <div className="md:col-span-3">
                <ChartSkeleton />
              </div>

              {/* Tag Pipeline - 40% */}
              <div className="md:col-span-2">
                <ChartSkeleton />
              </div>
            </div>

            {/* Top Submitters and Recent Submissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>

            {/* Admin Test Pages */}
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="flex-shrink-0">
                <Skeleton className="h-5 w-[180px] mb-1" />
                <Skeleton className="h-4 w-[300px]" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 md:p-4 rounded-lg border"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <Skeleton className="h-4 w-[60%] mb-2" />
                      <Skeleton className="h-3 w-[80%]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
