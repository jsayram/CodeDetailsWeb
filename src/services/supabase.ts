import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Use a global variable to store the Supabase client instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client, optionally with an authentication token.
 * Uses a single global instance to avoid multiple client initializations.
 * @param {string | null} token - Optional JWT token for authentication.
 * @returns {SupabaseClient} - The Supabase client instance.
 */
const getSupabaseClient = (token?: string | null): SupabaseClient => {
  // Initialize the client only once if it doesn't exist
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // Disable auto-refresh
        persistSession: false, // Disable session persistence
      },
    });
  }
  // Set or clear the session based on token presence
  if (token) {
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  } else {
    supabaseClient.auth.signOut();
  }
  return supabaseClient;
};

/**
 * Returns the anonymous Supabase client.
 * @returns {SupabaseClient} - Supabase client without authentication.
 */
export function getAnonymousClient(): SupabaseClient {
  return getSupabaseClient(null);
}

/**
 * Returns an authenticated Supabase client.
 * @param {string | null} token - The authentication token.
 * @returns {SupabaseClient | null} - Authenticated Supabase client, or null if no token.
 */
export function getAuthenticatedClient(
  token: string | null
): SupabaseClient | null {
  if (!token) {
    return null; // Return null, do NOT call getSupabaseClient with null token.
  }
  return getSupabaseClient(token);
}
