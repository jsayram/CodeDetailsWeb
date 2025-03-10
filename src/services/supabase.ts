// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
// Get the Supabase URL and Anon Key from the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if the Supabase URL and Anon Key are set in the environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables');
}

// Create a new Supabase client using the Supabase URL and Anon Key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
