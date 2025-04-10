"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@clerk/nextjs";

/**
 * Hook to get and manage the Supabase JWT token from Clerk
 * @returns Object containing token, loading state, and error
 */
export function useSupabaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { session, isLoaded } = useSession(); // Use isLoaded

  const fetchToken = useCallback(async () => {
    if (!session) {
      setToken(null); // Explicitly set token to null when no session
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newToken = await session.getToken({ template: "supabase" });
      setToken(newToken);
      return newToken;
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err : new Error("Unknown error fetching token");
      console.error("Error getting token from Clerk:", error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch token on session change, and when session is loaded
  useEffect(() => {
    if (isLoaded) {
      // Only fetch if Clerk is loaded
      fetchToken();
    }
  }, [fetchToken, isLoaded]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}
