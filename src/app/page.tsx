"use client";
// React Core
import React, { useMemo, useState } from "react";

// Authentication (Clerk)
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

// Custom Services
import { getAuthenticatedClient } from "@/services/supabase";
import { useSupabaseToken } from "@/services/clerkService";
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
import { LoadingState } from "@/components/LoadingState/page";
import { PROJECTS_PER_PAGE, CURRENT_PAGE } from "@/constants/pagination";

export default function Home() {
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
  const isLoading = !userLoaded || tokenLoading || profileLoading;

  return (
    <ProjectsProvider
      token={token}
      userTier={userTier}
      userId={user?.id ?? null}
      isLoading={isLoading}
    >
      <div className="min-h-screen">
        <main className="container py-6 px-4">
          <SignedIn>
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                {profileError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Note</AlertTitle>
                    <AlertDescription>
                      <p>{profileError}</p>
                      <p>Using default 'free' tier access.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* User tier information - matching structure with loading state */}
                <Alert className="mb-6 h-[60px]">
                  <AlertDescription className="text-sm flex items-center justify-between">
                    <div>
                      You are on the{" "}
                      <span className="font-semibold">{userTier}</span> tier.
                    </div>
                    <div className="flex gap-1">
                      {getAccessibleTiers(userTier).map((tier) => (
                        <Badge key={tier} variant="secondary" className="ml-1">
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
            )}
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
                  Sign in to see premium projects and create your own
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
        </main>
      </div>
    </ProjectsProvider>
  );
}
