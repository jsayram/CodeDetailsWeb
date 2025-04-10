/**
 * Clerk Authentication Webhook Handler
 *
 * Processes Clerk auth events and synchronizes user data with Supabase.
 * Handles: user.created, user.updated, user.deleted, session.created
 */
import { NextResponse } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ClerkUserData } from "@/types/models/clerkUserData";
import { fetchClerkUser } from "@/services/clerkServerFetchUserService";
import { ClerkSessionData } from "@/types/models/clerkSessionData";

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
    data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`
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
  const role = data.public_metadata?.role || "authenticated";
  const tier = data.public_metadata?.tier || "free";

  return {
    user_id,
    email_address,
    first_name,
    last_name,
    full_name,
    username,
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
    role,
    tier,
  } = await extractClerkUserData(data);
  console.log(
    `Creating user: ${user_id} in Supabase profiles (no collisions assumed)`
  );

  // Insert without conflict
  const { error } = await supabaseServer.from("profiles").insert([
    {
      user_id,
      email_address,
      first_name,
      full_name,
      last_name,
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
    message: "User created successfully (no collisions)",
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

// Cache to track recently verified user IDs and prevent redundant DB checks
const recentlyVerifiedUsers = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Handle session.created
async function handleSessionCreated(data: ClerkSessionData) {

  // Extract the user ID from the session data
  const userId = data.user_id;

  if (!userId) {
    console.error("No user ID found in session data");
    return NextResponse.json(
      { error: "Invalid session data" },
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
    // Update the cache with current timestamp
    recentlyVerifiedUsers.set(userId, now);
    // Clean up old cache entries periodically
    if (recentlyVerifiedUsers.size > 100) {
      // Arbitrary limit
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

  try {
    // Fetch user data from Clerk API using our implemented service
    const { data: clerkUser, error } = await fetchClerkUser(userId);

    if (error || !clerkUser) {
      console.error(`Failed to fetch Clerk user data for ${userId}:`, error);
      return NextResponse.json(
        { error: "Failed to synchronize user profile" },
        { status: 500 }
      );
    }

    // Use existing handleUserCreated function to create profile
    const result = await handleUserCreated(clerkUser);
    recentlyVerifiedUsers.set(userId, now);
    return result;
  } catch (error) {
    console.error("Error syncing profile from session:", error);
    return NextResponse.json(
      { error: "Error synchronizing user profile" },
      { status: 500 }
    );
  }
}

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
  try {
    const event: WebhookEvent = await req.json();
    const { type: eventType } = event;
    
    // Handle different data types based on event type
    switch (eventType) {
      case "user.created": {
        const { data } = event as { type: string; data: ClerkUserData };
        console.log("Raw Clerk user.created event:", JSON.stringify(data, null, 2));
        return await handleUserCreated(data);
      }
      
      case "user.updated": {
        const { data } = event as { type: string; data: ClerkUserData };
        console.log("Raw Clerk user.updated event:", JSON.stringify(data, null, 2));
        return await handleUserUpdated(data);
      }
      
      case "user.deleted": {
        const { data } = event as { type: string; data: ClerkUserData };
        console.log("Raw Clerk user.deleted event:", JSON.stringify(data, null, 2));
        return await handleUserDeleted(data);
      }
      
      case "session.created": {
        const { data } = event as { type: string; data: ClerkSessionData };
        console.log("Raw Clerk session.created event:", JSON.stringify(data, null, 2));
        return await handleSessionCreated(data);
      }
      
      default:
        console.warn(`Unhandled event type: ${eventType}`);
        return NextResponse.json({ error: "Unhandled event" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}