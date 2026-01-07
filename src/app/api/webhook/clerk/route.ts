/**
 * Clerk Authentication Webhook Handler
 *
 * Processes Clerk auth events and synchronizes user data with Supabase.
 * Handles: user.created, user.updated, user.deleted, session.created, session.removed
 */
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ClerkUserData } from "@/types/models/clerkUserData";
import { serverError, invalidInput, notFound, success } from "@/lib/api-errors";
import { fetchClerkUser } from "@/services/clerkServerFetchUserService";
import { ClerkSessionData } from "@/types/models/clerkSessionData";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import {
  createOrUpdateUserProfile,
  recentlyVerifiedUsers,
  CACHE_TTL,
  cleanupCache,
} from "@/lib/user-sync-utils";
import { CACHE_TAGS } from "@/lib/swr-fetchers";

// Create a Supabase client (not public) for server-side operations
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle user.created
async function handleUserCreated(data: ClerkUserData) {
  console.log(`Creating user: ${data.id} in Supabase profiles (via webhook)`);
  
  try {
    const result = await createOrUpdateUserProfile(data);
    
    // Invalidate user profile cache so fresh data is served immediately
    revalidateTag(CACHE_TAGS.USER_PROFILE, {});
    
    return success(result);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Error creating profile");
  }
}

// Handle user.updated
async function handleUserUpdated(data: ClerkUserData) {
  console.log(`🔄 Updating user: ${data.id} in Supabase profiles (via webhook)`);
  
  try {
    const result = await createOrUpdateUserProfile(data);
    
    // Invalidate user profile cache so fresh data is served immediately
    revalidateTag(CACHE_TAGS.USER_PROFILE, {});
    
    return success(result);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Error updating profile");
  }
}

/**
 * Handle user deletion from Clerk
 * 
 * IMPORTANT: This event is currently DISABLED in Clerk dashboard to prevent accidental data loss.
 * 
 * When re-enabling this feature, consider implementing:
 * 1. Soft delete (set deleted_at timestamp) instead of hard delete
 * 2. Cascade deletion of user's projects, favorites, and related data
 * 3. Archive user data for compliance/audit purposes
 * 4. Send notification to user about account deletion
 * 5. Implement grace period (30 days) before permanent deletion
 * 6. Add logging and audit trail for deletion events
 * 
 * Current implementation performs immediate hard delete - use with caution!
 */
async function handleUserDeleted(data: ClerkUserData) {
  const { id: user_id } = data;

  console.log(`🗑️ Deleting user: ${user_id} from Supabase profiles`);

  try {
    // Delete the user's profile from the database
    const { error } = await supabaseServer
      .from("profiles")
      .delete()
      .eq("user_id", user_id);

    if (error) {
      return serverError("Error deleting profile");
    }

    console.log(`✅ User ${user_id} successfully deleted from profiles`);
    
    // Invalidate user profile cache
    revalidateTag(CACHE_TAGS.USER_PROFILE, {});
    
    return success({ message: "User deleted successfully" });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Error deleting profile");
  }
}

// Handle session.created
async function handleSessionCreated(data: ClerkSessionData) {
  // Extract the user ID from the session data
  const userId = data.user_id;

  if (!userId) {
    return invalidInput("No user ID found in session data");
  }

  // Check if we've recently verified this user to avoid redundant DB checks
  const cachedTimestamp = recentlyVerifiedUsers.get(userId);
  const now = Date.now();

  if (cachedTimestamp && now - cachedTimestamp < CACHE_TTL) {
    console.log(`🔍 User ${userId} was recently verified, skipping DB check`);
    return success({
      message: "User recently verified, profile in sync",
    });
  }

  console.log(
    `🔍 Session created for user: ${userId}, checking profile existence`
  );

  try {
    // Check if the user already exists in the database
    const { data: existingProfile, error: fetchError } = await supabaseServer
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && !fetchError.details?.includes("0 rows")) {
      return serverError("Error verifying user profile");
    }

    // User exists in database - update cache and return success
    if (existingProfile) {
      console.log(`✅ User ${userId} profile found and verified`);
      recentlyVerifiedUsers.set(userId, now);
      if (recentlyVerifiedUsers.size > 100) {
        cleanupCache();
      }
      return success({
        message: "User profile verified and in sync",
      });
    }

    // User doesn't exist in profiles table, we need to fetch from Clerk and create
    console.log(
      `⚠️ User ${userId} not found in profiles during session creation. Syncing from Clerk...`
    );

    // Fetch user data from Clerk API using our implemented service
    const { data: clerkUser, error } = await fetchClerkUser(userId);

    if (error || !clerkUser) {
      return notFound("user", { identifier: userId });
    }

    // Use existing handleUserCreated function to create profile
    const result = await handleUserCreated(clerkUser);
    recentlyVerifiedUsers.set(userId, now);
    return result;
  } catch (error) {
    return serverError("Error synchronizing user profile");
  }
}

// Handle session.removed
async function handleSessionRemoved(data: ClerkSessionData) {
  const sessionId = data.id;
  const userId = data.user_id;

  console.log(`🔒 Session removed for user: ${userId}, session: ${sessionId}`);

  // Remove from recently verified users cache if present
  if (recentlyVerifiedUsers.has(userId)) {
    recentlyVerifiedUsers.delete(userId);
    console.log(`🧹 Cleaned up cache entry for user: ${userId}`);
  }

  return success({
    message: "Session removal processed",
  });
}

// Main Webhook Handler for Clerk events
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    return serverError("Webhook secret not configured");
  }

  // Get the headers asynchronously
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return invalidInput("Missing svix headers");
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return invalidInput("Error verifying webhook signature");
  }

  const { type: eventType } = evt;

  // Handle different data types based on event type
  try {
    switch (eventType) {
      case "user.created": {
        const { data } = evt as { type: string; data: ClerkUserData };
        console.log(
          "Raw Clerk user.created event:",
          JSON.stringify(data, null, 2)
        );
        return await handleUserCreated(data);
      }

      case "user.updated": {
        const { data } = evt as { type: string; data: ClerkUserData };
        console.log(
          "Raw Clerk user.updated event:",
          JSON.stringify(data, null, 2)
        );
        return await handleUserUpdated(data);
      }

      case "user.deleted": {
        const { data } = evt as { type: string; data: ClerkUserData };
        console.log(
          "Raw Clerk user.deleted event:",
          JSON.stringify(data, null, 2)
        );
        return await handleUserDeleted(data);
      }

      case "session.created": {
        const { data } = evt as { type: string; data: ClerkSessionData };
        console.log(
          "Raw Clerk session.created event:",
          JSON.stringify(data, null, 2)
        );
        return await handleSessionCreated(data);
      }

      case "session.removed": {
        const { data } = evt as { type: string; data: ClerkSessionData };
        console.log(
          "Raw Clerk session.removed event:",
          JSON.stringify(data, null, 2)
        );
        return await handleSessionRemoved(data);
      }

      default:
        return invalidInput(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    return serverError("Error processing webhook");
  }
}
