import { Project } from "@/types/models/project";
import { getClientSideValue } from "@/lib/ClientSideUtils";

// Cache constants
export const FREE_PROJECTS_CACHE_KEY = "free-projects";
export const AUTH_PROJECTS_CACHE_KEY = "auth-projects";
export const CACHE_NAME = "codedeetails-projects";
export const CACHE_VERSION = "v2"; // Increment this when your data schema changes
export const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
export const BACKGROUND_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Cache metadata store
export const METADATA_CACHE_NAME = "codedeetails-metadata";
export const METADATA_KEY = "cache-metadata";

// Interface for our cache metadata
interface CacheMetadata {
  lastUpdated: {
    [key: string]: number;
  };
  expiry: {
    [key: string]: number;
  };
  version: string;
}

/**
 * Gets or creates metadata for our cache
 */
const getOrCreateMetadata = async (): Promise<CacheMetadata> => {
  try {
    const cache = await caches.open(METADATA_CACHE_NAME);
    const response = await cache.match(METADATA_KEY);
    
    if (response) {
      return await response.json();
    }
    
    // If no metadata exists, create a new one
    const metadata: CacheMetadata = {
      lastUpdated: {},
      expiry: {},
      version: CACHE_VERSION
    };
    
    // Store the new metadata
    await updateMetadata(metadata);
    
    return metadata;
  } catch (error) {
    console.error("Error accessing cache metadata:", error);
    
    // Return default metadata
    return {
      lastUpdated: {},
      expiry: {},
      version: CACHE_VERSION
    };
  }
};

/**
 * Updates the metadata for our cache
 */
const updateMetadata = async (metadata: CacheMetadata): Promise<void> => {
  try {
    const cache = await caches.open(METADATA_CACHE_NAME);
    const response = new Response(JSON.stringify(metadata));
    await cache.put(METADATA_KEY, response);
  } catch (error) {
    console.error("Error updating cache metadata:", error);
  }
};

/**
 * Loads cached free projects from Cache Storage if available and valid
 * @returns Array of projects or null if cache is invalid/expired
 */
export const loadCachedFreeProjects = async (
  isBrowser: boolean
): Promise<Project[] | null> => {
  if (!isBrowser) return null;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return null;
    }
    
    // Get metadata to check version and expiry
    const metadata = await getOrCreateMetadata();
    
    if (metadata.version !== CACHE_VERSION) {
      console.log("🔄 Cache version changed, forcing refresh");
      return null;
    }
    
    // Check if cache is expired
    const now = Date.now();
    if (!metadata.expiry[FREE_PROJECTS_CACHE_KEY] || metadata.expiry[FREE_PROJECTS_CACHE_KEY] < now) {
      console.log("Free projects cache expired");
      return null;
    }
    
    // Get the cache
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(FREE_PROJECTS_CACHE_KEY);
    
    if (!response) {
      return null;
    }
    
    const projects = await response.json();
    console.log(`Loaded ${projects.length} free projects from cache`);
    return projects as Project[];
  } catch (error) {
    console.error("Error loading cached free projects:", error);
    return null;
  }
};

/**
 * Loads cached authenticated projects from Cache Storage if available and valid
 * @returns Array of projects or null if cache is invalid/expired
 */
export const loadCachedAuthenticatedProjects = async (
  isBrowser: boolean,
  userId: string | null
): Promise<Project[] | null> => {
  if (!isBrowser || !userId) return null;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return null;
    }
    
    // Get metadata to check version and expiry
    const metadata = await getOrCreateMetadata();
    
    if (metadata.version !== CACHE_VERSION) {
      console.log("🔄 Cache version changed, forcing refresh");
      return null;
    }
    
    const cacheKey = `${AUTH_PROJECTS_CACHE_KEY}_${userId}`;
    
    // Check if cache is expired
    const now = Date.now();
    if (!metadata.expiry[cacheKey] || metadata.expiry[cacheKey] < now) {
      console.log("Authenticated projects cache expired");
      return null;
    }
    
    // Get the cache
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(cacheKey);
    
    if (!response) {
      return null;
    }
    
    const projects = await response.json();
    console.log(`Loaded ${projects.length} authenticated projects from cache for user ${userId}`);
    return projects as Project[];
  } catch (error) {
    console.error("Error loading cached authenticated projects:", error);
    return null;
  }
};

/**
 * Saves free projects to Cache Storage
 * @param projectsToCache Projects to cache
 * @param isBrowser Flag indicating if code is running in browser
 */
export const cacheFreeProjects = async (
  projectsToCache: Project[],
  isBrowser: boolean
): Promise<void> => {
  if (!isBrowser) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    const now = Date.now();
    const expiryTime = now + CACHE_DURATION;
    
    // Update metadata
    const metadata = await getOrCreateMetadata();
    metadata.lastUpdated[FREE_PROJECTS_CACHE_KEY] = now;
    metadata.expiry[FREE_PROJECTS_CACHE_KEY] = expiryTime;
    await updateMetadata(metadata);
    
    // Cache the projects
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(projectsToCache));
    await cache.put(FREE_PROJECTS_CACHE_KEY, response);
    
    console.log(
      "💾 Free projects cached until",
      new Date(expiryTime).toLocaleTimeString(),
      `(${projectsToCache.length} projects)`
    );
  } catch (error) {
    console.error("Error caching free projects:", error);
  }
};

/**
 * Saves authenticated projects to Cache Storage
 * @param projectsToCache Projects to cache
 * @param isBrowser Flag indicating if code is running in browser
 * @param userId User ID to associate with the cache
 */
export const cacheAuthenticatedProjects = async (
  projectsToCache: Project[],
  isBrowser: boolean,
  userId: string | null
): Promise<void> => {
  if (!isBrowser || !userId) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    const cacheKey = `${AUTH_PROJECTS_CACHE_KEY}_${userId}`;
    const now = Date.now();
    const expiryTime = now + CACHE_DURATION;
    
    // Update metadata
    const metadata = await getOrCreateMetadata();
    metadata.lastUpdated[cacheKey] = now;
    metadata.expiry[cacheKey] = expiryTime;
    await updateMetadata(metadata);
    
    // Cache the projects
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(projectsToCache));
    await cache.put(cacheKey, response);
    
    console.log(
      "💾 Authenticated projects cached until",
      new Date(expiryTime).toLocaleTimeString(),
      `(${projectsToCache.length} projects) for user ${userId}`
    );
  } catch (error) {
    console.error("Error caching authenticated projects:", error);
  }
};

/**
 * Checks for data updates in the background
 * @param isBrowser Flag indicating if code is running in browser
 * @param setHasFetchedFreeProjects Function to trigger re-fetch when needed
 * @param getAllFreeProjects Function to fetch all free projects
 */
export const checkForDataUpdates = async (
  isBrowser: boolean,
  setHasFetchedFreeProjects: (fetched: boolean) => void,
  getAllFreeProjects: () => Promise<Project[]>
): Promise<void> => {
  if (!isBrowser) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    // Only check if we have cached data
    const cachedProjects = await loadCachedFreeProjects(isBrowser);
    if (!cachedProjects || cachedProjects.length === 0) return;
    
    // Get the metadata
    const metadata = await getOrCreateMetadata();
    const lastUpdated = metadata.lastUpdated[FREE_PROJECTS_CACHE_KEY];
    
    if (!lastUpdated) return;
    
    const cacheAge = Date.now() - lastUpdated;
    
    // Only check for updates if cache is older than the background refresh interval
    if (cacheAge < BACKGROUND_REFRESH_INTERVAL) return;
    
    console.log("🔍 Checking for updated free projects in background...");
    
    // Get the count of free projects from the database using server action
    const projects = await getAllFreeProjects();
    const projectCount = projects.length;
    
    // Compare the count with our cached data
    if (projectCount !== cachedProjects.length) {
      console.log("🔄 Free projects count changed, refreshing data");
      setHasFetchedFreeProjects(false); // This will trigger a re-fetch
    } else {
      // Update the last checked time even if no changes
      const metadata = await getOrCreateMetadata();
      metadata.lastUpdated[FREE_PROJECTS_CACHE_KEY] = Date.now();
      await updateMetadata(metadata);
      console.log("✅ Free projects are up to date");
    }
  } catch (error) {
    console.error("Error checking for data updates:", error);
  }
};

/**
 * Checks for authenticated projects updates in the background
 */
export const checkForAuthDataUpdates = async (
  isBrowser: boolean,
  userId: string | null,
  setHasFetchedProjects: (fetched: boolean) => void,
  getUserProjects: (userTier: string, userId: string) => Promise<Project[]>,
  userTier: string
): Promise<void> => {
  if (!isBrowser || !userId) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    const cacheKey = `${AUTH_PROJECTS_CACHE_KEY}_${userId}`;
    
    // Only check if we have cached data
    const cachedProjects = await loadCachedAuthenticatedProjects(isBrowser, userId);
    if (!cachedProjects || cachedProjects.length === 0) return;
    
    // Get the metadata
    const metadata = await getOrCreateMetadata();
    const lastUpdated = metadata.lastUpdated[cacheKey];
    
    if (!lastUpdated) return;
    
    const cacheAge = Date.now() - lastUpdated;
    
    // Only check for updates if cache is older than the background refresh interval
    if (cacheAge < BACKGROUND_REFRESH_INTERVAL) return;
    
    console.log("🔍 Checking for updated authenticated projects in background...");
    
    // Get the projects from the database
    const projects = await getUserProjects(userTier, userId);
    const projectCount = projects.length;
    
    // Compare the count with our cached data
    if (projectCount !== cachedProjects.length) {
      console.log("🔄 Authenticated projects count changed, refreshing data");
      setHasFetchedProjects(false); // This will trigger a re-fetch
    } else {
      // Update the last checked time even if no changes
      const metadata = await getOrCreateMetadata();
      metadata.lastUpdated[cacheKey] = Date.now();
      await updateMetadata(metadata);
      console.log("✅ Authenticated projects are up to date");
    }
  } catch (error) {
    console.error("Error checking for authenticated data updates:", error);
  }
};

/**
 * Clears all project caches
 * @param isBrowser Flag indicating if code is running in browser
 */
export const clearProjectsCache = async (isBrowser: boolean): Promise<void> => {
  if (!isBrowser) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    // Delete the entire project cache
    await caches.delete(CACHE_NAME);
    
    // Reset the metadata but keep the version
    const metadata = await getOrCreateMetadata();
    metadata.lastUpdated = {};
    metadata.expiry = {};
    await updateMetadata(metadata);
    
    console.log("🧹 Cleared all project caches");
  } catch (error) {
    console.error("Error clearing project caches:", error);
  }
};

/**
 * Updates a single project in cache without refetching all projects
 */
export const updateProjectInCache = async (
  updatedProject: Project,
  isBrowser: boolean,
  userId: string | null
): Promise<void> => {
  if (!isBrowser) return;
  
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log("Cache API not available");
      return;
    }
    
    // Update in free projects cache if it exists
    const cachedFreeProjects = await loadCachedFreeProjects(isBrowser);
    if (cachedFreeProjects) {
      const updatedFreeProjects = cachedFreeProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      );
      await cacheFreeProjects(updatedFreeProjects, isBrowser);
    }
    
    // Update in authenticated projects cache if it exists
    if (userId) {
      const cachedAuthProjects = await loadCachedAuthenticatedProjects(isBrowser, userId);
      if (cachedAuthProjects) {
        const updatedAuthProjects = cachedAuthProjects.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        );
        await cacheAuthenticatedProjects(updatedAuthProjects, isBrowser, userId);
      }
    }
  } catch (error) {
    console.error("Error updating project in cache:", error);
  }
};
