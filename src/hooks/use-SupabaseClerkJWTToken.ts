"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@clerk/nextjs";

// Token refresh constants
const TOKEN_REFRESH_DEBOUNCE = 30000; // 30 seconds minimum between refreshes
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to get and manage the Supabase JWT token from Clerk
 * @returns Object containing token, loading state, and error
 */
export function useSupabaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { session, isLoaded } = useSession(); // Use isLoaded
  
  // Add refs for debouncing and caching
  const lastRefreshTime = useRef<number>(0);
  const tokenExpiry = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);

  const fetchToken = useCallback(async () => {
    if (!session) {
      setToken(null); // Explicitly set token to null when no session
      return null;
    }

    // Skip if already refreshing
    if (isRefreshing.current) {
      console.log("Token refresh already in progress, skipping");
      return token;
    }

    // Check if we recently refreshed
    const now = Date.now();
    if (now - lastRefreshTime.current < TOKEN_REFRESH_DEBOUNCE) {
      console.log("Token refreshed too recently, using existing token");
      return token;
    }

    // If token is still valid, use it
    if (token && now < tokenExpiry.current) {
      console.log("Using cached token (still valid)");
      return token;
    }

    setLoading(true);
    setError(null);
    isRefreshing.current = true;

    try {
      console.log("Fetching new Supabase token from Clerk");
      const newToken = await session.getToken({ template: "supabase" });
      setToken(newToken);
      
      // Update our tracking refs
      lastRefreshTime.current = now;
      tokenExpiry.current = now + TOKEN_CACHE_DURATION;
      
      return newToken;
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err : new Error("Unknown error fetching token");
      console.error("Error getting token from Clerk:", error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, [session, token]);

  // Fetch token on session change, and when session is loaded
  useEffect(() => {
    if (isLoaded && !token && !isRefreshing.current) {
      // Only fetch if Clerk is loaded and we don't already have a token
      fetchToken();
    }
  }, [fetchToken, isLoaded, token]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}
