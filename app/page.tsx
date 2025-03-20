'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useSession,
  useUser
} from '@clerk/nextjs'
import { getAnonymousClient, getAuthenticatedClient} from '@/services/supabase'
import { DebugJwt } from '@/components/debug/page'
import { AddProjectForm } from '@/components/AddProjectForm/page'
import { Project } from '@/types'
import '@/styles/globals.css'

// Define valid tier types
type ValidTier = 'free' | 'pro' | 'diamond';

// Define tier hierarchy with proper typing
const TIER_HIERARCHY: Record<ValidTier, number> = {
  'free': 0,
  'pro': 1,
  'diamond': 2,
  // Add more tiers here if needed in the future (e.g., 'enterprise': 3)
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const { user } = useUser()
  const { session } = useSession()

  // Add state for free projects
  const [freeProjects, setFreeProjects] = useState<Project[]>([])
  const [freeLoading, setFreeLoading] = useState(true)

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Get Supabase clients for anonymous and authenticated access
  const anonymousClient = getAnonymousClient();
  const authenticatedClient = useMemo(() => {
    return getAuthenticatedClient(token);
  }, [token]);
  
  // Initialize user tier state with default value of 'free'
  const [userTier, setUserTier] = useState<ValidTier>('free')

  // Helper function to check if user can access a specific tier
  const canAccessTier = (userTierValue: string, projectTierValue: string) => {
    // Cast to ValidTier if possible, or default to 'free'
    const userTier = (userTierValue as ValidTier) in TIER_HIERARCHY ? (userTierValue as ValidTier) : 'free';
    const projectTier = (projectTierValue as ValidTier) in TIER_HIERARCHY ? (projectTierValue as ValidTier) : 'free';
      
    // Get numeric values from hierarchy
    const userTierLevel = TIER_HIERARCHY[userTier];
    const projectTierLevel = TIER_HIERARCHY[projectTier];
    
    // User can access if their tier level is >= the project's tier level
    return userTierLevel >= projectTierLevel;
  }

  // Helper function to get all accessible tiers for a user
  const getAccessibleTiers = (userTierValue: string) => {
    // Cast to ValidTier if possible, or default to 'free'
    const userTier = (userTierValue as ValidTier) in TIER_HIERARCHY ? (userTierValue as ValidTier) : 'free';
    const userTierLevel = TIER_HIERARCHY[userTier];
    
    // Get all tiers with level <= user's tier level
    return Object.entries(TIER_HIERARCHY)
      .filter(([_, level]) => level <= userTierLevel)
      .map(([tier, _]) => tier);
  }
  
    // Fetch Clerk-Supabase token once
    useEffect(() => {
      const getToken = async () => {
        if (!session) return
        try {
          const newToken = await session.getToken({ template: 'supabase' })
          setToken(newToken)
        } catch (error) {
          console.error('Error getting token from Clerk:', error)
        }
      }
      getToken()
    }, [session])

    // Fetch user tier from Supabase function instead of direct profile access
    useEffect(() => {
      if (!user || !authenticatedClient) return
      
      const fetchUserTier = async () => {
        setProfileLoading(true)
        setProfileError(null)
        
        try {
          // Use a Supabase RPC function to safely get user tier
          const { data, error } = await authenticatedClient
            .rpc('get_user_tier', { user_id_param: user.id })
          
          if (error) {
            console.error('Error fetching user tier:', error)
            setProfileError(`Error fetching tier: ${error.message}`)
            return
          }
          
          if (data) {
            // Validate tier before setting
            if (data === 'free' || data === 'pro' || data === 'diamond') {
              console.log(`User tier from database: ${data}`)
              setUserTier(data as ValidTier)
            } else {
              console.warn(`Unknown tier value: ${data}, defaulting to 'free'`)
              setUserTier('free')
            }
          } else {
            console.log('No tier data found, using default tier: free')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to fetch user tier:', errorMessage)
          setProfileError(`Failed to fetch tier: ${errorMessage}`)
        } finally {
          setProfileLoading(false)
        }
      }
      
      fetchUserTier()
    }, [user, authenticatedClient])

  // Fetch free projects for everyone without requiring authentication
  useEffect(() => {
    const fetchFreeProjects = async () => {
      try {
        setFreeLoading(true)
        const { data, error } = await anonymousClient
          .from('projects')
          .select('*')
          .eq('tier', 'free')
        
        if (error) throw error
        setFreeProjects(data || [])
      } catch (error) {
        console.error('Failed to load free projects:', error)
        setFreeProjects([])
      } finally {
        setFreeLoading(false)
      }
    }

    fetchFreeProjects()
  }, [anonymousClient])

  // Fetch projects based on user's tier
  useEffect(() => {
    if (!user || !authenticatedClient) return

    const fetchAccessibleProjects = async () => {
      try {
        setLoading(true)
        
        // Get all tiers the user can access based on hierarchy
        const accessibleTiers = getAccessibleTiers(userTier);
        
        // Fetch projects for all tiers the user can access
        const { data, error } = await authenticatedClient
          .rpc('get_accessible_projects', { 
            user_tier_param: userTier 
          })
        
        if (error) {
          console.error('Failed to load projects:', error)
          throw error
        }
        
        setProjects(data || [])
      } catch (error) {
        console.error('Failed to load projects:', error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchAccessibleProjects()
  }, [authenticatedClient, user, userTier])

  // Handler to add a newly created project to local state
  const handleProjectAdded = (newProject: Project) => {
    // Only add to visible projects if user can access this tier
    if (canAccessTier(userTier, newProject.tier)) {
      setProjects((prev) => [...prev, newProject])
    }
    
    // Also add to free projects if it's a free tier project
    if (newProject.tier === 'free') {
      setFreeProjects((prev) => [...prev, newProject])
    }
  }

  return (
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

        {/* Form as a separate child component */}
        <AddProjectForm token={token} onProjectAdded={handleProjectAdded} />

        {/* Project List */}
        {loading && <p>Loading projects...</p>}
        {!loading && projects.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Title</th>
                <th className="border p-2">Slug</th>
                <th className="border p-2">Tags</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Tier</th>
                <th className="border p-2">Difficulty</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border">
                  <td className="border p-2">{project.title}</td>
                  <td className="border p-2">{project.slug}</td>
                  <td className="border p-2">{project.tags.join(', ')}</td>
                  <td className="border p-2">{project.description}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.tier === 'free' ? 'bg-green-100 text-green-800' : 
                      project.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                      project.tier === 'diamond' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.tier}
                    </span>
                  </td>
                  <td className="border p-2">{project.difficulty}</td>
                  <td className="border p-2">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No projects found for your tier level</p>
        )}
      </SignedIn>

      {/* SignedOut section - unchanged */}
      <SignedOut>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Explore Free Projects</h2>
          <p className="text-gray-600 mb-6 text-center">
            Sign in to see premium projects and create your own
          </p>
          
          {freeLoading && <p className="text-center">Loading free projects...</p>}
          
          {!freeLoading && freeProjects.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Difficulty</th>
                  <th className="border p-2">Tags</th>
                  <th className="border p-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {freeProjects.map((project) => (
                  <tr key={project.id} className="border hover:bg-gray-50">
                    <td className="border p-2 font-medium">{project.title}</td>
                    <td className="border p-2">{project.description}</td>
                    <td className="border p-2">{project.difficulty}</td>
                    <td className="border p-2">{project.tags.join(', ')}</td>
                    <td className="border p-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {project.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !freeLoading && <p className="text-center">No free projects available at the moment</p>
          )}
        </div>
      </SignedOut>
    </div>
  )
}