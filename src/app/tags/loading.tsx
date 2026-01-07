import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Hash, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TagsLoading() {
  // Define fixed widths for skeletons to prevent hydration mismatches
  const activeTagWidths = [120, 108, 106, 123, 92, 119, 119, 138];
  const inactiveTagWidths = [78, 72, 80, 80, 87, 88];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="flex justify-center w-full mb-20">
          <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
            <div className="flex flex-col gap-6 mb-6 py-3">
              <PageBanner
                icon={<Hash className="h-8 w-8 text-primary" />}
                bannerTitle="Browse All Tags"
                description="Discover projects by technology stack and features"
                isUserBanner={false}
                gradientFrom="purple-900"
                gradientVia="indigo-800"
                gradientTo="blue-800"
                borderColor="border-purple-700/40"
                textGradient="from-fuchsia-400 via-purple-400 to-indigo-400"
              />

              {/* Main Card with Title and Search */}
              <Card>
                <CardHeader className="text-center space-y-4 pb-4">
                  <CardTitle className="text-3xl font-bold">
                    All Project Tags
                  </CardTitle>
                  <p className="text-muted-foreground text-base">
                    Browse and search through all available tags
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Input Skeleton */}
                  <div className="relative w-full max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <div className="h-12 bg-muted rounded-xl w-full animate-pulse"></div>
                  </div>

                  <div className="space-y-6">
                  {/* Active Tags Section Skeleton */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>Active Tags</span>
                        <div className="h-6 w-8 bg-muted rounded-full animate-pulse"></div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {activeTagWidths.map((width, i) => (
                          <div
                            key={i}
                            className="h-8 bg-muted rounded-full animate-pulse"
                            style={{
                              width: `${width}px`,
                              animationDelay: `${(i + 1) * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inactive Tags Section Skeleton */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-muted-foreground">Available Tags</span>
                        <div className="h-6 w-8 bg-muted rounded-full animate-pulse"></div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {inactiveTagWidths.map((width, i) => (
                          <div
                            key={i}
                            className="h-8 bg-muted/50 rounded-full animate-pulse"
                            style={{
                              width: `${width}px`,
                              animationDelay: `${(i + 1) * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
