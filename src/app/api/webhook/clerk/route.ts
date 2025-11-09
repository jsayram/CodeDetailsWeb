/**
 * Clerk Authentication Webhook Handler
 *
 * Processes Clerk auth events and synchronizes user data with Supabase.
 * Handles: user.created, user.updated, user.deleted, session.created, session.removed
 */
import { NextResponse } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ClerkUserData } from "@/types/models/clerkUserData";
import { fetchClerkUser } from "@/services/clerkServerFetchUserService";
import { ClerkSessionData } from "@/types/models/clerkSessionData";
import { Webhook } from "svix";
import { headers } from "next/headers";
import {
  createOrUpdateUserProfile,
  recentlyVerifiedUsers,
  CACHE_TTL,
  cleanupCache,
} from "@/lib/user-sync-utils";

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
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in handleUserCreated:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error creating profile",
        status: "error"
      },
      { status: 500 }
    );
  }
}

// Handle user.updated
async function handleUserUpdated(data: ClerkUserData) {
  console.log(`🔄 Updating user: ${data.id} in Supabase profiles (via webhook)`);
  
  try {
    const result = await createOrUpdateUserProfile(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in handleUserUpdated:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error updating profile",
        status: "error"
      },
      { status: 500 }
    );
  }
}

// Handle user.deleted
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
      console.error("Supabase deletion error:", error);
      return NextResponse.json(
        { error: "Error deleting profile" },
        { status: 500 }
      );
    }

    console.log(`✅ User ${user_id} successfully deleted from profiles`);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in handleUserDeleted:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error deleting profile",
        status: "error"
      },
      { status: 500 }
    );
  }
}

// Handle session.created
async function handleSessionCreated(data: ClerkSessionData) {
  // Extract the user ID from the session data
  const userId = data.user_id;

  if (!userId) {
    console.error("No user ID found in session data");
    return NextResponse.json(
      {
        error: "Invalid session data",
        redirect: "/auth/sign-in",
      },
      { status: 400 }
    );
  }

  // Check if we've recently verified this user to avoid redundant DB checks
  const cachedTimestamp = recentlyVerifiedUsers.get(userId);
  const now = Date.now();

  if (cachedTimestamp && now - cachedTimestamp < CACHE_TTL) {
    console.log(`🔍 User ${userId} was recently verified, skipping DB check`);
    return NextResponse.json({
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
      console.error("Error checking profile existence:", fetchError);
      return NextResponse.json(
        { error: "Error verifying user profile" },
        { status: 500 }
      );
    }

    // User exists in database - update cache and return success
    if (existingProfile) {
      console.log(`✅ User ${userId} profile found and verified`);
      recentlyVerifiedUsers.set(userId, now);
      if (recentlyVerifiedUsers.size > 100) {
        cleanupCache();
      }
      return NextResponse.json({
        message: "User profile verified and in sync",
        status: "ok",
      });
    }

    // User doesn't exist in profiles table, we need to fetch from Clerk and create
    console.log(
      `⚠️ User ${userId} not found in profiles during session creation. Syncing from Clerk...`
    );

    // Fetch user data from Clerk API using our implemented service
    const { data: clerkUser, error } = await fetchClerkUser(userId);

    if (error || !clerkUser) {
      console.error(`Failed to fetch Clerk user data for ${userId}:`, error);
      return NextResponse.json(
        {
          error: "User not found",
          redirect: "/auth/sign-in",
        },
        { status: 404 }
      );
    }

    // Use existing handleUserCreated function to create profile
    const result = await handleUserCreated(clerkUser);
    recentlyVerifiedUsers.set(userId, now);
    return result;
  } catch (error) {
    console.error("Error syncing profile from session:", error);
    return NextResponse.json(
      {
        error: "Error synchronizing user profile",
        redirect: "/auth/sign-in",
      },
      { status: 500 }
    );
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

  return NextResponse.json({
    message: "Session removal processed",
    status: "ok"
  });
}

// Main Webhook Handler for Clerk events
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SIGNING_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers asynchronously
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
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
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 }
    );
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
        console.warn(`Unhandled event type: ${eventType}`);
        return NextResponse.json({ error: "Unhandled event" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}
