import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { usernameHistory } from "@/db/schema/username-history";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    
    const profile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);

      return result[0] || null;
    });

    if (!profile) {
      // Profile not found - check if this is a historical username
      const historyRecord = await executeQuery(async (db) => {
        return await db
          .select()
          .from(usernameHistory)
          .where(eq(usernameHistory.old_username, username))
          .limit(1);
      });

      if (historyRecord.length) {
        // Found in history - look up current username by user_id
        const currentProfile = await executeQuery(async (db) => {
          return await db
            .select()
            .from(profiles)
            .where(eq(profiles.user_id, historyRecord[0].user_id))
            .limit(1);
        });

        if (currentProfile.length) {
          // Return redirect info with current profile
          return NextResponse.json({
            success: true,
            redirect: true,
            oldUsername: username,
            currentUsername: currentProfile[0].username,
            profile: currentProfile[0],
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const body = await request.json();

    const updatedProfile = await executeQuery(async (db) => {
      const [result] = await db
        .update(profiles)
        .set({
          username: body.username,
          email_address: body.email_address,
          profile_image_url: body.profile_image_url,
          updated_at: new Date(),
        })
        .where(eq(profiles.username, username))
        .returning();

      return result;
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
