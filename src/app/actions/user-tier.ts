"use server";

import { executeQuery } from "@/db/server";
import { sql } from "drizzle-orm";
import { ValidTier } from "@/services/tierServiceServer";
import { unstable_cache } from "next/cache";

/**
 * Server action to get a user's subscription tier from the database
 * @param userId - The ID of the user to get the tier for
 * @returns The user's tier, defaulting to 'free' if not found
 */
export async function getUserTier(userId: string): Promise<ValidTier> {
  console.log(`🎫 Server action: Fetching tier for user ${userId}...`);

  try {
    // Use executeQuery to run a parameterized SQL query safely
    const result = await executeQuery(async (db) => {
      const profiles = await db.execute<{ tier: string }>(
        sql`SELECT tier FROM profiles WHERE user_id = ${userId}`
      );

      // Return the tier from the first result, or default to 'free'
      if (profiles && profiles.length > 0 && profiles[0].tier) {
        return profiles[0].tier as ValidTier;
      } else {
        return "free" as ValidTier;
      }
    });

    console.log(`🎫 Server action: User ${userId} has tier: ${result}`);
    return result;
  } catch (error) {
    console.error(`Failed to fetch tier for user ${userId}:`, error);
    // Return default tier on error
    return "free";
  }
}

export const getCachedUserTier = unstable_cache(
  async (userId: string) => getUserTier(userId),
  ['user-tier'],
  {
    revalidate: 300, // 5 minutes - tier changes are infrequent
    tags: ['user-tier']
  }
);
