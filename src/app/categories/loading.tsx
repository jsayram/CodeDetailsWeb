import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Folder } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="flex justify-center w-full mb-20">
          <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
            <div className="flex flex-col gap-6 mb-6 py-3">
              <PageBanner
                icon={<Folder className="h-8 w-8 text-primary" />}
                bannerTitle="All Categories"
                description="Explore projects organized by category - from web applications to AI/ML and beyond"
                isUserBanner={false}
                gradientFrom="indigo-900"
                gradientVia="blue-800"
                gradientTo="purple-800"
                borderColor="border-indigo-700/40"
                textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
              />

              {/* Main Card with Title and Content */}
              <Card>
                <CardHeader className="text-center space-y-4 pb-4">
                  <CardTitle className="text-3xl font-bold">
                    All Project Categories
                  </CardTitle>
                  <p className="text-muted-foreground text-base">
                    Browse projects by all available categories
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(PROJECT_CATEGORIES).map(
                      ([key, category], index) => (
                        <Card key={key} className="category-card">
                          <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>{category.label}</CardTitle>
                            <Skeleton
                              className="h-6 w-20"
                              style={{ animationDelay: `${index * 100}ms` }}
                            />
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Skeleton
                              className="h-4 w-full"
                              style={{ animationDelay: `${index * 100 + 50}ms` }}
                            />
                            <Skeleton
                              className="h-10 w-full"
                              style={{ animationDelay: `${index * 100 + 100}ms` }}
                            />
                          </CardContent>
                        </Card>
                      )
                    )}
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
