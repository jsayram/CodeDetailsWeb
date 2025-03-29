import { NextResponse } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ClerkUserData } from "@/types";

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

// Main Webhook Handler for Clerk events
export async function POST(req: Request) {
  try {
    const event: WebhookEvent = await req.json();
    const { type: eventType, data } = event as {
      type: string;
      data: ClerkUserData;
    };

    switch (eventType) {
      case "user.created":
        console.log("Raw Clerk event data:", JSON.stringify(data, null, 2));
        return await handleUserCreated(data);

      case "user.updated":
        console.log("Raw Clerk event data:", JSON.stringify(data, null, 2));
        return await handleUserUpdated(data);

      case "user.deleted":
        console.log("Raw Clerk event data:", JSON.stringify(data, null, 2));
        return await handleUserDeleted(data);

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
