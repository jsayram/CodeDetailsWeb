'use client'
import React, { useMemo } from 'react'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs'
import { getAuthenticatedClient } from '@/services/supabase'
import { useSupabaseToken } from '@/services/clerkService'
import { useUserTier, getAccessibleTiers } from '@/services/tierService'
import { DebugJwt } from '@/components/debug/page'
import { ProjectsProvider } from '@/providers/projects-provider'
import { AuthenticatedProjectList, FreeProjectList, ProjectForm} from '@/components/Projects'
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"

export default function Home() {
  const { user } = useUser(); // auth from clerk
  const { token } = useSupabaseToken();
  const { theme, setTheme } = useTheme();
  
  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => getAuthenticatedClient(token), [token]);
  // Fetch user tier from database using authenticated client
  const { userTier, loading: profileLoading, error: profileError } = useUserTier(authenticatedClient, user?.id ?? null);

  return (
    <ProjectsProvider token={token} userTier={userTier} userId={user?.id ?? null}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 px-6">
          <div className="container flex justify-between items-center">
            <h1 className="text-2xl font-bold">Code Details</h1>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <DebugJwt token={token} />
                  <SignOutButton>
                    <Button variant="outline" size="sm">Sign Out</Button>
                  </SignOutButton>
                </div>
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <Button>Sign In</Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </header>

        <main className="container py-6 px-4">
          <h2 className="text-xl font-bold mb-6">My Projects</h2>
          
          <SignedIn>
            {profileLoading && (
              <div className="text-center text-muted-foreground py-4">
                Loading your subscription tier...
              </div>
            )}
            
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