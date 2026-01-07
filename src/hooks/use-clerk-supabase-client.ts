"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

/**
 * Hook to create a Supabase client for client-side use with Clerk authentication.
 * Uses the native Clerk Supabase integration.
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { useClerkSupabaseClient } from '@/hooks/use-clerk-supabase-client'
 * 
 * export function MyComponent() {
 *   const client = useClerkSupabaseClient()
 *   
 *   async function loadData() {
 *     const { data } = await client.from('tasks').select('*')
 *     console.log(data)
 *   }
 *   
 *   return <button onClick={loadData}>Load Tasks</button>
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing required Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          try {
            const clerkToken = await session?.getToken({ template: "supabase" });

            // Insert the Clerk token into the headers
            const headers = new Headers(options?.headers);
            if (clerkToken) {
              headers.set("Authorization", `Bearer ${clerkToken}`);
            }

            return fetch(url, {
              ...options,
              headers,
            });
          } catch (error) {
            console.error("Error getting Clerk token:", error);
            // Fall back to unauthenticated request
            return fetch(url, options);
          }
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }, [session]);
}
