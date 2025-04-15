"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@clerk/nextjs";

// Token refresh constants
const TOKEN_REFRESH_DEBOUNCE = 60000; // 1 minute minimum between refreshes (increased from 30s)
const TOKEN_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased from 5min)
const STORAGE_KEY = "clerk_token_cache";

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
  const hasHydrated = useRef<boolean>(false);

  // Safe sessionStorage operations to avoid hydration issues
  const getStorageItem = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const item = sessionStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn("Error reading cached token:", e);
      return null;
    }
  }, []);

  const setStorageItem = useCallback((value: any) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      console.warn("Error storing cached token:", e);
    }
  }, []);

  // Try to restore cached token from sessionStorage - only on client-side after hydration
  useEffect(() => {
    // Skip if we've already hydrated or if we're on the server
    if (hasHydrated.current || typeof window === "undefined") return;

    // Mark as hydrated immediately to prevent repeat runs
    hasHydrated.current = true;

    // Now safe to access browser storage
    const cachedData = getStorageItem();
    if (cachedData) {
      const { token: cachedToken, expiry } = cachedData;
      if (Date.now() < expiry) {
        setToken(cachedToken);
        tokenExpiry.current = expiry;
      }
    }
  }, [getStorageItem]);

  const fetchToken = useCallback(
    async (forceRefresh = false) => {
      if (!session) {
        setToken(null); // Explicitly set token to null when no session
        return null;
      }

      // Skip if already refreshing
      if (isRefreshing.current) {
        console.log("Token refresh already in progress, skipping");
        return token;
      }

      const now = Date.now();

      // Unless forced, check if we recently refreshed
      if (
        !forceRefresh &&
        now - lastRefreshTime.current < TOKEN_REFRESH_DEBOUNCE
      ) {
        console.log("Token refreshed too recently, using existing token");
        return token;
      }

      // If token is still valid, use it
      if (!forceRefresh && token && now < tokenExpiry.current) {
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

        // Cache token in sessionStorage (only in browser)
        if (typeof window !== "undefined") {
          setStorageItem({
            token: newToken,
            expiry: tokenExpiry.current,
          });
        }

        return newToken;
      } catch (err: unknown) {
        const error =
          err instanceof Error
            ? err
            : new Error("Unknown error fetching token");
        console.error("Error getting token from Clerk:", error);
        setError(error);
        return null;
      } finally {
        setLoading(false);
        isRefreshing.current = false;
      }
    },
    [session, token, setStorageItem]
  );

  // Fetch token on session change, but only if needed
  useEffect(() => {
    // Only attempt to fetch the token if:
    // 1. Clerk session is loaded
    // 2. We don't already have a token
    // 3. Not currently refreshing
    // 4. We're on the client-side (to prevent SSR fetch attempts)
    if (
      isLoaded &&
      !token &&
      !isRefreshing.current &&
      typeof window !== "undefined"
    ) {
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
