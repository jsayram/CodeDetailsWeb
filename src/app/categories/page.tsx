"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider, useProjects } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Folder } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Project } from "@/types/models/project";

// Separate component that uses the context
function CategoriesContent() {
  const router = useRouter();
  const { projects, loading } = useProjects();
  const [loadingCategories, setLoadingCategories] = useState<
    Record<string, boolean>
  >({});

  // Count projects per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((project: Project) => {
      if (!project.deleted_at) {
        // Don't count deleted projects
        counts[project.category] = (counts[project.category] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  const handleCategoryClick = (key: string, hasProjects: boolean) => {
    if (!hasProjects) return;
    setLoadingCategories((prev) => ({ ...prev, [key]: true }));
    router.push(`/categories/${encodeURIComponent(key)}`);
  };

  if (loading) {
    return (
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
                  Browse projects by All available categories
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
    );
  }

  return (
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
                Browse projects by all (<span className="text-secondary-foreground font-semibold">{Object.keys(PROJECT_CATEGORIES).length}</span>) available categories that host projects
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PROJECT_CATEGORIES).map(([key, category]) => {
              const count = categoryCounts[key] || 0;
              const hasProjects = count > 0;
              const isLoading = loadingCategories[key];

              return (
                <Card
                  key={key}
                  className={`category-card cursor-pointer ${!hasProjects ? "disabled" : ""}`}
                  onClick={() => handleCategoryClick(key, hasProjects)}
                >
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{category.label}</CardTitle>
                    <Badge
                      variant={hasProjects ? "secondary" : "outline"}
                      className={`category-count ml-2 ${
                        !hasProjects ? "opacity-50" : ""
                      }`}
                    >
                      {count} {count === 1 ? "project" : "projects"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <Button
                      variant={hasProjects ? "default" : "ghost"}
                      className="category-button w-full hover:bg-accent hover:cursor-pointer"
                      disabled={!hasProjects || isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>Loading...</span>
                        </div>
                      ) : hasProjects ? (
                        `Browse ${category.label}`
                      ) : (
                        "No projects yet"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main page component that provides the context
export default function CategoriesIndexPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <CategoriesContent />
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
