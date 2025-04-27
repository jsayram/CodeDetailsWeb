"use client";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// React Core
import React, { use, useMemo, useState } from "react";

// Authentication (Clerk)
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

// Custom Services
import { getAuthenticatedClient } from "@/services/supabase";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";

// Application Components and Pages (Custom)
import { ProjectsProvider } from "@/providers/projects-provider";
import {
  ProjectList,
  ProjectForm,
} from "@/components/Projects";

// UI Components (Tailwind CSS) and shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import {
  CURRENT_PAGE,
} from "@/components/navigation/Pagination/paginationConstants";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import ProtectedPage from "../auth/ProtectedPage";
import { PROTECTED_PAGES_TIERS } from "@/app/auth/protectedPageConstants";
import { useUserTier } from "@/hooks/use-tierServiceClient";
import Image from "next/image";

export default function DashBoard() {
  const { user, isLoaded: userLoaded } = useUser(); // auth from clerk
  const { token, loading: tokenLoading } = useSupabaseToken();
  const { userTier } = useUserTier(null, user?.id ?? null, false); // Fetch user tier

  // At the top of your component
  const [allProjectsPage, setAllProjectsPage] = useState(CURRENT_PAGE);
  const [userProjectsPage, setUserProjectsPage] = useState(CURRENT_PAGE);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => {
    const client = getAuthenticatedClient(token);
    return client;
  }, [token]);

  // Determine overall loading state
  const isLoading = !userLoaded || tokenLoading;

  // Handlers for pagination
  const handleAllProjectsPageChange = (page: number) => {
    setAllProjectsPage(page);
  };

  const handleCurrentPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleProjectAdded = () => {
    setIsProjectFormOpen(false);
  };

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
            <SignedIn>
              <AppSidebar />
            </SignedIn>
            <SidebarInset>
              <HeaderSection />

              <ProtectedPage allowedTiers={PROTECTED_PAGES_TIERS}>
                {/* Centered content container */}
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full max-w-7xl px-4">
                    {/* Main content */}
                    <div className="flex flex-col gap-4">
                      <SignedIn>
                        <>
                          {/* All Projects Section */}

                          <div className="mb-8">
                            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-4">
                              <div className="flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-indigo-900 via-blue-800 to-purple-800 rounded-2xl shadow-lg px-6 py-4 w-full border border-indigo-700/40">
                                <Image
                                  src="/images/CodeDetails_IconLogo.png"
                                  alt="CodeDetails Logo"
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-full shadow-md border-2 border-indigo-400 bg-white p-1 animate-pulse"
                                />
                                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                  <span className="text-lg font-semibold text-indigo-200 tracking-wide drop-shadow-sm">
                                    Welcome to
                                  </span>
                                  <h2 className="text-3xl font-extrabold text-white drop-shadow-lg flex flex-col md:flex-row items-center gap-2">
                                    Community
                                    <span className="bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x ml-2">
                                      Projects
                                    </span>
                                  </h2>
                                </div>

                              </div>
                            </div>
                            <ProjectList
                              currentPage={allProjectsPage}
                              showSortingFilters={true}
                              onPageChange={handleAllProjectsPageChange}
                            />
                          </div>

                          <Dialog
                            open={isProjectFormOpen}
                            onOpenChange={setIsProjectFormOpen}
                          >
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                  Add a new project to share with the community.
                                </DialogDescription>
                              </DialogHeader>
                              <ProjectForm
                                onProjectAdded={handleProjectAdded}
                              />
                            </DialogContent>
                          </Dialog>
                        </>
                      </SignedIn>

                      <SignedOut>
                        <Card className="min-h-[300px]">
                          <CardHeader>
                            <CardTitle className="text-center">
                              Explore Projects
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-center mb-6">
                              Sign in to add your very own projects!
                            </p>
                            {/* Display free projects for anonymous users with pagination */}
                            <div>
                              <ProjectList
                                currentPage={currentPage}
                                onPageChange={handleCurrentPageChange}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </SignedOut>
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
