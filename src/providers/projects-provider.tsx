'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Project } from '@/types';
import { getAnonymousClient, getAuthenticatedClient } from '@/services/supabase';
import { canAccessTier } from '@/services/tierService';

interface ProjectsContextType {
  projects: Project[];
  freeProjects: Project[];
  loading: boolean;
  freeLoading: boolean;
  handleProjectAdded: (newProject: Project) => void;
  refreshProjects: () => void;
  isAuthenticated: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}

export function ProjectsProvider({ 
  children,
  token,
  userTier,
  userId
}: { 
  children: React.ReactNode;
  token: string | null;
  userTier: string;
  userId: string | null;
}) {
  // State declarations
  const [projects, setProjects] = useState<Project[]>([]);
  const [freeProjects, setFreeProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeLoading, setFreeLoading] = useState(true);
  
  // Add specific states for tracking different loading states
  const [authLoading, setAuthLoading] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);
  const [hasFetchedProjects, setHasFetchedProjects] = useState(false);
  const [hasFetchedFreeProjects, setHasFetchedFreeProjects] = useState(false);
  
  // Auth state tracking
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Track tier state
  const previousTierRef = useRef<string>('');
  const initialTierLoadedRef = useRef(false);
  
  // Get clients
  const anonymousClient = useMemo(() => getAnonymousClient(), []);
  const authenticatedClient = useMemo(() => getAuthenticatedClient(token), [token]);

  // Monitor auth state changes
  useEffect(() => {
    const authenticated = Boolean(userId && token && authenticatedClient);
    
    console.log('🔐 Auth state change:', authenticated ? 'Authenticated' : 'Not authenticated');
    console.log('🧑‍💻 User ID:', userId || 'None');
    console.log('🔑 Token exists:', !!token);
    
    // Only update if the state actually changed
    if (authenticated !== isAuthenticated) {
      console.log(`Auth state changing from ${isAuthenticated} to ${authenticated}`);
      setIsAuthenticated(authenticated);
      
      // Reset loading states when auth changes
      if (authenticated && !isAuthenticated) {
        setLoading(true);
        setTierLoading(true); // Start with tier loading
      }
    }
    
    setAuthLoading(false);
  }, [userId, token, authenticatedClient, isAuthenticated]);

  // Monitor tier loading as a separate process
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;
    
    // Log tier state
    console.log(`🎫 Tier check: current=${userTier || 'none'}`);
    
    // Assume tier is loading until we get a non-empty value
    if (!userTier) {
      setTierLoading(true);
      console.log('⏳ Tier still loading...');
      return;
    }
    
    // We have a tier value, mark tier as loaded
    console.log(`✅ Tier loaded: ${userTier}`);
    setTierLoading(false);
    
    // Check for tier changes
    if (previousTierRef.current && previousTierRef.current !== userTier) {
      console.log(`🔄 Tier changed from ${previousTierRef.current} to ${userTier}`);
      
      // Force refetch when tier changes
      setLoading(true);
      setHasFetchedProjects(false);
    } 
    // Initial tier load (when previousTierRef is empty but userTier exists)
    else if (!previousTierRef.current && userTier && !initialTierLoadedRef.current) {
      console.log(`🔄 Initial tier loaded: ${userTier}, triggering fetch`);
      initialTierLoadedRef.current = true;
      setLoading(true);
      setHasFetchedProjects(false);
    }
    
    // Update tier ref
    previousTierRef.current = userTier;
  }, [userTier, isAuthenticated]);

  // Fetch free projects - simplified to fetch only once
  useEffect(() => {
    // Skip if already fetched or currently fetching
    if (hasFetchedFreeProjects && !freeLoading) {
      console.log('📋 Free projects already fetched once');
      return;
    }
    
    const fetchFreeProjects = async () => {
      // Skip if already fetched successfully
      if (hasFetchedFreeProjects && freeProjects.length > 0) {
        setFreeLoading(false);
        return;
      }
      
      try {
        setFreeLoading(true);
        console.log('🔄 Fetching free projects from database (once only)...');
        
        const { data, error } = await anonymousClient
          .from('projects')
          .select('*')
          .eq('tier', 'free');
        
        if (error) throw error;
        
        console.log(`📦 Fetched ${data?.length || 0} free projects`);
        setFreeProjects(data || []);
        setHasFetchedFreeProjects(true); // Mark as fetched
      } catch (error) {
        console.error('Failed to load free projects:', error);
        if (freeProjects.length === 0) {
          setFreeProjects([]);
        }
      } finally {
        setFreeLoading(false);
      }
    };

    fetchFreeProjects();
  }, [anonymousClient]); // Only depend on the client, not on state variables

  // Fetch authenticated projects only after tier is loaded
  useEffect(() => {
    // Early return checks - clearer conditions
    if (!isAuthenticated) {
      console.log('⏳ Not authenticated yet, waiting...');
      return;
    }
    
    if (tierLoading) {
      console.log('⏳ Tier still loading, waiting...');
      return; 
    }
    
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    // Skip if we already have data
    if (projects.length > 0 && !loading && hasFetchedProjects) {
      console.log('📋 Using existing projects data');
      return;
    }
    
    console.log('✅ All conditions met, fetching authenticated projects...');
    console.log('🔐 Auth state:', isAuthenticated);
    console.log('🎫 User tier:', userTier);
    
    // User is authenticated with a tier, and we need fresh data
    const fetchAccessibleProjects = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching authenticated projects with tier:', userTier);
        
        const { data, error } = await authenticatedClient!
          .rpc('get_accessible_projects', { 
            user_tier_param: userTier 
          });
        
        if (error) {
          console.error('Failed to load projects:', error);
          throw error;
        }
        
        const projectCount = data?.length || 0;
        console.log(`📦 Fetched ${projectCount} accessible projects`);
        
        // Always update projects, even if empty
        setProjects(data || []);
        setHasFetchedProjects(true);
        
        if (projectCount === 0) {
          console.log('⚠️ No projects returned for tier:', userTier);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        if (projects.length === 0) {
          setProjects([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccessibleProjects();
  }, [
    isAuthenticated, 
    authLoading,
    tierLoading,
    authenticatedClient, 
    userTier, 
    loading,
    hasFetchedProjects,
    projects.length
  ]);

  // Force refresh function - updated to handle free projects refresh
  const refreshProjects = useCallback(() => {
    console.log('🔄 Manually refreshing projects...');
    setHasFetchedProjects(false);
    setHasFetchedFreeProjects(false); // Reset free projects flag too
    setLoading(true);
    setFreeLoading(true);
  }, []);

  // Handler to add a new project
  const handleProjectAdded = useCallback((newProject: Project) => {
    console.log('+ Adding new project to state:', newProject.title);
    
    // Only add to visible projects if user can access this tier
    if (canAccessTier(userTier, newProject.tier)) {
      setProjects((prev) => [...prev, newProject]);
    }
    
    // Also add to free projects if it's a free tier project
    if (newProject.tier === 'free') {
      setFreeProjects((prev) => [...prev, newProject]);
    }
  }, [userTier]);

  // Memoize the context value to prevent unnecessary renders
  const value = useMemo(() => ({
    projects,
    freeProjects,
    loading,
    freeLoading,
    handleProjectAdded,
    refreshProjects,
    isAuthenticated
  }), [
    projects, 
    freeProjects, 
    loading, 
    freeLoading, 
    handleProjectAdded, 
    refreshProjects,
    isAuthenticated
  ]);

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}