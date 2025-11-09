/**
 * Shared User Sync Utilities
 * 
 * Used by both webhook handlers and middleware sync to avoid code duplication.
 * Provides centralized logic for creating/updating user profiles in Supabase.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ClerkUserData } from "@/types/models/clerkUserData";

// Create a Supabase client with service role (bypasses RLS)
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache to avoid redundant sync attempts (5 minute TTL)
export const recentlyVerifiedUsers = new Map<string, number>();
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up old cache entries
export function cleanupCache() {
  const now = Date.now();
  for (const [userId, timestamp] of recentlyVerifiedUsers.entries()) {
    if (now - timestamp > CACHE_TTL) {
      recentlyVerifiedUsers.delete(userId);
    }
  }
}

// /**
//  * Extract and normalize user data from Clerk (Simple Extraction version)
//  */
// export function extractClerkUserData(data: any) {
//   return {
//     user_id: data.id,
//     email_address: data.email_addresses?.[0]?.email_address || null,
//     first_name: data.first_name || null,
//     last_name: data.last_name || null,
//     full_name: 
//       data.first_name && data.last_name
//         ? `${data.first_name} ${data.last_name}`
//         : data.first_name || data.last_name || null,
//     username: 
//       data.username || 
//       data.email_addresses?.[0]?.email_address?.split("@")[0] || 
//       `user_${data.id.slice(-8)}`,
//     profile_image_url: data.image_url || data.profile_image_url || null,
//     role: data.public_metadata?.role || "authenticated",
//     tier: data.public_metadata?.tier || "free",
//   };
// }

/**
 * Extract and normalize user data from Clerk (Custom Extraction version with fallbacks)
 */
async function extractClerkUserData(data: ClerkUserData) {
  const user_id = data.id; // unique Clerk user ID
  const email_address = data.email_addresses?.[0]?.email_address || "";
  const first_name = data.first_name || "Code";
  const last_name = data.last_name || "Minion";
  const full_name =
    data.full_name || // Use Clerk-provided full name if available
    data.first_name ||
    data.last_name // If either name part exists
      ? `${data.first_name || ""} ${data.last_name || ""}`.trim() // Combine available parts
      : `_${
          data.email_addresses?.[0]?.email_address?.split("@")[0] ||
          "FN_user-" + data.id.substring(5, 15)
        }`;
  const username =
    data.username ||
    data.email_addresses?.[0]?.email_address ||
    "Code_User-" +
      (data.first_name ? data.first_name.substring(0, 3) : "") +
      "_" +
      (data.last_name || data.id.substring(5, 10)); // use email or generate username from first and last name if not provided
  // optional metadata
  const profile_image_url = data.profile_image_url;
  const role = data.public_metadata?.role || "authenticated";

  // Get tier from metadata if provided
  let tier = data.public_metadata?.tier;

  // If tier is not provided, try to get it from the database
  if (!tier && user_id) {
    try {
      // Try to get the existing user data from the database
      const { data: existingUser } = await supabaseServer
        .from("profiles")
        .select("tier")
        .eq("user_id", user_id)
        .single();

      // If the user exists, use their current tier
      if (existingUser && existingUser.tier) {
        console.log(
          `🎫 Using existing tier from database: ${existingUser.tier} for user ${user_id}`
        );
        tier = existingUser.tier;
      } else {
        // For new users, default to 'free'
        tier = "free";
      }
    } catch (error) {
      console.log("Could not fetch existing tier, defaulting to 'free'");
      tier = "free";
    }
  }

  return {
    user_id,
    email_address,
    first_name,
    last_name,
    full_name,
    username,
    profile_image_url,
    role,
    tier: tier || "free",
  };
}

/**
 * Create or update user profile in Supabase
 * This is the main sync function used by both webhooks and middleware
 */
export async function createOrUpdateUserProfile(data: any) {
  const userData = await extractClerkUserData(data);
  const { user_id } = userData;

  console.log(`🔄 Syncing user ${user_id} to Supabase profiles`);

  try {
    // Check if user already exists
    const { data: existingProfile, error: fetchError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error("Error checking for existing profile:", fetchError);
      throw fetchError;
    }

    if (existingProfile) {
      // User exists - update their profile
      console.log(`✅ User ${user_id} already exists, updating profile`);
      
      const { error: updateError } = await supabaseServer
        .from("profiles")
        .update({
          email_address: userData.email_address,
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: userData.full_name,
          username: userData.username,
          profile_image_url: userData.profile_image_url,
          role: userData.role,
          tier: userData.tier,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      return {
        status: "updated",
        message: `User ${user_id} profile updated successfully`,
        user: existingProfile,
      };
    } else {
      // User doesn't exist - create new profile
      console.log(`👤 Creating new profile for user ${user_id}`);
      
      const { data: newProfile, error: insertError } = await supabaseServer
        .from("profiles")
        .insert({
          user_id: userData.user_id,
          email_address: userData.email_address,
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: userData.full_name,
          username: userData.username,
          profile_image_url: userData.profile_image_url,
          role: userData.role,
          tier: userData.tier,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw insertError;
      }

      console.log(`✅ Successfully created profile for user ${user_id}`);
      
      return {
        status: "created",
        message: `User ${user_id} profile created successfully`,
        user: newProfile,
      };
    }
  } catch (error) {
    console.error(`❌ Error syncing user ${user_id}:`, error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      error,
    };
  }
}

/**
 * Sync or create user profile by fetching from Clerk API
 * Used when we only have userId (from middleware or webhook)
 */
export async function syncOrCreateUserProfile(userId: string) {
  console.log(`🔍 Fetching user ${userId} from Clerk API`);

  try {
    // Fetch user data from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      throw new Error(`User ${userId} not found in Clerk`);
    }

    // Use the main sync function
    return await createOrUpdateUserProfile(user);
  } catch (error) {
    console.error(`❌ Error fetching/syncing user ${userId}:`, error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch user from Clerk",
      error,
    };
  }
}
