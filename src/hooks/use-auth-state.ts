import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthStateResult {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isReady: boolean; // New property to indicate auth process is complete
}

/**
 * Custom hook for managing authentication state
 */
export function useAuthState(
  userId: string | null,
  token: string | null,
  client?: SupabaseClient
): AuthStateResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isReady, setIsReady] = useState(false); // New state for tracking when auth is fully ready

  // Track authentication state
  useEffect(() => {
    // Start with "authenticating" state when there's a userId but no firm authentication yet
    if (userId && !isAuthenticated) {
      console.log("🔐 Auth state change: Authenticating");
      console.log("🧑‍💻 User ID:", userId);
      console.log("🔑 Token exists:", !!token);
      setIsAuthenticating(true);
    }

    // If we have both userId and token, we're authenticated
    if (userId && token) {
      console.log("🔐 Auth state change: Authenticated");
      console.log("🧑‍💻 User ID:", userId);
      console.log("🔑 Token exists:", !!token);

      // Only log the change if the state is actually changing
      if (!isAuthenticated) {
        console.log("Auth state changing from false to true");
        setIsAuthenticating(false);
        setIsAuthenticated(true);
      }
      
      // Set ready state after successful authentication
      setIsReady(true);
    } else {
      // No authentication present, reset state
      setIsAuthenticating(false);
      if (isAuthenticated) {
        console.log("Auth state changing from true to false");
        setIsAuthenticated(false);
      }
      // Still mark as ready if we're definitely not authenticating
      if (!userId) {
        setIsReady(true);
      }
    }
  }, [userId, token, isAuthenticated]);

  return { isAuthenticated, isAuthenticating, isReady };
}
