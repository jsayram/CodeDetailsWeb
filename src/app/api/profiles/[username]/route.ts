import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const profile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, params.username))
        .limit(1);

      return result[0] || null;
    });

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
  { params }: { params: { username: string } }
) {
  try {
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
        .where(eq(profiles.username, params.username))
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
