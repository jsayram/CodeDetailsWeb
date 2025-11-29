"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList } from "@/components/Projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import ProtectedPage from "@/app/auth/ProtectedPage";
import { PROTECTED_PAGES_TIERS } from "@/app/auth/protectedPageConstants";
import { useUserTier } from "@/hooks/use-tierServiceClient";
import { useState } from "react";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import Image from "next/image";
import { PageBanner } from "@/components/ui/page-banner";
import { Heart } from "lucide-react";

export default function FavoriteProjects() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const { userTier } = useUserTier(null, user?.id ?? null, false);
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);

  // Determine overall loading state
  const isLoading = !userLoaded || tokenLoading;

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center w-full mb-20">
          <div className="w-full px-4 2xl:px-8 3xl:px-12">
            <div className="flex flex-col gap-4 mb-6 py-3">
              <ProjectListLoadingState />
            </div>
          </div>
        </div>
      ) : (
        <ProjectsProvider
          token={token}
          userId={user?.id ?? null}
          isLoading={isLoading}
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <HeaderSection />
              <ProtectedPage allowedTiers={PROTECTED_PAGES_TIERS}>
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full px-4 2xl:px-8 3xl:px-12">
                    <div className="flex flex-col gap-4 mb-6 py-3">
                      <div className="mb-8">
                        <div className="flex flex-col space-y-4">
                          <PageBanner
                            icon={<Heart className="h-8 w-8 text-red-500 fill-current animate-heartbeat" fill="currentColor" />}
                            userName={user?.fullName || "User"}
                            bannerTitle="Favorite Projects"
                            description="A curated list of projects you've marked as favorites. Easily access and manage the projects you love the most ❤️"
                            userTier={userTier}
                            isUserBanner={true}
                            gradientFrom="indigo-900"
                            gradientVia="blue-800"
                            gradientTo="purple-800"
                            borderColor="border-indigo-700/40"
                            tierBgColor="bg-indigo-700/60"
                            textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
                          />
                          <ProjectList
                            currentPage={currentPage}
                            showSortingFilters={true}
                            onPageChange={setCurrentPage}
                            showFavoritesOnly={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ProtectedPage>
              <FooterSection />
            </SidebarInset>
          </SidebarProvider>
        </ProjectsProvider>
      )}
    </>
  );
}
