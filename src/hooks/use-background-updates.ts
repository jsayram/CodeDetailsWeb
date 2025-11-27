import { useEffect } from "react";
// NOTE: checkForDataUpdates and checkForAuthDataUpdates have been removed from ProjectsCacheUtils
// This hook is deprecated and not currently in use
// import {
//   checkForDataUpdates,
//   checkForAuthDataUpdates,
//   BACKGROUND_REFRESH_INTERVAL,
// } from "@/lib/ProjectsCacheUtils";
import { getAllProjects, getUserProjects } from "@/app/actions/projects";

const BACKGROUND_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook to manage background data updates
 * NOTE: This hook is currently deprecated and uses non-existent functions
 */
export function useBackgroundUpdates(
  userId: string | null,
  isAuthenticating: boolean,
  isLoading: boolean,
  isAuthenticated: boolean,
  hasFetchedFreeProjects: boolean,
  hasFetchedProjects: boolean,
  isBrowser: boolean,
  setHasFetchedFreeProjects: React.Dispatch<React.SetStateAction<boolean>>,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Set up background checks for non-authenticated users' projects data updates
  useEffect(() => {
    // Skip if user is authenticated or in process of authenticating
    if (userId || isAuthenticating || isLoading) return;

    // Skip if we haven't fetched projects yet
    if (!hasFetchedFreeProjects) return;

    // Do an initial check for updates
    const runCheck = async () => {
      // TODO: Implement checkForDataUpdates or remove this hook
      // await checkForDataUpdates(
      //   isBrowser,
      //   setHasFetchedFreeProjects,
      //   getAllProjects
      // );
      console.warn('Background updates disabled - checkForDataUpdates not available');
    };

    runCheck();

    // Set up interval for background checks
    const intervalId = setInterval(() => {
      runCheck();
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    userId,
    isAuthenticating,
    isLoading,
    hasFetchedFreeProjects,
    isBrowser,
    setHasFetchedFreeProjects,
  ]);

  // Set up background checks for authenticated users' projects data updates
  useEffect(() => {
    // Skip if not authenticated
    if (!userId || !isAuthenticated || isLoading) return;

    // Skip if we haven't fetched authenticated projects yet
    if (!hasFetchedProjects) return;

    // Do an initial check for updates
    const runAuthCheck = async () => {
      // TODO: Implement checkForAuthDataUpdates or remove this hook
      // await checkForAuthDataUpdates(
      //   isBrowser,
      //   userId,
      //   setHasFetchedProjects,
      //   getUserProjects
      // );
      console.warn('Background auth updates disabled - checkForAuthDataUpdates not available');
    };

    runAuthCheck();

    // Set up interval for background checks
    const intervalId = setInterval(() => {
      runAuthCheck();
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    userId,
    isAuthenticated,
    isLoading,
    hasFetchedProjects,
    isBrowser,
    setHasFetchedProjects,
  ]);
}
