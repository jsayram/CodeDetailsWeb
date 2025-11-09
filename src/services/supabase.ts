import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

/**
 * Creates a Supabase client with Clerk authentication.
 * Uses the new native Clerk Supabase integration (replaces deprecated JWT template).
 * @param {() => Promise<string | null>} getToken - Function that returns Clerk token
 * @returns {SupabaseClient} - The Supabase client instance with Clerk auth
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken();

        // Insert the Clerk token into the headers
        const headers = new Headers(options?.headers);
        headers.set("Authorization", `Bearer ${clerkToken}`);

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * DEPRECATED: Old token-based client for backward compatibility.
 * Use createClerkSupabaseClient instead for new code.
 */
const getSupabaseClient = (token?: string | null): SupabaseClient => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (token) {
    client.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  }

  return client;
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
