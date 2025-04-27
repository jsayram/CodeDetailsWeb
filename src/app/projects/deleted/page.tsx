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
            <SidebarInset className="bg-background">
              <HeaderSection />
              <ProtectedPage allowedTiers={PROTECTED_PAGES_TIERS}>
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full max-w-7xl px-4">
                    <div className="flex flex-col gap-4">
                      {/* Updated alert styling */}
                      <Alert className="flex items-center mb-6 py-3 bg-destructive/5 border-destructive/30 rounded-xl">
                        <div className="flex flex-col w-full">
                          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                            <div className="relative flex items-center gap-3">
                              <span className="text-4xl">⚰️</span>
                              <Skull className="h-6 w-6 text-destructive absolute -top-2 -right-2" />
                            </div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-grow">
                              <span className="text-lg font-mono text-destructive/90 tracking-wider flex items-center gap-2">
                                Digital Graveyard <Skull className="h-4 w-4" />
                              </span>
                              <h2 className="text-3xl font-extrabold text-destructive/80 font-serif">
                                {user?.fullName}&apos;s Deleted Projects
                              </h2>
                            </div>
                            <div className="ml-0 md:ml-auto mt-2 md:mt-0">
                              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/30">
                                <Badge variant="destructive" className="bg-destructive/20">
                                  Graveyard
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent my-4" />
                          <p className="text-center text-destructive-foreground/60 font-mono text-sm">
                            Where code commits go to rest... but not forever. Projects can be restored or permanently deleted.
                          </p>
                        </div>
                      </Alert>

                      <div className="mb-8">
                        <ProjectList
                          currentPage={currentPage}
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