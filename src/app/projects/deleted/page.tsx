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
import { Skull, Trash2, AlertOctagon } from "lucide-react";

export default function DeletedProjects() {
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
            <SidebarInset className="bg-gray-950">
              <HeaderSection />
              <ProtectedPage allowedTiers={PROTECTED_PAGES_TIERS}>
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full max-w-7xl px-4">
                    <div className="flex flex-col gap-4">
                      <Alert className="flex items-center mb-6 outline-1 py-3 bg-red-950/20 border-red-900">
                        <AlertOctagon className="h-5 w-5 text-red-500 mr-2" />
                        <AlertDescription className="text-sm text-red-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              Project Graveyard 🪦 - Where deleted projects rest in peace
                              <Skull className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
                              <Badge variant="destructive" className="text-sm bg-red-950">
                                {userTier}
                              </Badge>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-gray-900 via-red-950 to-gray-900 rounded-2xl shadow-lg px-6 py-4 w-full border border-red-900/40">
                            <div className="relative">
                              <span className="w-100 h-100 text-red-500 text-5xl">🗑️</span>
                              </div>
                              <div className="absolute -top-2 -right-2">
                            </div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                              <span className="text-lg font-semibold text-red-200/70 tracking-wide drop-shadow-sm flex items-center gap-2">
                                Deleted Projects <Skull className="h-4 w-4" />
                              </span>
                              <h2 className="text-3xl font-extrabold text-gray-400 drop-shadow-lg flex flex-col md:flex-row items-center gap-2">
                                {user?.fullName}&apos;s <span className="bg-gradient-to-r from-red-700 via-gray-600 to-red-900 bg-clip-text text-transparent">Digital Graveyard</span>
                              </h2>
                            </div>
                            <div className="ml-0 md:ml-auto mt-2 md:mt-0 w-full md:w-auto flex justify-center md:block">
                              <span className="inline-block px-4 py-2 rounded-xl bg-red-950/60 text-red-200 font-mono text-xs tracking-widest shadow border border-red-900/30">
                                ⚠️ DELETED ZONE
                              </span>
                            </div>
                          </div>
                        </div>
                        <ProjectList
                          currentPage={currentPage}
                          itemsPerPage={PROJECTS_PER_PAGE}
                          showSortingFilters={true}
                          onPageChange={setCurrentPage}
                          showDeletedOnly={true}
                        />
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