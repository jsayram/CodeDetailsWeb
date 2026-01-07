import { NextRequest } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { usernameHistory } from "@/db/schema/username-history";
import { eq, or, and } from "drizzle-orm";
import { notFound, serverError, success } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const username = decodeURIComponent(resolvedParams.username);

    // Single query with LEFT JOIN to find profile by:
    // 1. Direct username match
    // 2. Email match
    // 3. Historical username match (via username_history)
    const result = await executeQuery(async (db) => {
      return await db
        .select({
          profile: profiles,
          historyOldUsername: usernameHistory.old_username,
        })
        .from(profiles)
        .leftJoin(
          usernameHistory,
          and(
            eq(usernameHistory.user_id, profiles.user_id),
            eq(usernameHistory.old_username, username)
          )
        )
        .where(
          or(
            eq(profiles.username, username),
            eq(profiles.email_address, username),
            eq(usernameHistory.old_username, username)
          )
        )
        .limit(1);
    });

    if (!result.length) {
      return notFound("profile", { 
        identifier: username, 
        identifierType: "username or email" 
      });
    }

    const { profile, historyOldUsername } = result[0];

    // If we matched via history (old username), return redirect response
    if (historyOldUsername && profile.username !== username) {
      return success({
        redirect: true,
        oldUsername: username,
        currentUsername: profile.username,
        profile,
      });
    }

    // Direct match - return profile
    return success({ profile });
  } catch (error) {
    return serverError(error, "Failed to lookup profile");
  }
}
