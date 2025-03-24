import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Use a global variable to store the Supabase client instance
let supabaseClient: SupabaseClient | null = null;

// Define the type for the function parameters
interface SupabaseClientConfig {
  supabaseAccessToken?: string | null; // Make the token nullable
}

/**
 * Returns a Supabase client, optionally with an authentication token.
 * Uses a single global instance to avoid multiple client initializations.
 * @param {SupabaseClientConfig} config - Optional configuration object with supabaseAccessToken.
 * @returns {SupabaseClient} - The Supabase client instance.
 */
const getSupabaseClient = (config: SupabaseClientConfig = {}): SupabaseClient => {
    const { supabaseAccessToken } = config;

    // Initialize the client only once if it doesn't exist
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false, // Disable auto-refresh
                persistSession: false,   // Disable session persistence
            },
        });
    }

    // Update the client's authorization header if a token is provided.
    // Important: Do this *outside* the initial client creation.  This allows
    // the client to be re-used for both anonymous and authenticated requests.
    if (supabaseAccessToken) {
        supabaseClient.auth.setSession({
            access_token: supabaseAccessToken,
            refresh_token: '',  //  No refresh token needed for this use case
            expires_in: 0,
            token_type: 'Bearer',
            user: null,
        });
    } else {
        supabaseClient.auth.signOut(); // Ensure we clear any existing session.
    }

    return supabaseClient;
};

/**
 * Returns the anonymous Supabase client.
 * @returns {SupabaseClient} -  Supabase client without authentication.
 */
export function getAnonymousClient(): SupabaseClient {
  return getSupabaseClient({ supabaseAccessToken: null });
}

/**
 * Returns an authenticated Supabase client.
 * @param {string | null} token - The authentication token.
 * @returns {SupabaseClient | null} - Authenticated Supabase client, or null if no token.
 */
export function getAuthenticatedClient(token: string | null): SupabaseClient | null {
    if (!token) {
        return null; //  Return null, do NOT call getSupabaseClient with null token.
    }
    return getSupabaseClient({ supabaseAccessToken: token });
}
