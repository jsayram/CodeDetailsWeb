"use client";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// React Core
import React, { useMemo, useState } from "react";

// Authentication (Clerk)
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

// Custom Services
import { getAuthenticatedClient } from "@/services/supabase";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";

// Application Components and Pages (Custom)
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList, ProjectForm } from "@/components/Projects";

// UI Components (Tailwind CSS) and shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Theme Management
import { PaginatedControls } from "@/components/navigation/Pagination/PaginationControlComponent";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import {
  PROJECTS_PER_PAGE,
  CURRENT_PAGE,
} from "@/components/navigation/Pagination/paginationConstants";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import ProtectedPage from "../../auth/ProtectedPage";
import { PROTECTED_PAGES_TIERS } from "@/app/auth/protectedPageConstants";

export default function DashBoard() {
  const { user, isLoaded: userLoaded } = useUser(); // auth from clerk
  const { token, loading: tokenLoading } = useSupabaseToken();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);

  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => {
    const client = getAuthenticatedClient(token);
    return client;
  }, [token]);

  // Determine overall loading state
  const isLoading = !userLoaded || tokenLoading;

  return (
    <>
      {isLoading ? (
        <div className="container mx-auto px-4 py-16">
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
                          {/* User welcome message */}
                          <Alert className="mb-6 h-[60px]">
                            <AlertDescription className="text-sm flex items-center justify-between">
                              <div>
                                Welcome{" "}
                                {user?.fullName ?? "Code Details Minion"}.
                                Access projects by difficulty level.
                              </div>
                              <div className="flex gap-1">
                                {["beginner", "intermediate", "advanced"].map((difficulty) => (
                                  <Badge
                                    key={difficulty}
                                    variant="secondary"
                                    className="ml-1"
                                  >
                                    {difficulty}
                                  </Badge>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>

                          {/* Pagination component TODO: NEED TO FIX PAGINATION ON MOBILE */}
                          <PaginatedControls   
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            projectType="authenticated"
                          />

                          {/* Display projects for signed-in users with pagination */}
                          <div>
                            <ProjectList
                              projectType="authenticated"
                              currentPage={currentPage}
                              itemsPerPage={PROJECTS_PER_PAGE}
                            />
                          </div>

                          <Card className="mt-6">
                            <CardHeader>
                              <CardTitle>Create New Project</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ProjectForm />
                            </CardContent>
                          </Card>
                        </>
                      </SignedIn>

                      <SignedOut>
                        {/* Pagination component */}
                        <PaginatedControls
                          currentPage={currentPage}
                          setCurrentPage={setCurrentPage}
                          projectType="free"
                        />
                        <Card className="min-h-[300px]">
                          <CardHeader>
                            <CardTitle className="text-center">
                              Explore Projects
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-center mb-6">
                              Sign in to access all projects
                            </p>
                            {/* Display free projects for anonymous users with pagination */}
                            <div>
                              <ProjectList
                                projectType="free"
                                currentPage={currentPage}
                                itemsPerPage={PROJECTS_PER_PAGE}
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
