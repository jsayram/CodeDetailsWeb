import { useState, useEffect, useRef } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Interface for authenticated client
 */
interface AuthenticatedClient {
  isAuthenticated?: boolean;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Custom hook for managing authentication state
 */
export function useAuthState(
  userId: string | null,
  token: string | null,
  authenticatedClient: AuthenticatedClient | SupabaseClient | null
) {
  // Auth state tracking
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Track previous userId for detecting auth changes
  const previousUserIdRef = useRef<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const authenticated = Boolean(userId && token && authenticatedClient);

    // Check if user is in the process of signing in (userId exists but not fully authenticated yet)
    const isSigningIn = Boolean(userId && (!token || !authenticatedClient));
    setIsAuthenticating(isSigningIn);

    console.log(
      "🔐 Auth state change:",
      authenticated
        ? "Authenticated"
        : isSigningIn
        ? "Authenticating"
        : "Not authenticated"
    );
    console.log("🧑‍💻 User ID:", userId || "None");
    console.log("🔑 Token exists:", Boolean(token));

    // Check if userId just appeared (user started auth process)
    if (userId && !previousUserIdRef.current) {
      console.log("👤 User started authentication process");
    }

    // Update the previous userId ref
    previousUserIdRef.current = userId;

    // Only update if the state actually changed
    if (authenticated !== isAuthenticated) {
      console.log(
        "Auth state changing from",
        isAuthenticated,
        "to",
        authenticated
      );
      setIsAuthenticated(authenticated);
    }
  }, [userId, token, authenticatedClient, isAuthenticated]);

  return { isAuthenticated, isAuthenticating };
}
