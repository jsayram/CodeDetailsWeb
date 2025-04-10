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
import { useUserTier, getAccessibleTiers } from "@/services/tierService";

// Application Components and Pages (Custom)
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList, ProjectForm } from "@/components/Projects";

// UI Components (Tailwind CSS) and shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Theme Management
import { PaginatedControls } from "@/components/PaginatedControls/page";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjestListLoadingState";
import { PROJECTS_PER_PAGE, CURRENT_PAGE } from "@/constants/pagination";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import ProtectedPage from "../auth/ProtectedPage";

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

  // Fetch user tier from database using authenticated client
  const {
    userTier,
    loading: profileLoading,
    error: profileError,
  } = useUserTier(authenticatedClient, user?.id ?? null);

  // Determine overall loading state
  const isLoading = !userLoaded || tokenLoading || profileLoading || !userTier;

  return (  
    <>
    {isLoading ? (
            <div className="container mx-auto px-4 py-16">
              <ProjectListLoadingState />
            </div>
          ) : (
        
    <ProjectsProvider
      token={token}
      userTier={userTier}
      userId={user?.id ?? null}
      isLoading={isLoading}
    >
      <SidebarProvider>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <SidebarInset>
          <HeaderSection />
        
              <ProtectedPage allowedTiers={["diamond"]}>
                {/* Centered content container */}
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full max-w-7xl px-4">
                    {/* Main content */}
                    <div className="flex flex-col gap-4">
                      <SignedIn>
                        <>
                          {profileError && (
                            <Alert variant="destructive" className="mb-4">
                              <AlertTitle>Note</AlertTitle>
                              <AlertDescription>
                                <p>{profileError}</p>
                                <p>
                                  Using default &apos;free&apos; tier access.
                                </p>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* User tier information */}
                          <Alert className="mb-6 h-[60px]">
                            <AlertDescription className="text-sm flex items-center justify-between">
                              <div>
                                Welcome{" "}
                                {user?.fullName ?? "Code Details Minion"}. You
                                have access to the{" "}
                                <span className="font-semibold">
                                  {userTier}
                                </span>{" "}
                                tier.
                              </div>
                              <div className="flex gap-1">
                                {getAccessibleTiers(userTier).map((tier) => (
                                  <Badge
                                    key={tier}
                                    variant="secondary"
                                    className="ml-1"
                                  >
                                    {tier}
                                  </Badge>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>

                          {/* Pagination component */}
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
                              Explore Free Projects
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-center mb-6">
                              Sign in to see premium projects
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
