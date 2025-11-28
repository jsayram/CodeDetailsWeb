import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/app/actions/user-tier";
import { success } from "@/lib/api-errors";

/**
 * API route for getting the current user's subscription tier
 * This is primarily used by the test page to simulate tier-based access
 */
export async function GET(_request: NextRequest) {
  try {
    // Get the current user's ID
    let userId: string | null = null;
    let userTier: string = "free"; // Default to free tier

    try {
      const authResult = await auth();
      userId = authResult.userId;

      if (userId) {
        console.log(`✅ Successfully authenticated user with ID: ${userId}`);

        // Get user tier using the dedicated server action
        userTier = await getUserTier(userId);
        console.log(
          `User ${userId} has tier: ${userTier} (from server action)`
        );
      } else {
        console.log("No authenticated user found, using default free tier");
      }
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.log(`❌ Authentication error: ${errorMessage}`);
      console.log("Using default free tier");
    }

    // Return the user's tier as JSON
    return success({ tier: userTier });
  } catch (error) {
    // Even on error, return a valid JSON response with the default tier
    // Note: Using success with fallback tier for graceful degradation
    return success({ tier: "free", fallback: true });
  }
}
