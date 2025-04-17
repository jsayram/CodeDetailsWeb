import { Project } from "@/types/models/project";
import { getClientSideValue } from "@/lib/ClientSideUtils";
import { ValidTier } from "@/services/tierServiceServer";

// Cache constants
export const PROJECTS_CACHE_KEY = "cached_projects";
export const AUTH_PROJECTS_CACHE_KEY = "cached_auth_projects";
export const PROJECTS_CACHE_EXPIRY_KEY = "projects_cache_expiry";
export const AUTH_CACHE_EXPIRY_KEY = "auth_projects_cache_expiry";
export const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
export const PROJECTS_CACHE_VERSION_KEY = "projects_cache_version";
export const AUTH_CACHE_VERSION_KEY = "auth_projects_cache_version";
export const CACHE_VERSION = "1.1"; // Increment this when your data schema changes
export const PROJECTS_CACHE_LAST_UPDATED_KEY = "projects_last_updated";
export const AUTH_CACHE_LAST_UPDATED_KEY = "auth_projects_last_updated";
export const BACKGROUND_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
export const BACKGROUND_CHECK_DEBOUNCE = 60 * 1000; // 1 minute debounce for background checks
export const CLICK_DEBOUNCE_TIME = 5000; // 5 seconds debounce for UI-triggered checks

// User tier cache constants
export const USER_TIER_CACHE_KEY = "cached_user_tier";
export const USER_TIER_EXPIRY_KEY = "user_tier_cache_expiry";
export const USER_TIER_VERSION_KEY = "user_tier_cache_version";
export const USER_TIER_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes in milliseconds
export const USER_TIER_FETCH_DEBOUNCE = 500; // 500ms debounce for fetch calls

// We'll use this to prevent multiple background checks from running at the same time
let lastAuthCheckTime = 0;
let lastProjectsCheckTime = 0;
let isCheckingAuth = false;
let isCheckingProjects = false;
let lastUIInteractionTime = 0;

// User tier cache tracking
let userTierRequestInProgress = false;

/**
 * Loads cached projects from localStorage if available and valid
 * @returns Array of projects or null if cache is invalid/expired
 */
export const loadCachedProjects = async (
  isBrowser: boolean
): Promise<Project[] | null> => {
  if (!isBrowser) return null;

  try {
    // Check cache version first
    const cacheVersion = localStorage.getItem(PROJECTS_CACHE_VERSION_KEY);
    if (cacheVersion !== CACHE_VERSION) {
      console.log("🔄 Cache version changed, forcing refresh");
      return null;
    }

    const cachedExpiry = localStorage.getItem(PROJECTS_CACHE_EXPIRY_KEY);

    // Check if cache is expired
    const now = getClientSideValue(() => Date.now(), 0);
    if (!cachedExpiry || parseInt(cachedExpiry) < now) {
      console.log("Projects cache expired");
      return null;
    }

    const cachedProjects = localStorage.getItem(PROJECTS_CACHE_KEY);
    if (!cachedProjects) return null;

    const projects = JSON.parse(cachedProjects);
    console.log(`Loaded ${projects.length} projects from localStorage`);
    return projects as Project[];
  } catch (error) {
    console.error("Error loading cached projects:", error);
    return null;
  }
};

/**
 * Loads cached authenticated projects from localStorage if available and valid
 * @returns Array of projects or null if cache is invalid/expired
 */
export const loadCachedAuthenticatedProjects = async (
  isBrowser: boolean,
  userId: string | null
): Promise<Project[] | null> => {
  if (!isBrowser || !userId) return null;

  try {
    const cacheVersionKey = `${AUTH_CACHE_VERSION_KEY}_${userId}`;
    const cacheKey = `${AUTH_PROJECTS_CACHE_KEY}_${userId}`;
    const expiryKey = `${AUTH_CACHE_EXPIRY_KEY}_${userId}`;

    // Check cache version first
    const cacheVersion = localStorage.getItem(cacheVersionKey);
    if (cacheVersion !== CACHE_VERSION) {
      console.log("🔄 Auth cache version changed, forcing refresh");
      return null;
    }

    const cachedExpiry = localStorage.getItem(expiryKey);

    // Check if cache is expired
    const now = getClientSideValue(() => Date.now(), 0);
    if (!cachedExpiry || parseInt(cachedExpiry) < now) {
      console.log("Authenticated projects cache expired");
      return null;
    }

    const cachedProjects = localStorage.getItem(cacheKey);
    if (!cachedProjects) return null;

    const projects = JSON.parse(cachedProjects);
    console.log(
      `Loaded ${projects.length} authenticated projects from localStorage for user ${userId}`
    );
    return projects as Project[];
  } catch (error) {
    console.error("Error loading cached authenticated projects:", error);
    return null;
  }
};

/**
 * Saves projects to localStorage
 * @param projectsToCache Projects to cache
 * @param isBrowser Flag indicating if code is running in browser
 */
export const cacheProjects = async (
  projectsToCache: Project[],
  isBrowser: boolean
): Promise<void> => {
  if (!isBrowser) return;

  try {
    // Update the UI interaction timestamp to avoid immediate background checks
    lastUIInteractionTime = getClientSideValue(() => Date.now(), 0);

    // Only use Date.now() on client to prevent SSR issues and hydration errors
    const now = getClientSideValue(() => Date.now(), 0);
    const expiryTime = now + CACHE_DURATION;

    localStorage.setItem(
      PROJECTS_CACHE_KEY,
      JSON.stringify(projectsToCache)
    );
    localStorage.setItem(PROJECTS_CACHE_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(PROJECTS_CACHE_VERSION_KEY, CACHE_VERSION);
    localStorage.setItem(PROJECTS_CACHE_LAST_UPDATED_KEY, now.toString());

    console.log(
      "💾 Projects cached until",
      // hydration error fix always wrap date in getClientSideValue
      getClientSideValue(
        () => new Date(expiryTime).toLocaleTimeString(),
        "[Time will display client-side]"
      ),
      `(${projectsToCache.length} projects)`
    );
  } catch (error) {
    console.error("Error caching projects:", error);
  }
};

/**
 * Saves authenticated projects to localStorage
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
    const cacheKey = `${AUTH_PROJECTS_CACHE_KEY}_${userId}`;
    const cacheVersionKey = `${AUTH_CACHE_VERSION_KEY}_${userId}`;
    const expiryKey = `${AUTH_CACHE_EXPIRY_KEY}_${userId}`;
    const lastUpdatedKey = `${AUTH_CACHE_LAST_UPDATED_KEY}_${userId}`;

    // Only use Date.now() on client to prevent SSR issues and hydration errors
    const now = getClientSideValue(() => Date.now(), 0);
    const expiryTime = now + CACHE_DURATION;

    localStorage.setItem(cacheKey, JSON.stringify(projectsToCache));
    localStorage.setItem(expiryKey, expiryTime.toString());
    localStorage.setItem(cacheVersionKey, CACHE_VERSION);
    localStorage.setItem(lastUpdatedKey, now.toString());

    console.log(
      "💾 Authenticated projects cached until",
      // hydration error fix always wrap date in getClientSideValue
      getClientSideValue(
        () => new Date(expiryTime).toLocaleTimeString(),
        "[Time will display client-side]"
      ),
      `(${projectsToCache.length} projects) for user ${userId}`
    );
  } catch (error) {
    console.error("Error caching authenticated projects:", error);
  }
};

/**
 * Checks for data updates in the background
 * @param isBrowser Flag indicating if code is running in browser
 * @param setHasFetchedProjects Function to trigger re-fetch when needed
 * @param getAllProjects Function to fetch all projects
 */
export const checkForDataUpdates = async (
  isBrowser: boolean,
  setHasFetchedProjects: (fetched: boolean) => void,
  getAllProjects: () => Promise<Project[]>
): Promise<void> => {
  if (!isBrowser) return;

  try {
    // Prevent checks if user just interacted with the UI
    const now = getClientSideValue(() => Date.now(), 0);
    if (now - lastUIInteractionTime < CLICK_DEBOUNCE_TIME) {
      console.log(
        "🛑 Skipping projects check - UI was just interacted with"
      );
      return;
    }

    // Prevent multiple concurrent checks
    if (isCheckingProjects) {
      console.log("🛑 Projects check already in progress, skipping");
      return;
    }

    // Add debounce to prevent frequent checks
    if (now - lastProjectsCheckTime < BACKGROUND_CHECK_DEBOUNCE) {
      console.log("🛑 Projects check ran too recently, skipping");
      return;
    }

    // Only check if we have cached data
    const cachedProjects = await loadCachedProjects(isBrowser);
    if (!cachedProjects || cachedProjects.length === 0) return;

    const lastUpdated = localStorage.getItem(PROJECTS_CACHE_LAST_UPDATED_KEY);
    if (!lastUpdated) return;

    const cacheAge = now - parseInt(lastUpdated);

    // Only check for updates if cache is older than the background refresh interval
    if (cacheAge < BACKGROUND_REFRESH_INTERVAL) return;

    // Set flags to indicate we're starting a check
    isCheckingProjects = true;
    lastProjectsCheckTime = now;

    console.log("🔍 Checking for updated projects in background...");

    try {
      // Get projects from the database using server action
      const projects = await getAllProjects();
      const projectCount = projects.length;

      // Compare the count with our cached data
      if (projectCount !== cachedProjects.length) {
        console.log("🔄 Projects count changed, refreshing data");
        setHasFetchedProjects(false); // This will trigger a re-fetch
      } else {
        // Update the last checked time even if no changes
        localStorage.setItem(PROJECTS_CACHE_LAST_UPDATED_KEY, now.toString());
        console.log("✅ Projects are up to date");
      }
    } finally {
      // Always reset flag when done
      isCheckingProjects = false;
    }
  } catch (error) {
    console.error("Error checking for data updates:", error);
    isCheckingProjects = false;
  }
};

/**
 * Checks for authenticated projects updates in the background
 */
export const checkForAuthDataUpdates = async (
  isBrowser: boolean,
  userId: string | null,
  setHasFetchedProjects: (fetched: boolean) => void,
  getUserProjects: (userId: string) => Promise<Project[]>,
): Promise<void> => {
  if (!isBrowser || !userId) return;

  try {
    // Prevent checks if user just interacted with the UI
    const now = getClientSideValue(() => Date.now(), 0);
    if (now - lastUIInteractionTime < CLICK_DEBOUNCE_TIME) {
      console.log(
        "🛑 Skipping auth projects check - UI was just interacted with"
      );
      return;
    }

    // Add debounce to prevent multiple checks from running at the same time
    if (isCheckingAuth) {
      console.log("🛑 Auth check already in progress, skipping");
      return;
    }

    // Prevent running checks too frequently (debounce)
    if (now - lastAuthCheckTime < BACKGROUND_CHECK_DEBOUNCE) {
      console.log("🛑 Auth check ran too recently, skipping");
      return;
    }

    // Set the flag to indicate we're starting a check
    isCheckingAuth = true;
    lastAuthCheckTime = now;

    const lastUpdatedKey = `${AUTH_CACHE_LAST_UPDATED_KEY}_${userId}`;

    // Only check if we have cached data
    const cachedProjects = await loadCachedAuthenticatedProjects(
      isBrowser,
      userId
    );
    if (!cachedProjects || cachedProjects.length === 0) {
      isCheckingAuth = false;
      return;
    }

    const lastUpdated = localStorage.getItem(lastUpdatedKey);
    if (!lastUpdated) {
      isCheckingAuth = false;
      return;
    }

    const cacheAge = now - parseInt(lastUpdated);

    // Only check for updates if cache is older than the background refresh interval
    if (cacheAge < BACKGROUND_REFRESH_INTERVAL) {
      console.log("🔄 Cache too fresh, skipping auth check");
      isCheckingAuth = false;
      return;
    }

    console.log(
      "🔍 Checking for updated authenticated projects in background..."
    );

    try {
      // Get the projects from the database
      const projects = await getUserProjects(userId);
      const projectCount = projects.length;

      console.log(
        `Comparing: Cache has ${cachedProjects.length}, DB has ${projectCount}`
      );

      // Compare the count with our cached data
      if (projectCount !== cachedProjects.length) {
        console.log("🔄 Authenticated projects count changed, refreshing data");

        // Always update the cache directly instead of triggering a refetch
        // This prevents the infinite loop
        await cacheAuthenticatedProjects(projects, isBrowser, userId);

        // Only trigger a re-fetch if the difference is significant
        // This prevents constantly triggering re-fetches for minor changes
        const difference = Math.abs(projectCount - cachedProjects.length);
        if (difference > 2) {
          // Only refetch if more than 2 projects different
          setHasFetchedProjects(false); // Trigger a UI refresh
        }
      } else {
        // Update the last checked time even if no changes
        localStorage.setItem(lastUpdatedKey, now.toString());
        console.log("✅ Authenticated projects are up to date");
      }
    } catch (error) {
      console.error("Error during projects comparison:", error);
    } finally {
      // Reset the flag when done
      isCheckingAuth = false;
    }
  } catch (error) {
    console.error("Error checking for authenticated data updates:", error);
    // Always reset the flag even if there's an error
    isCheckingAuth = false;
  }
};

/**
 * Clears all project caches
 * @param isBrowser Flag indicating if code is running in browser
 */
export const clearProjectsCache = async (isBrowser: boolean): Promise<void> => {
  if (!isBrowser) return;

  try {
    // Clear projects cache
    localStorage.removeItem(PROJECTS_CACHE_KEY);
    localStorage.removeItem(PROJECTS_CACHE_EXPIRY_KEY);
    localStorage.removeItem(PROJECTS_CACHE_VERSION_KEY);
    localStorage.removeItem(PROJECTS_CACHE_LAST_UPDATED_KEY);

    // Look for any auth project caches as well
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(AUTH_PROJECTS_CACHE_KEY) ||
          key.startsWith(AUTH_CACHE_EXPIRY_KEY) ||
          key.startsWith(AUTH_CACHE_VERSION_KEY) ||
          key.startsWith(AUTH_CACHE_LAST_UPDATED_KEY))
      ) {
        localStorage.removeItem(key);
      }
    }

    console.log("🧹 Cleared all project caches from localStorage");
  } catch (error) {
    console.error("Error clearing project caches:", error);
  }
};

/**
 * Updates a single project in cache without refetching all projects
 * @returns Boolean indicating whether the cache was successfully updated
 */
export const updateProjectInCache = async (
  updatedProject: Project,
  isBrowser: boolean,
  userId: string | null
): Promise<boolean> => {
  if (!isBrowser) return false;

  try {
    // Update the UI interaction timestamp to avoid immediate background checks
    lastUIInteractionTime = getClientSideValue(() => Date.now(), 0);
    
    let generalCacheUpdated = false;
    let authCacheUpdated = false;
    
    // Update in general projects cache if it exists
    const cachedProjects = await loadCachedProjects(isBrowser);
    if (cachedProjects) {
      const updatedProjects = cachedProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      );
      await cacheProjects(updatedProjects, isBrowser);
      
      // Verify the update was applied
      const verifyCache = await loadCachedProjects(isBrowser);
      if (verifyCache) {
        const updatedInCache = verifyCache.find(p => p.id === updatedProject.id);
        if (updatedInCache) {
          console.log("✅ General cache successfully updated with project:", updatedProject.title);
          generalCacheUpdated = true;
        }
      }
    }

    // Update in authenticated projects cache if it exists
    if (userId) {
      const cachedAuthProjects = await loadCachedAuthenticatedProjects(
        isBrowser,
        userId
      );
      if (cachedAuthProjects) {
        const updatedAuthProjects = cachedAuthProjects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        );
        await cacheAuthenticatedProjects(
          updatedAuthProjects,
          isBrowser,
          userId
        );
        
        // Verify the update was applied to auth cache
        const verifyAuthCache = await loadCachedAuthenticatedProjects(isBrowser, userId);
        if (verifyAuthCache) {
          const updatedInAuthCache = verifyAuthCache.find(p => p.id === updatedProject.id);
          if (updatedInAuthCache) {
            console.log("✅ Auth cache successfully updated with project:", updatedProject.title);
            authCacheUpdated = true;
          }
        }
      }
    }
    
    // If user is authenticated, we only care about auth cache. Otherwise, general cache.
    const updateSuccess = userId ? authCacheUpdated : generalCacheUpdated;
    
    if (updateSuccess) {
      console.log("💾 Project update successfully saved in cache");
    } else {
      console.warn("⚠️ Project update may not have been saved in cache");
    }
    
    return updateSuccess;
  } catch (error) {
    console.error("❌ Error updating project in cache:", error);
    return false;
  }
};

/**
 * Update the last interaction time to prevent immediate background checks after UI activity
 */
export const updateLastInteractionTime = (): void => {
  lastUIInteractionTime = Date.now();
};

/**
 * Loads cached user tier from localStorage if available and valid
 * @returns User tier or null if cache is invalid/expired
 */
export const loadCachedUserTier = (
  isBrowser: boolean,
  userId: string | null
): ValidTier | null => {
  if (!isBrowser || !userId) return null;

  try {
    // Use user-specific keys
    const cacheKey = `${USER_TIER_CACHE_KEY}_${userId}`;
    const expiryKey = `${USER_TIER_EXPIRY_KEY}_${userId}`;
    const versionKey = `${USER_TIER_VERSION_KEY}_${userId}`;

    // Check cache version first
    const cacheVersion = localStorage.getItem(versionKey);
    if (cacheVersion !== CACHE_VERSION) {
      console.log("🎫 User tier cache version changed, forcing refresh");
      return null;
    }

    const cachedExpiry = localStorage.getItem(expiryKey);

    // Check if cache is expired
    const now = getClientSideValue(() => Date.now(), 0);
    if (!cachedExpiry || parseInt(cachedExpiry) < now) {
      console.log("🎫 User tier cache expired");
      return null;
    }

    const cachedTier = localStorage.getItem(cacheKey);
    if (!cachedTier) return null;

    console.log(`🎫 Using cached tier for user ${userId}: ${cachedTier}`);
    return cachedTier as ValidTier;
  } catch (error) {
    console.error("🎫 Error loading cached user tier:", error);
    return null;
  }
};

/**
 * Saves user tier to localStorage
 */
export const cacheUserTier = (
  userTier: ValidTier,
  isBrowser: boolean,
  userId: string | null
): void => {
  if (!isBrowser || !userId) return;

  try {
    // Use user-specific keys
    const cacheKey = `${USER_TIER_CACHE_KEY}_${userId}`;
    const expiryKey = `${USER_TIER_EXPIRY_KEY}_${userId}`;
    const versionKey = `${USER_TIER_VERSION_KEY}_${userId}`;

    // Update the UI interaction timestamp to avoid immediate background checks
    lastUIInteractionTime = getClientSideValue(() => Date.now(), 0);

    // Only use Date.now() on client to prevent SSR issues
    const now = getClientSideValue(() => Date.now(), 0);
    const expiryTime = now + USER_TIER_CACHE_DURATION;

    localStorage.setItem(cacheKey, userTier);
    localStorage.setItem(expiryKey, expiryTime.toString());
    localStorage.setItem(versionKey, CACHE_VERSION);

    console.log(
      "🎫 User tier cached until",
      getClientSideValue(
        () => new Date(expiryTime).toLocaleTimeString(),
        "[Time will display client-side]"
      ),
      `(${userTier}) for user ${userId}`
    );
  } catch (error) {
    console.error("🎫 Error caching user tier:", error);
  }
};

/**
 * Clears user tier cache for specific user or all users
 */
export const clearUserTierCache = (
  isBrowser: boolean,
  userId: string | null = null
): void => {
  if (!isBrowser) return;

  try {
    if (userId) {
      // Clear specific user's tier cache
      const cacheKey = `${USER_TIER_CACHE_KEY}_${userId}`;
      const expiryKey = `${USER_TIER_EXPIRY_KEY}_${userId}`;
      const versionKey = `${USER_TIER_VERSION_KEY}_${userId}`;

      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(versionKey);

      console.log(`🧹 Cleared user tier cache for user ${userId}`);
    } else {
      // Clear all user tier caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith(USER_TIER_CACHE_KEY) ||
            key.startsWith(USER_TIER_EXPIRY_KEY) ||
            key.startsWith(USER_TIER_VERSION_KEY))
        ) {
          localStorage.removeItem(key);
        }
      }

      console.log("🧹 Cleared all user tier caches from localStorage");
    }
  } catch (error) {
    console.error("🎫 Error clearing user tier cache:", error);
  }
};

/**
 * Set the user tier request in progress status
 */
export const setUserTierRequestInProgress = (inProgress: boolean): void => {
  userTierRequestInProgress = inProgress;
};

/**
 * Get the user tier request in progress status
 */
export const isUserTierRequestInProgress = (): boolean => {
  return userTierRequestInProgress;
};

// Compatibility exports to avoid breaking changes
export const loadCachedFreeProjects = loadCachedProjects;
export const cacheFreeProjects = cacheProjects;
export const FREE_PROJECTS_CACHE_KEY = PROJECTS_CACHE_KEY;
export const CACHE_EXPIRY_KEY = PROJECTS_CACHE_EXPIRY_KEY;
export const CACHE_LAST_UPDATED_KEY = PROJECTS_CACHE_LAST_UPDATED_KEY;
