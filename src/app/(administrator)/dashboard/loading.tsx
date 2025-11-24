import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn } from "@clerk/nextjs";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";

// Loading skeleton for stats card
function StatsCardSkeleton() {
  return (
    <Card className="h-[250px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <Skeleton className="h-12 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-28 mt-3 rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function UserDashboardLoading() {
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

          <main className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
            {/* Dashboard Banner Loading */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-end mb-2">
                  <Skeleton className="h-9 w-24" />
                </div>
                {/* Banner Skeleton */}
                <div className="relative overflow-hidden rounded-2xl border p-6 mb-6">
                  <Skeleton className="h-8 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-full max-w-3xl" />
                </div>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>

            {/* Main Content - Three Columns */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-6">
              {/* Recent Appreciation Card */}
              <Card className="md:col-span-2 xl:col-span-1 flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-4 w-4" />
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
                          <Skeleton className="h-4 w-[80%]" />
                          <Skeleton className="h-8 w-full" />
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
              </Card>

              {/* Popular Tags Card */}
              <Card className="md:col-span-1 xl:col-span-1 flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                  <Skeleton className="h-5 w-[130px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardHeader className="flex-shrink-0 pt-0">
                  <Skeleton className="h-3 w-[200px]" />
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <Skeleton className="h-4 w-[40%]" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* My Projects Section */}
            <Card className="mb-6 flex flex-col h-[600px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <Skeleton className="h-6 w-[180px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card
                      key={i}
                      className="h-[200px] 3xl:h-[440px] flex flex-col"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <CardHeader className="flex-1">
                        <Skeleton className="h-6 w-[80%] mb-3" />
                        <div className="flex gap-1.5">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </CardHeader>
                      <CardContent className="flex justify-end pt-3">
                        <Skeleton className="h-4 w-12" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects I've Favorited */}
            <Card className="mb-6 flex flex-col h-[600px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card
                      key={i}
                      className="h-[200px] 3xl:h-[440px] flex flex-col"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <CardHeader className="flex-1">
                        <Skeleton className="h-6 w-[80%] mb-2" />
                        <Skeleton className="h-3 w-[60%]" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* My Tag Submissions */}
            <Card className="flex flex-col h-[600px] 3xl:h-[1200px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
                <div className="flex-1">
                  <Skeleton className="h-5 w-[180px] mb-2" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-[100px] mb-3" />
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div
                            key={j}
                            className="p-3 rounded-lg bg-muted/30"
                            style={{ animationDelay: `${(i * 3 + j) * 50}ms` }}
                          >
                            <Skeleton className="h-5 w-[70%] mb-2" />
                            <Skeleton className="h-8 w-full mb-2" />
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
