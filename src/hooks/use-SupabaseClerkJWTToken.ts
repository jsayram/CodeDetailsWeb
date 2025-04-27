"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@clerk/nextjs";

// Token refresh constants
const TOKEN_REFRESH_DEBOUNCE = 5 * 60 * 1000; // 5 minutes minimum between refreshes
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache duration
const STORAGE_KEY = "clerk_token_cache";

// Global cache to prevent multiple components from fetching simultaneously
let globalTokenPromise: Promise<string | null> | null = null;
let globalTokenTimeout: NodeJS.Timeout | null = null;

interface TokenCacheData {
  token: string;
  expiry: number;
}

export function useSupabaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { session, isLoaded } = useSession();

  const lastRefreshTime = useRef<number>(0);
  const tokenExpiry = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  const hasHydrated = useRef<boolean>(false);
  const currentToken = useRef<string | null>(null);

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

  const setStorageItem = useCallback((value: TokenCacheData) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      console.warn("Error storing cached token:", e);
    }
  }, []);

  // Try to restore cached token from sessionStorage
  useEffect(() => {
    if (hasHydrated.current || typeof window === "undefined") return;
    hasHydrated.current = true;

    const cachedData = getStorageItem();
    if (cachedData) {
      const { token: cachedToken, expiry } = cachedData;
      if (Date.now() < expiry) {
        setToken(cachedToken);
        currentToken.current = cachedToken;
        tokenExpiry.current = expiry;
      }
    }
  }, [getStorageItem]);

  const fetchToken = useCallback(
    async (forceRefresh = false) => {
      if (!session) {
        setToken(null);
        currentToken.current = null;
        return null;
      }

      const now = Date.now();

      // Use global promise if one is in progress
      if (globalTokenPromise) {
        try {
          const result = await globalTokenPromise;
          if (result) {
            setToken(result);
            currentToken.current = result;
            return result;
          }
        } catch (err) {
          console.warn("Error waiting for global token promise:", err);
        }
      }

      // Check cache conditions unless forced refresh
      if (!forceRefresh) {
        // Use existing token if recently refreshed
        if (now - lastRefreshTime.current < TOKEN_REFRESH_DEBOUNCE) {
          return currentToken.current;
        }

        // Use cached token if still valid
        if (currentToken.current && now < tokenExpiry.current) {
          return currentToken.current;
        }
      }

      // Prevent concurrent refreshes
      if (isRefreshing.current) {
        return currentToken.current;
      }

      setLoading(true);
      setError(null);
      isRefreshing.current = true;

      // Create new global promise
      globalTokenPromise = (async () => {
        try {
          const newToken = await session.getToken({ template: "supabase" });

          // Clear existing timeout if any
          if (globalTokenTimeout) {
            clearTimeout(globalTokenTimeout);
          }

          // Set new timeout to clear the promise
          globalTokenTimeout = setTimeout(() => {
            globalTokenPromise = null;
            globalTokenTimeout = null;
          }, TOKEN_REFRESH_DEBOUNCE);

          // Update state and refs
          setToken(newToken);
          currentToken.current = newToken;
          lastRefreshTime.current = now;
          tokenExpiry.current = now + TOKEN_CACHE_DURATION;

          // Cache in sessionStorage
          if (typeof window !== "undefined" && newToken) {
            setStorageItem({
              token: newToken,
              expiry: tokenExpiry.current,
            });
          }

          return newToken;
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Unknown error fetching token");
          console.error("Error getting token from Clerk:", error);
          setError(error);
          globalTokenPromise = null;
          return null;
        } finally {
          setLoading(false);
          isRefreshing.current = false;
        }
      })();

      return await globalTokenPromise;
    },
    [session, setStorageItem]
  );

  useEffect(() => {
    if (
      isLoaded &&
      session &&
      !currentToken.current &&
      !isRefreshing.current &&
      typeof window !== "undefined"
    ) {
      fetchToken();
    }
  }, [fetchToken, isLoaded, session]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}
