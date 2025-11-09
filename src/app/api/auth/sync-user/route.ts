/**
 * Client-side user sync endpoint
 * Called by the app when a user signs in to ensure they exist in the database
 * This is a fallback for when webhooks aren't available (local dev without ngrok)
 * Uses shared user sync utilities to avoid duplication with webhook logic
 */
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createOrUpdateUserProfile, recentlyVerifiedUsers, CACHE_TTL, cleanupCache } from "@/lib/user-sync-utils";
import { ClerkUserData } from "@/types/models/clerkUserData";

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    // If not authenticated via cookies, try to get userId from request body (for middleware calls)
    let targetUserId: string = userId || "";
    if (!userId) {
      const body = await request.json().catch(() => ({}));
      targetUserId = body.userId || "";
      
      if (!targetUserId) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
    }

    // Check cache to avoid redundant sync attempts
    const cachedTimestamp = recentlyVerifiedUsers.get(targetUserId);
    const now = Date.now();

    if (cachedTimestamp && now - cachedTimestamp < CACHE_TTL) {
      console.log(`🔍 User ${targetUserId} was recently verified, skipping sync`);
      return NextResponse.json({
        status: "cached",
        message: "User recently verified, profile in sync",
      });
    }

    // User doesn't exist or cache expired - fetch from Clerk and sync
    console.log(`🔄 Syncing user ${targetUserId} to database (client-side sync)`);
    
    // Fetch user data from Clerk - use clerkClient if called from middleware, currentUser if authenticated
    let user;
    if (userId) {
      // Regular authenticated request - use currentUser()
      user = await currentUser();
    } else {
      // Middleware request - use clerkClient to fetch by userId
      const client = await clerkClient();
      user = await client.users.getUser(targetUserId);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Could not fetch user data" },
        { status: 500 }
      );
    }

    // Convert Clerk's currentUser() format to ClerkUserData format
    const clerkUserData: ClerkUserData = {
      id: user.id,
      first_name: user.firstName || undefined,
      last_name: user.lastName || undefined,
      email_addresses: user.emailAddresses.map((email) => ({
        email_address: email.emailAddress,
      })),
      username: user.username || undefined,
      profile_image_url: user.imageUrl,
      public_metadata: user.publicMetadata as { role?: string; tier?: string },
    };

    // Use shared utility to create/update user
    const result = await createOrUpdateUserProfile(clerkUserData);

    // Update cache
    recentlyVerifiedUsers.set(targetUserId, now);
    if (recentlyVerifiedUsers.size > 100) {
      cleanupCache();
    }

        console.log(`✅ User ${targetUserId} synced successfully (client-side): ${result.status}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in user sync:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
