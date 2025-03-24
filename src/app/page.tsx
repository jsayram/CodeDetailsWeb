'use client'
// React Core
import React, { useMemo } from 'react'

// Authentication (Clerk)
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs'

// Custom Services
import { getAuthenticatedClient } from '@/services/supabase'
import { useSupabaseToken } from '@/services/clerkService'
import { useUserTier, getAccessibleTiers } from '@/services/tierService'

// Application Components and Pages (Custom) 
import { ProjectsProvider } from '@/providers/projects-provider'
import { AuthenticatedProjectList, FreeProjectList, ProjectForm} from '@/components/Projects'

// UI Components (Tailwind CSS) and shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Theme Management
import { useTheme } from "next-themes"

export default function Home() {
  const { user, isLoaded: userLoaded } = useUser(); // auth from clerk
  const { token, loading: tokenLoading } = useSupabaseToken();
  const { theme, setTheme } = useTheme();
  
  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => {
    const client = getAuthenticatedClient(token);
    return client;
  }, [token]);
  
  // Fetch user tier from database using authenticated client
  const { 
    userTier, 
    loading: profileLoading, 
    error: profileError 
  } = useUserTier(authenticatedClient, user?.id ?? null);

  // Memoize the theme toggle handler to prevent re-renders on every theme change
  const handleThemeToggle = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme]);

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
          <h2 className="text-xl font-bold mb-6">My Projects</h2>
          
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

                {/* User tier information */}
                <Alert className="mb-6">
                  <AlertDescription className="text-sm">
                    You are on the <span className="font-semibold">{userTier}</span> tier. 
                    You can access: {getAccessibleTiers(userTier).map(tier => (
                      <Badge key={tier} variant="secondary" className="ml-1">
                        {tier}
                      </Badge>
                    ))}
                  </AlertDescription>
                </Alert>

                <AuthenticatedProjectList />

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
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Explore Free Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-6">
                  Sign in to see premium projects and create your own
                </p>
                <FreeProjectList />
              </CardContent>
            </Card>
          </SignedOut>
        </main>
      </div>
    </ProjectsProvider>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="space-y-4">
      {/* Tier info skeleton */}
      <Alert className="mb-6 animate-pulse">
        <AlertDescription className="text-sm flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-[180px]"></div>
          <div className="flex gap-1">
            <div className="h-5 bg-muted rounded-full w-16"></div>
            <div className="h-5 bg-muted rounded-full w-16"></div>
            <div className="h-5 bg-muted rounded-full w-16"></div>
          </div>
        </AlertDescription>
      </Alert>
      
      {/* Projects grid skeleton */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden">
              <div className="p-6">
                {/* Project title */}
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                
                {/* Project description */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
                
                {/* Project metadata */}
                <div className="flex justify-between items-center mt-6">
                  <div className="h-5 bg-muted rounded-full w-20"></div>
                  <div className="h-8 bg-muted rounded-full w-8"></div>
                </div>
              </div>
              
              {/* Card footer */}
              <div className="h-12 bg-muted/30 p-3 flex justify-end">
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Create project form skeleton */}
        <Card className="mt-6">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-10 bg-muted/50 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-24 bg-muted/50 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-10 bg-muted/50 rounded w-40"></div>
            </div>
            <div className="flex justify-end">
              <div className="h-10 bg-muted rounded w-28"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}