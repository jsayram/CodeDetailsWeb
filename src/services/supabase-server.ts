import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side use with Clerk authentication.
 * Uses the native Clerk Supabase integration.
 * 
 * @example Server Component
 * ```typescript
 * import { createServerSupabaseClient } from '@/services/supabase-server'
 * 
 * export default async function MyPage() {
 *   const client = await createServerSupabaseClient()
 *   const { data } = await client.from('tasks').select('*')
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 * 
 * @example Server Action
 * ```typescript
 * 'use server'
 * import { createServerSupabaseClient } from '@/services/supabase-server'
 * 
 * export async function addTask(name: string) {
 *   const client = await createServerSupabaseClient()
 *   await client.from('tasks').insert({ name })
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing required Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await (await auth()).getToken();

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
