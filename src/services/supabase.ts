import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

/**
 * Creates a Supabase client with Clerk authentication.
 * Uses the native Clerk + Supabase integration (Supabase v2.58.5+).
 * 
 * This is the RECOMMENDED way to create authenticated Supabase clients.
 * The Clerk JWT is automatically injected into the Authorization header,
 * and Supabase verifies it natively using the config in supabase/config.toml.
 * 
 * @param {() => Promise<string | null>} getToken - Function that returns Clerk token
 * @returns {SupabaseClient} - The Supabase client instance with Clerk auth
 * 
 * @example Client-side usage
 * ```typescript
 * import { useSession } from '@clerk/nextjs';
 * const { session } = useSession();
 * const client = createClerkSupabaseClient(() => session?.getToken());
 * ```
 * 
 * @example Server-side usage
 * ```typescript
 * import { auth } from '@clerk/nextjs/server';
 * const { getToken } = await auth();
 * const client = createClerkSupabaseClient(() => getToken());
 * ```
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
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }

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
 * Returns an anonymous Supabase client (no authentication).
 * Use this ONLY for public data access that doesn't require authentication.
 * 
 * @returns {SupabaseClient} - Supabase client without authentication
 * 
 * @example
 * ```typescript
 * const client = getAnonymousClient();
 * const { data } = await client.from('public_projects').select('*');
 * ```
 */
export function getAnonymousClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns an authenticated Supabase client using a Clerk token.
 * Uses the Authorization header approach compatible with Clerk's native Supabase integration.
 * 
 * @param {string | null} token - The Clerk authentication token
 * @returns {SupabaseClient | null} - Authenticated Supabase client, or null if no token
 * 
 * @example
 * ```typescript
 * const token = await getToken();
 * const client = getAuthenticatedClient(token);
 * if (client) {
 *   const { data } = await client.from('projects').select('*');
 * }
 * ```
 */
export function getAuthenticatedClient(
  token: string | null
): SupabaseClient | null {
  if (!token) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const headers = new Headers(options?.headers);
        headers.set("Authorization", `Bearer ${token}`);
        
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
