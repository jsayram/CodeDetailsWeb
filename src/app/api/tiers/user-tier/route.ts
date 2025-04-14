import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/db/server";
import { sql } from "drizzle-orm";

/**
 * API route for getting the current user's subscription tier
 * This is primarily used by the test page to simulate tier-based access
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user's ID
    let userId: string | null = null;
    let userTier: string = "free"; // Default to free tier

    try {
      const authResult = await auth();
      userId = authResult.userId;

      if (userId) {
        console.log(`✅ Successfully authenticated user with ID: ${userId}`);

        // Get user tier from the profiles table
        const userProfile = await executeQuery(async (db) => {
          const profile = await db.execute<{ tier: string }>(
            sql`SELECT tier FROM profiles WHERE user_id = ${userId}`
          );
          return profile;
        });

        // If profile exists and has a tier, use it
        if (userProfile && userProfile.length > 0 && userProfile[0].tier) {
          userTier = userProfile[0].tier;
          console.log(`User ${userId} has tier: ${userTier} (from database)`);
        } else {
          console.log(
            `No tier found for user ${userId}, using default: ${userTier}`
          );
        }
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
    return NextResponse.json({
      success: true,
      tier: userTier,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting user tier:", errorMessage);

    // Even on error, return a valid JSON response with the default tier
    return NextResponse.json({
      success: false,
      tier: "free",
      error: `Failed to get user tier: ${errorMessage}`,
    });
  }
}
