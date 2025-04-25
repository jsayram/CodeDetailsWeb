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
import { PROJECTS_PER_PAGE, CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import Image from "next/image";

export default function MyProjectsShowcase() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const { userTier } = useUserTier(null, user?.id ?? null, false);
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);

  // Determine overall loading state
  const isLoading = !userLoaded || tokenLoading;

  return (
    <>
      {isLoading ? (
        <div className="container mx-auto px-4 py-">
          <ProjectListLoadingState />
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
                  <div className="w-full max-w-7xl px-4">
                    <div className="flex flex-col gap-4 mb-6 py-3">
                      <div className="mb-8">
                        <div className="flex flex-col space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-indigo-900 via-blue-800 to-purple-800 rounded-2xl shadow-lg px-6 py-4 w-full border border-indigo-700/40">
                              <Image
                                src="/images/CodeDetails_IconLogo.png"
                                alt="CodeDetails Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full shadow-md border-2 border-indigo-400 bg-white p-1 animate-pulse"
                              />
                              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <span className="text-lg font-semibold text-indigo-200 tracking-wide drop-shadow-sm">Welcome to</span>
                                <h2 className="text-3xl font-extrabold text-white drop-shadow-lg flex flex-col md:flex-row items-center gap-2">
                                  {user?.fullName}&apos;s <span className="bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">Project Showcase</span>
                                </h2>
                              </div>
                              <div className="ml-0 md:ml-auto mt-2 md:mt-0 w-full md:w-auto flex justify-center md:block">
                                <span className="inline-block px-4 py-2 rounded-xl bg-indigo-700/60 text-indigo-100 font-mono text-xs tracking-widest shadow">{userTier} member</span>
                              </div>
                            </div>
                          </div>
                          <ProjectList
                            currentPage={currentPage}
                            itemsPerPage={PROJECTS_PER_PAGE}
                            showSortingFilters={true}
                            onPageChange={setCurrentPage}
                            showUserProjectsOnly={true}
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