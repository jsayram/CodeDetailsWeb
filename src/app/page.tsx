'use client'
import React, { useMemo } from 'react'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs'
import { getAuthenticatedClient } from '@/services/supabase'
import { useSupabaseToken } from '@/services/clerkService'
import { useUserTier, getAccessibleTiers } from '@/services/tierService'
import { DebugJwt } from '@/components/debug/page'
import { ProjectsProvider } from '@/providers/projects-provider'
import { AuthenticatedProjectList, FreeProjectList, ProjectForm} from '@/components/Projects'

export default function Home() {
  const { user } = useUser(); // auth from clerk
  const { token } = useSupabaseToken();
  
  // Get authenticated client with token from clerk using memoization to prevent re-renders
  const authenticatedClient = useMemo(() => getAuthenticatedClient(token), [token]);
  // Fetch user tier from database using authenticated client
  const { userTier, loading: profileLoading, error: profileError } = useUserTier(authenticatedClient, user?.id ?? null);

  return (
    <ProjectsProvider token={token} userTier={userTier} userId={user?.id ?? null}>
      <div className="p-6">
        <header className="flex justify-between items-center mb-4 px-4 py-2">
          <h1 className="text-xl font-bold">My Projects</h1>
          <div className="flex items-center space-x-4 min-w-[150px] justify-end">
            <SignedIn>
              <UserButton />
              <DebugJwt token={token} />
              <SignOutButton />
            </SignedIn>
            <SignedOut>
              <SignInButton />
            </SignedOut>
          </div>
        </header>

        <SignedIn>
          {profileLoading && <p className="text-center text-gray-600">Loading your subscription tier...</p>}
          
          {profileError && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <p><strong>Note:</strong> {profileError}</p>
              <p>Using default 'free' tier access.</p>
            </div>
          )}

          {/* Show user tier information with accessible tiers */}
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              You are on the <span className="font-semibold">{userTier}</span> tier. 
              You can access: {getAccessibleTiers(userTier).map(tier => (
                <span key={tier} className="ml-1 px-2 py-0.5 bg-blue-100 rounded-full text-xs">
                  {tier}
                </span>
              ))}
            </p>
          </div>
          <ProjectForm />
          <AuthenticatedProjectList />
        </SignedIn>

        <SignedOut>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">Explore Free Projects</h2>
            <p className="text-gray-600 mb-6 text-center">
              Sign in to see premium projects and create your own
            </p>
            
            <FreeProjectList />
          </div>
        </SignedOut>
      </div>
    </ProjectsProvider>
  );
}