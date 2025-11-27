import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { FooterSection } from "@/components/layout/FooterSection";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SuggestTagsLoading() {
  return (
    <SidebarProvider>
      <SignedIn>
        <AppSidebar />
      </SignedIn>
      <SidebarInset>
        <SignedOut>
          <HeaderSectionNoSideBar showMobileMenu={false} />
        </SignedOut>
        <SignedIn>
          <HeaderSection />
        </SignedIn>

        {/* Page Banner Skeleton */}
        <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 mb-0 py-3">
          <div className="rounded-lg border border-indigo-700/40 bg-gradient-to-r from-indigo-900/20 via-blue-800/20 to-purple-800/20 backdrop-blur-sm p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/5 rounded w-96"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 py-8">
          <div className="container max-w-6xl mx-auto">
            <div className="space-y-6">
              {/* Tag Input Card Skeleton */}
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-10 w-44 bg-muted rounded animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                      <div className="w-[180px]"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-muted rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              </div>

              {/* Two Cards Side-by-Side Skeleton */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Requirements Card Skeleton */}
                <div className="lg:w-1/3">
                  <Card className="h-full">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-40 animate-pulse"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-5/6 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-28 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-4/5 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tag Validation Card Skeleton */}
                <div className="lg:w-2/3">
                  <Card className="h-full border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
                        <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] space-y-3">
                        <div className="h-20 bg-muted rounded animate-pulse"></div>
                        <div className="h-20 bg-muted rounded animate-pulse"></div>
                        <div className="h-20 bg-muted rounded animate-pulse"></div>
                        <div className="h-20 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="flex gap-3 justify-center mt-4 pt-4 border-t">
                        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
                        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
