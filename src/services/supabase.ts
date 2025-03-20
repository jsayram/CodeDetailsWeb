import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Define the type for the function parameters
interface SupabaseClientConfig {
  supabaseAccessToken?: string;
}

// Cache clients by their auth token
const clientCache = new Map();

// Create Clerk-authenticated Supabase client
export const createClerkSupabaseClient = ({ supabaseAccessToken }: SupabaseClientConfig = {}) => {
  // Use the token (or 'anonymous') as a cache key
  const cacheKey = supabaseAccessToken || 'anonymous';
  
  // Return cached client if it exists for this token
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }
  
  // Create a new client if no cached version exists
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: supabaseAccessToken ? `Bearer ${supabaseAccessToken}` : '',
      },
    },
  });
  
  // Cache the client for future use with the same token
  clientCache.set(cacheKey, client);
  return client;
};

/**
 * Returns the anonymous Supabase client (cached)
 * @returns Supabase client without authentication
 */
export function getAnonymousClient() {
  return createClerkSupabaseClient();
}

/**
 * Returns an authenticated Supabase client (cached)
 * @param {string} token - The authentication token from Clerk
 * @returns Authenticated Supabase client or null if no token provided
 */
export function getAuthenticatedClient(token: string | null) {
  if (!token) return null;
  return createClerkSupabaseClient({ supabaseAccessToken: token });
}