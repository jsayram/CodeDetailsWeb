"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList } from "@/components/Projects";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { useState, use } from "react";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { PageBanner } from "@/components/ui/page-banner";
import { Folder } from "lucide-react";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";

interface PageProps {
  params: Promise<{ category: string }> | { category: string };
}

export default function CategoryPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);
  const [decodedCategory, setDecodedCategory] = useState<string>("");

  // Decode and validate the category
  const category = decodeURIComponent(resolvedParams.category);
  const categoryInfo = PROJECT_CATEGORIES[category as keyof typeof PROJECT_CATEGORIES];
  const validatedCategory = Object.keys(PROJECT_CATEGORIES).includes(category) ? 
    category as keyof typeof PROJECT_CATEGORIES : 
    "all";

  // Determine loading state
  const isLoading = !userLoaded || tokenLoading;

  return (
    <ProjectsProvider
      token={token}
      userId={user?.id ?? null}
      isLoading={isLoading}
      initialFilters={{ category: validatedCategory }}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <div className="flex justify-center w-full mb-20">
            <div className="w-full max-w-7xl px-4">
              <div className="flex flex-col gap-4 mb-6 py-3">
                <div className="mb-8">
                  <div className="flex flex-col space-y-4">
                    <PageBanner
                      icon={<Folder className="h-8 w-8 text-primary" />}
                      bannerTitle={`${categoryInfo?.label || category} Projects`}
                      description={categoryInfo?.description || "Browse projects in this category"}
                      isUserBanner={false}
                      gradientFrom="indigo-900"
                      gradientVia="blue-800"
                      gradientTo="purple-800"
                      borderColor="border-indigo-700/40"
                      textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
                    />
                    <ProjectList
                      currentPage={currentPage}
                      showSortingFilters={true}
                      hideCategoryFilter={true}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}