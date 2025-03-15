import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Type for Clerk-authenticated client configuration
interface SupabaseClientConfig {
  supabaseAccessToken?: string;
}

// Create Clerk-authenticated Supabase client
export const createClerkSupabaseClient = ({ supabaseAccessToken }: SupabaseClientConfig = {}) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
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
};

// Client for public access (browser)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
