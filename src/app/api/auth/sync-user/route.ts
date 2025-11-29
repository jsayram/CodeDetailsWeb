/**
 * Client-side user sync endpoint
 * Called by the app when a user signs in to ensure they exist in the database
 * This is a fallback for when webhooks aren't available (local dev without ngrok)
 * Uses shared user sync utilities to avoid duplication with webhook logic
 */
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createOrUpdateUserProfile, recentlyVerifiedUsers, CACHE_TTL, cleanupCache } from "@/lib/user-sync-utils";
import { ClerkUserData } from "@/types/models/clerkUserData";
import { unauthorized, serverError, success } from "@/lib/api-errors";
import { CACHE_TAGS } from "@/lib/swr-fetchers";

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
        return unauthorized();
      }
    }

    // User doesn't exist or cache expired - fetch from Clerk and sync
    const targetEmail = userId 
      ? (await currentUser())?.emailAddresses[0]?.emailAddress 
      : (await (await clerkClient()).users.getUser(targetUserId))?.emailAddresses[0]?.emailAddress;
    
    console.log(`🔄 Syncing user ${targetUserId} (${targetEmail || 'no email'}) to database (client-side sync)`);
    
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
      return serverError("Could not fetch user data from Clerk");
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

    // Invalidate user profile cache after sync
    revalidateTag(CACHE_TAGS.USER_PROFILE, {});

    console.log(`✅ User ${targetUserId} synced successfully (client-side): ${result.status}`);
    
    return NextResponse.json(result);
  } catch (error) {
    return serverError();
  }
}
