import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { usernameHistory } from "@/db/schema/username-history";
import { eq, or } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const username = decodeURIComponent(resolvedParams.username);

    const profile = await executeQuery(async (db) => {
      return await db
        .select()
        .from(profiles)
        .where(
          or(
            eq(profiles.username, username),
            eq(profiles.email_address, username)
          )
        )
        .limit(1);
    });

    if (!profile.length) {
      // Profile not found - check if this is a historical username
      const historyRecord = await executeQuery(async (db) => {
        return await db
          .select()
          .from(usernameHistory)
          .where(eq(usernameHistory.old_username, username))
          .limit(1);
      });

      if (historyRecord.length) {
        // Found in history - return redirect info
        const newUsername = historyRecord[0].new_username;
        
        // Verify the new username still exists (in case of multiple changes)
        const currentProfile = await executeQuery(async (db) => {
          return await db
            .select()
            .from(profiles)
            .where(eq(profiles.username, newUsername))
            .limit(1);
        });

        if (currentProfile.length) {
          // Return 301-style redirect response with current profile info
          return NextResponse.json({
            success: true,
            redirect: true,
            oldUsername: username,
            currentUsername: currentProfile[0].username,
            profile: currentProfile[0],
          });
        }
        
        // The new_username in history is also outdated - look up by user_id instead
        const profileByUserId = await executeQuery(async (db) => {
          return await db
            .select()
            .from(profiles)
            .where(eq(profiles.user_id, historyRecord[0].user_id))
            .limit(1);
        });
        
        if (profileByUserId.length) {
          return NextResponse.json({
            success: true,
            redirect: true,
            oldUsername: username,
            currentUsername: profileByUserId[0].username,
            profile: profileByUserId[0],
          });
        }
      }

      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: profile[0],
    });
  } catch (error) {
    console.error("Error looking up profile:", error);
    return NextResponse.json(
      { error: "Failed to lookup profile" },
      { status: 500 }
    );
  }
}
