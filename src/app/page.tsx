'use client'
'use client'

// React Core
import React, { useMemo } from 'react'

// Authentication (Clerk)
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs'

// Costom Services
import { getAuthenticatedClient } from '@/services/supabase'
import { useSupabaseToken } from '@/services/clerkService'
import { useUserTier, getAccessibleTiers } from '@/services/tierService'

// Application Components and Pages (Custom) 
import { DebugJwt } from '@/components/debug/page'
import { ProjectsProvider } from '@/providers/projects-provider'
import { AuthenticatedProjectList, FreeProjectList, ProjectForm} from '@/components/Projects'

// Icons
import { MoonIcon, SunIcon } from "lucide-react"

// UI Components (Tailwind CSS) and shadcn/ui components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Theme Management
import { useTheme } from "next-themes"

export default function Home() {
  const { user } = useUser(); // auth from clerk
  const { token } = useSupabaseToken();
  const { theme, setTheme } = useTheme();
  
  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => getAuthenticatedClient(token), [token]);
  // Fetch user tier from database using authenticated client
  const { userTier, loading: profileLoading, error: profileError } = useUserTier(authenticatedClient, user?.id ?? null);

 // Memoize the theme toggle handler to prevent re-renders on every theme change
 const handleThemeToggle = React.useCallback(() => {
  setTheme(theme === "dark" ? "light" : "dark")
}, [theme, setTheme])


  return (
    <ProjectsProvider token={token} userTier={userTier} userId={user?.id ?? null}>
      <div className="min-h-screen">
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