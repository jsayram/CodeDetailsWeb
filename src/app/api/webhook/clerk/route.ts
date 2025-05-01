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

// Create a Supabase client (not public) for server-side operations
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  // If tier is not provided in the webhook data, try to get it from cache first, then database
  if (!tier && user_id) {
    // First check if this user was recently verified and is in our cache
    const cachedTimestamp = recentlyVerifiedUsers.get(user_id);
    const now = Date.now();

    if (cachedTimestamp && now - cachedTimestamp < CACHE_TTL) {
      console.log(`🎫 User ${user_id} found in cache, checking for tier`);
      try {
        // Try to get user data from Clerk's APIs if this user was recently verified
        const { data: clerkUserData } = await fetchClerkUser(user_id);

        if (clerkUserData?.public_metadata?.tier) {
          console.log(
            `🎫 Found tier in cached Clerk data: ${clerkUserData.public_metadata.tier}`
          );
          tier = clerkUserData.public_metadata.tier;
        } else {
          console.log(
            `🎫 No tier found in cached Clerk data, will check database`
          );
        }
      } catch (cacheError) {
        console.log("Cache lookup failed, will check database:", cacheError);
      }
    }

    // If still no tier from cache, try the database
    if (!tier) {
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
        console.error("Error fetching existing user tier:", error);
        // Default to undefined so we don't overwrite the tier during updates
        tier = undefined;
      }
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
    tier,
  };
}

// Handle user.created
async function handleUserCreated(data: ClerkUserData) {
  // Function to extract user data from Clerk webhook data
  const {
    user_id,
    email_address,
    first_name,
    last_name,
    full_name,
    username,
    profile_image_url,
    role,
    tier,
  } = await extractClerkUserData(data);
  console.log(
    `Creating user: ${user_id} in Supabase profiles (checking for collisions)`
  );

  // Check if the user already exists in the database
  const { data: existingProfile, error: fetchError } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  // If there was an error other than "no rows found"
  if (fetchError && !fetchError.details?.includes("0 rows")) {
    console.error("Supabase fetch error (user.created):", fetchError);
    return NextResponse.json(
      { error: "Error checking profile existence" },
      { status: 500 }
    );
  }

  // If user already exists, update only different fields (similar to handleUserUpdated)
  if (existingProfile) {
    console.log(
      `User ${user_id} already exists in profiles. Updating different fields only.`
    );

    // Build an object of only changed fields
    const fieldUpdates = [
      { key: "email_address", value: email_address, requireDefined: true },
      { key: "first_name", value: first_name, requireDefined: true },
      { key: "last_name", value: last_name, requireDefined: true },
      { key: "full_name", value: full_name, requireDefined: true },
      { key: "username", value: username, requireDefined: true },
      {
        key: "profile_image_url",
        value: profile_image_url,
        requireDefined: false,
      },
      { key: "role", value: role, requireDefined: false },
      { key: "tier", value: tier, requireDefined: false },
    ];

    // Initialize the updatedFields object
    type ProfileFieldValue = string | number | boolean | null | undefined;
    const updatedFields: Record<string, ProfileFieldValue> = {};

    // Process field updates
    fieldUpdates.forEach(({ key, value, requireDefined }) => {
      if (
        existingProfile[key] !== value &&
        (!requireDefined || value !== undefined)
      ) {
        updatedFields[key] = value;
      }
    });

    // If no fields changed, no need to update
    if (Object.keys(updatedFields).length === 0) {
      console.log("No changes detected, skipping update for existing user");
      return NextResponse.json({
        message: "User already exists and no changes needed",
        status: "unchanged",
      });
    }

    // Perform partial update for existing user
    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update(updatedFields)
      .eq("user_id", user_id);

    if (updateError) {
      console.error(
        "Supabase update error (user collision handling):",
        updateError
      );
      return NextResponse.json(
        { error: "Error updating existing profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Existing user updated successfully with changed fields",
      status: "updated",
    });
  }

  // Create new user if they don't exist yet
  const { error } = await supabaseServer.from("profiles").insert([
    {
      user_id,
      email_address,
      first_name,
      full_name,
      last_name,
      profile_image_url,
      role,
      username,
      tier,
    },
  ]);

  if (error) {
    console.error("Supabase insert error (user.created):", error);
    return NextResponse.json(
      { error: "Error creating profile" },
      { status: 500 }
    );
  }
  return NextResponse.json({
    message: "User created successfully",
    status: "created",
  });
}

// Handle user.updated
async function handleUserUpdated(data: ClerkUserData) {
  // 1. Extract fields from the Clerk event
  const {
    user_id,
    email_address,
    first_name,
    last_name,
    full_name,
    username,
    profile_image_url,
    role,
    tier,
  } = await extractClerkUserData(data);
  console.log(
    `🔄 Updating user: ${user_id} in Supabase profiles (selective field updates)`
  );

  // 1. Fetch existing record
  const { data: existingProfile, error: fetchError } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  // 2. If the user doesn’t exist (0 rows), fallback to handleUserCreated
  if (fetchError && fetchError.details?.includes("0 rows")) {
    console.warn(" No existing profile found. Fallback to create user.");
    return await handleUserCreated(data); // Or any create logic
  } else if (fetchError) {
    // If another error, bail out
    console.error(
      " Could not find existing profile (user.updated):",
      fetchError
    );
    return NextResponse.json(
      { error: "Profile not found for update" },
      { status: 404 }
    );
  }

  // Build an object of only changed fields
  // Define field mappings with validation rules
  const fieldUpdates = [
    //required fields
    { key: "user_id", value: user_id, requireDefined: true },
    { key: "email_address", value: email_address, requireDefined: true },
    { key: "first_name", value: first_name, requireDefined: true },
    { key: "last_name", value: last_name, requireDefined: true },
    { key: "full_name", value: full_name, requireDefined: true },
    { key: "username", value: username, requireDefined: true },
    {
      key: "profile_image_url",
      value: profile_image_url,
      requireDefined: false,
    },
    //optional metadata
    { key: "role", value: role, requireDefined: false },
    { key: "tier", value: tier, requireDefined: false },
  ];

  // Initialize the updatedFields object
  type ProfileFieldValue = string | number | boolean | null | undefined;
  const updatedFields: Record<string, ProfileFieldValue> = {};

  // Process all field updates with one loop
  fieldUpdates.forEach(({ key, value, requireDefined }) => {
    if (
      existingProfile[key] !== value &&
      (!requireDefined || value !== undefined)
    ) {
      updatedFields[key] = value;
    }
  });

  // If no fields changed, no need to update
  if (Object.keys(updatedFields).length === 0) {
    console.log("No changes detected, skipping update");
    return NextResponse.json({ message: "No changes detected" });
  }

  // 3.  Perform partial update
  const { error: updateError } = await supabaseServer
    .from("profiles")
    .update(updatedFields)
    .eq("user_id", user_id);

  if (updateError) {
    console.error("Supabase update error (user.updated):", updateError);
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "User updated successfully with changed fields",
  });
}

// Handle user.deleted
async function handleUserDeleted(data: ClerkUserData) {
  const { id: user_id } = data;

  console.log(`🗑️ Deleting user: ${user_id} from Supabase profiles`);

  const { error } = await supabaseServer.rpc("handle_clerk_deletion_test", {
    _user_id: user_id,
  });

  if (error) {
    console.error("Supabase deletion error:", error);
    return NextResponse.json(
      { error: "Error deleting profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "User deleted successfully" });
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

// Cache to track recently verified user IDs and prevent redundant DB checks
const recentlyVerifiedUsers = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up old entries from the cache
function cleanupCache() {
  const now = Date.now();
  for (const [userId, timestamp] of recentlyVerifiedUsers.entries()) {
    if (now - timestamp > CACHE_TTL) {
      recentlyVerifiedUsers.delete(userId);
    }
  }
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
