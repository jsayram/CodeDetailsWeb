import { useEffect } from "react";
import {
  checkForDataUpdates,
  checkForAuthDataUpdates,
  BACKGROUND_REFRESH_INTERVAL,
} from "@/lib/ProjectsCacheUtils";
import { getAllProjects, getUserProjects } from "@/app/actions/projects";

/**
 * Custom hook to manage background data updates
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
      await checkForDataUpdates(
        isBrowser,
        setHasFetchedFreeProjects,
        getAllProjects
      );
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
      await checkForAuthDataUpdates(
        isBrowser,
        userId,
        setHasFetchedProjects,
        getUserProjects
      );
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
